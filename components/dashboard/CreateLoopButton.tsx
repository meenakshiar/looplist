// PRD: CreateLoop
import { Plus } from 'lucide-react';

interface CreateLoopButtonProps {
    onClick: () => void;
}

export default function CreateLoopButton({ onClick }: CreateLoopButtonProps) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
            <Plus size={16} />
            <span>New Loop</span>
        </button>
    );
} 