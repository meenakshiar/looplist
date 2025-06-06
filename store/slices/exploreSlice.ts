// PRD: PublicLoopBoard
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// Types for the Public Loop Model
export interface PublicLoop {
    loopId: string;
    ownerId: string;
    ownerEmail: string;
    title: string;
    frequency: string | string[];
    currentStreak: number;
    longestStreak: number;
    iconEmoji?: string;
    coverImageUrl?: string;
    cheeredCount: number;
    clonedCount: number;
    createdAt: string;
    // Client-side state
    isReacting?: boolean;
    isCloning?: boolean;
    userReaction?: string;
}

// Filter and sort options
export type SortOption = 'newest' | 'mostCheered' | 'longestStreak';
export type FrequencyFilter = 'all' | 'daily' | 'weekdays' | '3x/week' | 'custom';

// State interface
interface ExploreState {
    // Data
    loops: PublicLoop[];
    nextCursor: string | null;

    // UI state
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;

    // Filters and sorting
    sortBy: SortOption;
    frequencyFilter: FrequencyFilter;

    // Actions
    fetchPublicLoops: () => Promise<void>;
    fetchMoreLoops: () => Promise<void>;
    setSortBy: (sort: SortOption) => void;
    setFrequencyFilter: (filter: FrequencyFilter) => void;
    reactToLoop: (loopId: string, emoji: string) => Promise<void>;
    removeReaction: (loopId: string) => Promise<void>;
    cloneLoop: (loopId: string) => Promise<string | null>; // Returns new loop ID if successful
    resetFilters: () => void;
    reset: () => void;
}

