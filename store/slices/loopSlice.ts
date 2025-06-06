// PRD: CreateLoop
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ILoop } from '@/models/Loop';

// Type for the form data when creating a loop
export interface CreateLoopForm {
    title: string;
    frequency: string | string[];
    startDate: Date;
    visibility: 'private' | 'public' | 'friends';
    iconEmoji?: string;
    coverImageUrl?: string;
}

// Initial state for the create loop form
const initialFormState: CreateLoopForm = {
    title: '',
    frequency: 'daily',
    startDate: new Date(),
    visibility: 'private',
    iconEmoji: '📝',
    coverImageUrl: '',
};

// Validation errors interface
interface ValidationErrors {
    title?: string;
    frequency?: string;
    startDate?: string;
    visibility?: string;
    iconEmoji?: string;
    coverImageUrl?: string;
}

// Loop store state interface
interface LoopState {
    // User's loops
    loops: ILoop[];
    isLoading: boolean;
    error: string | null;

    // Form state
    createLoopForm: CreateLoopForm;
    validationErrors: ValidationErrors;
    isCreating: boolean;
    showCreateModal: boolean;

    // Actions
    fetchLoops: () => Promise<void>;
    setFormField: <K extends keyof CreateLoopForm>(
        field: K,
        value: CreateLoopForm[K]
    ) => void;
    validateForm: () => boolean;
    createLoop: () => Promise<ILoop | null>;
    resetForm: () => void;
    setShowCreateModal: (show: boolean) => void;
}

export const useLoopStore = create<LoopState>()(
    devtools(
        immer((set, get) => ({
            // State
            loops: [],
            isLoading: false,
            error: null,
            createLoopForm: { ...initialFormState },
            validationErrors: {},
            isCreating: false,
            showCreateModal: false,

            // Actions
            fetchLoops: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/loops', {
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });

                    if (response.status === 401) {
                        // Handle auth errors without redirect
                        set({
                            error: 'Authentication required. Please log in to continue.',
                            isLoading: false
                        });

                        // Do not redirect, AuthGuard will manage route protection
                        return;
                    }

                    if (!response.ok) {
                        throw new Error('Failed to fetch loops');
                    }
                    const data = await response.json();
                    set({ loops: data.loops, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'An error occurred',
                        isLoading: false
                    });
                }
            },

            setFormField: (field, value) => {
                set((state) => {
                    // Update the form field
                    state.createLoopForm[field] = value;

                    // Clear validation error for the field if it exists
                    if (state.validationErrors[field]) {
                        state.validationErrors[field] = undefined;
                    }
                });
            },

            validateForm: () => {
                const { createLoopForm } = get();
                const errors: ValidationErrors = {};
                let isValid = true;

                // Validate title
                if (!createLoopForm.title.trim()) {
                    errors.title = 'Title is required';
                    isValid = false;
                } else if (createLoopForm.title.length > 100) {
                    errors.title = 'Title must be less than 100 characters';
                    isValid = false;
                }

                // Validate frequency
                if (!createLoopForm.frequency) {
                    errors.frequency = 'Frequency is required';
                    isValid = false;
                } else if (
                    Array.isArray(createLoopForm.frequency) &&
                    createLoopForm.frequency.length === 0
                ) {
                    errors.frequency = 'Select at least one day';
                    isValid = false;
                }

                // Validate startDate
                if (!createLoopForm.startDate) {
                    errors.startDate = 'Start date is required';
                    isValid = false;
                }

                // Set validation errors
                set({ validationErrors: errors });
                return isValid;
            },

            createLoop: async () => {
                const isValid = get().validateForm();
                if (!isValid) return null;

                set({ isCreating: true, error: null });
                try {
                    const response = await fetch('/api/loops', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(get().createLoopForm),
                    });

                    const data = await response.json();

                    if (response.status === 401) {
                        set({
                            error: 'Authentication required. Please log in to continue.',
                            isCreating: false
                        });

                        // No navigation on 401
                        return null;
                    }

                    if (!response.ok) {
                        if (response.status === 409) {
                            set((state) => {
                                state.validationErrors.title = 'A loop with this title already exists';
                            });
                            set({ isCreating: false });
                            return null;
                        }
                        throw new Error('Failed to create loop');
                    }

                    set(state => {
                        state.loops.unshift(data.loop);
                        state.isCreating = false;
                        state.createLoopForm = { ...initialFormState };
                    });

                    return data.loop;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'An error occurred',
                        isCreating: false
                    });
                    return null;
                }
            },

            resetForm: () => {
                set({
                    createLoopForm: { ...initialFormState },
                    validationErrors: {},
                });
            },

            setShowCreateModal: (show: boolean) => {
                set({ showCreateModal: show });
                if (!show) {
                    get().resetForm();
                }
            }
        }))
    )
); 