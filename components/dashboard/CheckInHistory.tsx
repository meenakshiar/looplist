// PRD: TrackStreaks
import { useEffect, useState } from 'react';
import { useCheckInStore } from '@/store';
import { format } from 'date-fns';
import { ICheckIn } from '@/models/CheckIn';
import { Trash2 } from 'lucide-react';

interface CheckInHistoryProps {
    loopId: string;
}

export default function CheckInHistory({ loopId }: CheckInHistoryProps) {
    const {
        checkIns,
        fetchCheckIns,
        deleteCheckIn,
        isLoadingCheckIns,
        isSubmittingCheckIn,
        error
    } = useCheckInStore();

    useEffect(() => {
        fetchCheckIns(loopId);
    }, [loopId, fetchCheckIns]);

    const handleDeleteCheckIn = async (checkIn: ICheckIn) => {
        if (confirm('Are you sure you want to remove this check-in? This will affect your streak.')) {
            await deleteCheckIn(loopId, new Date(checkIn.date));
        }
    };

    // Show spinner while loading
    if (isLoadingCheckIns) {
        return (
            <div className="py-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading check-ins...</p>
            </div>
        );
    }

    // Show error if there is one
    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-800 rounded-md">
                Error loading check-ins: {error}
            </div>
        );
    }

    // Show message if no check-ins
    if (!checkIns || checkIns.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                No check-ins found. Start tracking your progress by marking days as done!
            </div>
        );
    }

    // Sort check-ins by date (newest first)
    const sortedCheckIns = [...checkIns]
        .filter(c => c.loopId.toString() === loopId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <h3 className="text-lg font-medium mb-4">Recent Check-ins</h3>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="px-4 py-2 text-left font-medium">Date</th>
                            <th className="px-4 py-2 text-left font-medium">Status</th>
                            <th className="px-4 py-2 text-left font-medium">Time</th>
                            <th className="px-4 py-2 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCheckIns.map(checkIn => (
                            <tr key={checkIn._id.toString()} className="border-b hover:bg-muted/20">
                                <td className="px-4 py-3">
                                    {format(new Date(checkIn.date), 'MMM d, yyyy')}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`
                                        inline-flex items-center px-2 py-1 rounded-full text-xs
                                        ${checkIn.status === 'done'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'}
                                    `}>
                                        {checkIn.status === 'done' ? '✓ Completed' : '✗ Missed'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {format(new Date(checkIn.createdAt), 'h:mm a')}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleDeleteCheckIn(checkIn)}
                                        disabled={isSubmittingCheckIn}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                        title="Delete check-in"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 