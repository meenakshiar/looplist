// PRD: TrackStreaks
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { CheckIn } from '@/models/CheckIn';
import { Loop } from '@/models/Loop';
import { Types } from 'mongoose';
import { calculateStreaks } from '@/lib/streak/streak-calculator';

/**
 * GET /api/loops/:id/stats
 * Get statistics for a loop including current/longest streak and completion rate
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authenticate user
        const authError = await authMiddleware(request);
        if (authError) {
            return authError;
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID not found in session' },
                { status: 401 }
            );
        }

        const loopId = params.id;

        // Validate the loop exists and belongs to the user
        const loop = await Loop.findOne({
            _id: loopId,
            ownerId: userId
        });

        if (!loop) {
            return NextResponse.json(
                { error: 'Loop not found or not authorized' },
                { status: 404 }
            );
        }

        // Get check-ins for this loop
        const checkIns = await CheckIn.find({
            loopId: new Types.ObjectId(loopId),
            userId: new Types.ObjectId(userId),
            status: 'done'
        }).sort({ date: 1 }); // Sort by date ascending for streak calculation

        // Calculate streaks (ensure they're up to date)
        const streaks = await calculateStreaks(loopId, userId);

        // Count total check-ins
        const totalCheckIns = checkIns.length;

        // Calculate total expected check-ins since start date
        const startDate = new Date(loop.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const daysSinceStart = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);

        // Calculate expected check-ins based on frequency
        let expectedCheckIns = 0;

        if (typeof loop.frequency === 'string') {
            switch (loop.frequency) {
                case 'daily':
                    expectedCheckIns = daysSinceStart;
                    break;
                case 'weekdays':
                    // Count only weekdays (Monday-Friday)
                    for (let i = 0; i < daysSinceStart; i++) {
                        const date = new Date(startDate);
                        date.setDate(date.getDate() + i);
                        const day = date.getDay();
                        if (day >= 1 && day <= 5) { // 0 is Sunday, 6 is Saturday
                            expectedCheckIns++;
                        }
                    }
                    break;
                case '3x/week':
                    // Simplified assumption: 3 days per week
                    expectedCheckIns = Math.floor(daysSinceStart / 7 * 3);
                    if (daysSinceStart % 7 >= 3) expectedCheckIns++;
                    break;
                default:
                    expectedCheckIns = daysSinceStart;
            }
        } else if (Array.isArray(loop.frequency)) {
            // Custom frequency (specific days of week)
            const frequencyDays = loop.frequency.map(day => {
                switch (day.toLowerCase()) {
                    case 'mon': return 1;
                    case 'tue': return 2;
                    case 'wed': return 3;
                    case 'thu': return 4;
                    case 'fri': return 5;
                    case 'sat': return 6;
                    case 'sun': return 0;
                    default: return -1;
                }
            }).filter(day => day !== -1);

            // Count expected days based on custom frequency
            for (let i = 0; i < daysSinceStart; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                if (frequencyDays.includes(date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
                    expectedCheckIns++;
                }
            }
        }

        // Calculate completion rate
        const completionRate = expectedCheckIns > 0
            ? Math.round((totalCheckIns / expectedCheckIns) * 100)
            : 100; // If no expected check-ins yet, set to 100%

        // Group check-ins by month for the heatmap
        const checkInsByDate = checkIns.reduce((acc, checkIn) => {
            const dateStr = checkIn.date.toISOString().split('T')[0];
            acc[dateStr] = (acc[dateStr] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
            totalCheckIns,
            expectedCheckIns,
            completionRate,
            checkInsByDate,
            startDate: loop.startDate
        });
    } catch (error) {
        console.error('Get loop stats error:', error);
        return NextResponse.json(
            { error: 'Failed to get loop statistics' },
            { status: 500 }
        );
    }
} 