export const useExploreStore = create<ExploreState>()(
    devtools(
        immer((set, get) => ({
            // Initial state
            loops: [],
            nextCursor: null,
            isLoading: false,
            isLoadingMore: false,
            error: null,
            sortBy: 'newest',
            frequencyFilter: 'all',

            // Fetch initial set of public loops
            fetchPublicLoops: async () => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });

                try {
                    const { sortBy, frequencyFilter } = get();

                    // Build query parameters
                    const params = new URLSearchParams();
                    params.append('sortBy', sortBy);
                    if (frequencyFilter !== 'all') {
                        params.append('frequency', frequencyFilter);
                    }

                    // Call the API
                    const response = await fetch(`/api/explore?${params.toString()}`);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch loops: ${response.statusText}`);
                    }

                    const data = await response.json();

                    set((state) => {
                        state.loops = data.loops;
                        state.nextCursor = data.nextCursor;
                        state.isLoading = false;
                    });
                } catch (error) {
                    set((state) => {
                        state.error = (error as Error).message;
                        state.isLoading = false;
                    });
                }
            },

            // Fetch more loops (pagination)
            fetchMoreLoops: async () => {
                const { nextCursor, isLoadingMore, sortBy, frequencyFilter } = get();

                // If already loading or no more data, exit early
                if (isLoadingMore || !nextCursor) return;

                set((state) => {
                    state.isLoadingMore = true;
                });

                try {
                    // Build query parameters
                    const params = new URLSearchParams();
                    params.append('cursor', nextCursor);
                    params.append('sortBy', sortBy);
                    if (frequencyFilter !== 'all') {
                        params.append('frequency', frequencyFilter);
                    }

                    // Call the API
                    const response = await fetch(`/api/explore?${params.toString()}`);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch more loops: ${response.statusText}`);
                    }

                    const data = await response.json();

                    set((state) => {
                        state.loops = [...state.loops, ...data.loops];
                        state.nextCursor = data.nextCursor;
                        state.isLoadingMore = false;
                    });
                } catch (error) {
                    set((state) => {
                        state.error = (error as Error).message;
                        state.isLoadingMore = false;
                    });
                }
            },

            // Update sort option and refetch
            setSortBy: (sort) => {
                set((state) => {
                    state.sortBy = sort;
                    state.loops = [];
                    state.nextCursor = null;
                });

                // Refetch with new sort
                get().fetchPublicLoops();
            },

            // Update frequency filter and refetch
            setFrequencyFilter: (filter) => {
                set((state) => {
                    state.frequencyFilter = filter;
                    state.loops = [];
                    state.nextCursor = null;
                });

                // Refetch with new filter
                get().fetchPublicLoops();
            },

            // React to a loop with an emoji
            reactToLoop: async (loopId, emoji) => {
                // Find the loop in state
                const loopIndex = get().loops.findIndex(loop => loop.loopId === loopId);
                if (loopIndex === -1) return;

                // Set optimistic UI update
                set((state) => {
                    const loop = state.loops[loopIndex];
                    loop.isReacting = true;

                    // If user already reacted, update count appropriately
                    if (!loop.userReaction) {
                        loop.cheeredCount += 1;
                    }
                    loop.userReaction = emoji;
                });

                try {
                    // Call API
                    const response = await fetch(`/api/loops/${loopId}/react`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ emoji }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to react: ${response.statusText}`);
                    }

                    // Update state with success
                    set((state) => {
                        const loop = state.loops[loopIndex];
                        loop.isReacting = false;
                    });
                } catch (error) {
                    // Revert optimistic update on error
                    set((state) => {
                        const loop = state.loops[loopIndex];
                        loop.isReacting = false;

                        // If this was a new reaction, decrement the count
                        if (loop.userReaction === emoji) {
                            loop.cheeredCount -= 1;
                        }
                        loop.userReaction = undefined;

                        state.error = (error as Error).message;
                    });
                }
            },

            // Remove a reaction from a loop
            removeReaction: async (loopId) => {
                // Find the loop in state
                const loopIndex = get().loops.findIndex(loop => loop.loopId === loopId);
                if (loopIndex === -1) return;

                // Get the current user reaction
                const currentReaction = get().loops[loopIndex].userReaction;
                if (!currentReaction) return; // No reaction to remove

                // Set optimistic UI update
                set((state) => {
                    const loop = state.loops[loopIndex];
                    loop.isReacting = true;
                    loop.cheeredCount -= 1;
                    loop.userReaction = undefined;
                });

                try {
                    // Call API
                    const response = await fetch(`/api/loops/${loopId}/react`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to remove reaction: ${response.statusText}`);
                    }

                    // Update state with success
                    set((state) => {
                        const loop = state.loops[loopIndex];
                        loop.isReacting = false;
                    });
                } catch (error) {
                    // Revert optimistic update on error
                    set((state) => {
                        const loop = state.loops[loopIndex];
                        loop.isReacting = false;
                        loop.cheeredCount += 1;
                        loop.userReaction = currentReaction;

                        state.error = (error as Error).message;
                    });
                }
            },

            // Clone a loop
            cloneLoop: async (loopId) => {
                // Find the loop in state
                const loopIndex = get().loops.findIndex(loop => loop.loopId === loopId);
                if (loopIndex === -1) return null;

                // Set optimistic UI update
                set((state) => {
                    const loop = state.loops[loopIndex];
                    loop.isCloning = true;
                    loop.clonedCount += 1;
                });

                try {
                    // Call API
                    const response = await fetch(`/api/loops/${loopId}/clone`, {
                        method: 'POST',
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to clone loop: ${response.statusText}`);
                    }

                    const data = await response.json();

                    // Update state with success
                    set((state) => {
                        const loop = state.loops[loopIndex];
                        loop.isCloning = false;
                    });

                    return data.loop._id;
                } catch (error) {
                    // Revert optimistic update on error
                    set((state) => {
                        const loop = state.loops[loopIndex];
                        loop.isCloning = false;
                        loop.clonedCount -= 1;

                        state.error = (error as Error).message;
                    });

                    return null;
                }
            },

            // Reset filters to default
            resetFilters: () => {
                set((state) => {
                    state.sortBy = 'newest';
                    state.frequencyFilter = 'all';
                    state.loops = [];
                    state.nextCursor = null;
                });

                // Refetch with default filters
                get().fetchPublicLoops();
            },

            // Reset entire store state
            reset: () => {
                set((state) => {
                    state.loops = [];
                    state.nextCursor = null;
                    state.isLoading = false;
                    state.isLoadingMore = false;
                    state.error = null;
                    state.sortBy = 'newest';
                    state.frequencyFilter = 'all';
                });
            }
        }))
    )
); 