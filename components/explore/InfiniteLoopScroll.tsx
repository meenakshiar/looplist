// PRD: PublicLoopBoard
'use client';

import { useEffect, useRef, useState } from 'react';
import { useExploreStore } from '@/store/slices/exploreSlice';
import { PublicLoopCard } from './PublicLoopCard';
import { Button } from '@heroui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { Alert } from '@heroui/alert';

export const InfiniteLoopScroll = () => {
    const {
        loops,
        nextCursor,
        isLoading,
        isLoadingMore,
        error,
        fetchPublicLoops,
        fetchMoreLoops
    } = useExploreStore();

    const [showManualLoadMore, setShowManualLoadMore] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Fetch initial data on mount
    useEffect(() => {
        fetchPublicLoops();

        // Cleanup on unmount
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [fetchPublicLoops]);

    // Setup intersection observer for infinite scroll
    useEffect(() => {
        const shouldObserve = !isLoading && !isLoadingMore && nextCursor && loadMoreRef.current;

        if (shouldObserve) {
            // Disconnect existing observer if any
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            // Setup new observer
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    // When load more sentinel is visible and we're not already loading
                    if (entries[0].isIntersecting && nextCursor && !isLoadingMore) {
                        // After 3 automatic loads, switch to manual button to avoid 
                        // unexpected data consumption on mobile
                        if (loops.length >= 30) {
                            setShowManualLoadMore(true);
                        } else {
                            fetchMoreLoops();
                        }
                    }
                },
                { threshold: 0.5 }
            );

            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loops.length, nextCursor, isLoading, isLoadingMore, fetchMoreLoops]);

    // Handle retry when fetch fails
    const handleRetry = () => {
        if (loops.length === 0) {
            fetchPublicLoops();
        } else {
            fetchMoreLoops();
        }
    };

    // Handle manual load more button click
    const handleLoadMore = () => {
        fetchMoreLoops();
    };

    if (isLoading && loops.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && loops.length === 0) {
        return (
            <Alert variant="faded"
            
            className="my-4"
            description={
                <span>Failed to load loops: {error}</span>
            }
            endContent={
                <Button variant="flat" size="sm" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                </Button>
            }
            />
          
        );
    }

    return (
        <div className="space-y-4 pb-8">
            {/* Loop cards */}
            {loops.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loops.map((loop) => (
                        <PublicLoopCard key={loop.loopId} loop={loop} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    No public loops found. Try changing your filters.
                </div>
            )}

            {/* Load more area - this will either show loading indicator, 
          manual load more button, or end of content message */}
            {loops.length > 0 && (
                <div
                    ref={loadMoreRef}
                    className="py-8 flex justify-center"
                >
                    {isLoadingMore ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : nextCursor ? (
                        showManualLoadMore ? (
                            <Button variant="flat" onClick={handleLoadMore}>
                                Load More
                            </Button>
                        ) : null
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            You've seen all loops
                        </div>
                    )}
                </div>
            )}

            {/* Error loading more */}
            {error && loops.length > 0 && isLoadingMore && (
                <Alert variant="faded"
                
                className="mt-4"
                description={
                    <span>Failed to load more loops: {error}</span>
                }
                endContent={
                    <Button variant="flat" size="sm" onClick={handleRetry}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                    </Button>
                }
                />
            )}
        </div>
    );
}; 