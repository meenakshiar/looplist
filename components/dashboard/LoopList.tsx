// PRD: CreateLoop
import { ILoop } from '@/models/Loop';
import LoopCard from './LoopCard';

interface LoopListProps {
    loops: ILoop[];
}

export default function LoopList({ loops }: LoopListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loops.map((loop) => (
                <LoopCard key={loop._id.toString()} loop={loop} />
            ))}
        </div>
    );
} 