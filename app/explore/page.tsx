// PRD: PublicLoopBoard
import { Metadata } from 'next';
import { ExploreView } from '@/components/explore/ExploreView';

export const metadata: Metadata = {
    title: 'Explore Public Loops | LoopList',
    description: 'Discover and clone public habit loops from the LoopList community',
};

export default function ExplorePage() {
    return <ExploreView />;
} 