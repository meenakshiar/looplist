// PRD: TrackStreaks
import { useEffect, useState } from 'react';
import { useCheckInStore } from '@/store';
import HeatMap from '@uiw/react-heat-map';
import { Tooltip } from '@heroui/tooltip';
import { ILoop } from '@/models/Loop';
import { format } from 'date-fns';

interface LoopStatsProps {
    loop: ILoop;
}

export default function LoopStats({ loop }: LoopStatsProps) {
    const { loopStats, fetchLoopStats, isLoadingStats, error } = useCheckInStore();
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Fetch stats when component mounts
    useEffect(() => {
        if (loop?._id) {
            fetchLoopStats(loop._id.toString());
        }
    }, [loop, fetchLoopStats]);

    const stats = loopStats[loop?._id?.toString() || ''];

    // Format check-in data for the heatmap
    const formatHeatmapData = () => {
        if (!stats?.checkInsByDate) return [];

        return Object.entries(stats.checkInsByDate).map(([date, count]) => ({
            date,
            count
        }));
    };

    // Calculate the date range for the heatmap
    const getDateRange = () => {
        if (!stats?.startDate) return { start: new Date(), end: new Date() };

        const startDate = new Date(stats.startDate);
        const endDate = new Date();

        // If start date is less than 1 year ago, show from start date
        // Otherwise, show the last year
        if (endDate.getTime() - startDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            return { start: oneYearAgo, end: endDate };
        }

        return { start: startDate, end: endDate };
    };

    if (!loop) return null;

    return (
        <div className="bg-card border rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {loop.iconEmoji || '📝'} {loop.title}
            </h2>

            {isLoadingStats ? (
                <div className="py-8 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading stats...</p>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-100 text-red-800 rounded-md">
                    Error loading stats: {error}
                </div>
            ) : stats ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-primary/5 p-4 rounded-lg text-center">
                            <h3 className="text-muted-foreground text-sm font-medium">Current Streak</h3>
                            <p className="text-3xl font-bold mt-1">{stats.currentStreak || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">days</p>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg text-center">
                            <h3 className="text-muted-foreground text-sm font-medium">Longest Streak</h3>
                            <p className="text-3xl font-bold mt-1">{stats.longestStreak || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">days</p>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg text-center">
                            <h3 className="text-muted-foreground text-sm font-medium">Completion Rate</h3>
                            <p className="text-3xl font-bold mt-1">{stats.completionRate || 0}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.totalCheckIns || 0}/{stats.expectedCheckIns || 0} days
                            </p>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg text-center">
                            <h3 className="text-muted-foreground text-sm font-medium">Total Check-ins</h3>
                            <p className="text-3xl font-bold mt-1">{stats.totalCheckIns || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">completed</p>
                        </div>
                    </div>

                    {/* Heatmap Toggle Button */}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className="px-4 py-2 border rounded-md hover:bg-secondary transition-colors"
                        >
                            {showHeatmap ? 'Hide Calendar View' : 'Show Calendar View'}
                        </button>
                    </div>

                    {/* Heatmap Calendar */}
                    {showHeatmap && (
                        <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-medium mb-4">Activity Calendar</h3>
                            <div className="overflow-x-auto pb-4">
                                <div className="min-w-[750px]">
                                    <HeatMap
                                        value={formatHeatmapData()}
                                        width={730}
                                        startDate={getDateRange().start}
                                        endDate={getDateRange().end}
                                        rectRender={(props, data) => {
                                            // @ts-ignore - tooltip type issue
                                            return <Tooltip placement="top" content={`${format(new Date(data.date), 'MMM d, yyyy')}: ${data.count || 0} check-ins`}>
                                                <rect {...props} />
                                            </Tooltip>
                                        }}
                                        legendRender={legendData => (
                                            <rect
                                                {...legendData}
                                                rx={2}
                                            />
                                        )}
                                        panelColors={{
                                            0: '#EBEDF0',
                                            1: '#9BE9A8',
                                            3: '#40C463',
                                            5: '#30A14E',
                                            7: '#216E39',
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    <span className="inline-block w-3 h-3 bg-[#EBEDF0] rounded-sm"></span>
                                    <span className="inline-block w-3 h-3 bg-[#9BE9A8] rounded-sm"></span>
                                    <span className="inline-block w-3 h-3 bg-[#40C463] rounded-sm"></span>
                                    <span className="inline-block w-3 h-3 bg-[#30A14E] rounded-sm"></span>
                                    <span className="inline-block w-3 h-3 bg-[#216E39] rounded-sm"></span>
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                    No stats available yet. Start checking in to see your progress!
                </div>
            )}
        </div>
    );
} 