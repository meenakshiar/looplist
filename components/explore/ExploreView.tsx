// PRD: PublicLoopBoard
'use client';

import { ExploreHeader } from './ExploreHeader';
import { InfiniteLoopScroll } from './InfiniteLoopScroll';
import { Button } from '@heroui/button';
import { ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ExploreView = () => {
    const [showScrollToTop, setShowScrollToTop] = useState(false);

    // Handle scroll event to show/hide "Back to Top" button
    useEffect(() => {
        const handleScroll = () => {
            // Show button when scrolled down 500px
            setShowScrollToTop(window.scrollY > 500);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle "Back to Top" button click
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto max-w-6xl px-4 pb-16">
            {/* Header with filters */}
            <ExploreHeader />

            {/* Main content with infinite scroll */}
            <main className="mt-4">
                <InfiniteLoopScroll />
            </main>

            {/* Back to Top button */}
            {showScrollToTop && (
                <Button
                    className="fixed bottom-4 right-4 rounded-full h-10 w-10 p-0 shadow-lg z-10"
                    onClick={scrollToTop}
                    aria-label="Back to top"
                >
                    <ChevronUp className="h-6 w-6" />
                </Button>
            )}
        </div>
    );
}; 