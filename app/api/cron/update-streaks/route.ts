// PRD: TrackStreaks
import { NextRequest, NextResponse } from 'next/server';
import { Loop } from '@/models/Loop';
import { CheckIn } from '@/models/CheckIn';
import { calculateStreaks } from '@/lib/streak/streak-calculator';
import { Types } from 'mongoose';

/**
 * GET /api/cron/update-streaks
 * 
 * This endpoint is meant to be called by a scheduled job (e.g., Vercel Cron Jobs)
 * It finds all active loops that should have been checked in yesterday but weren't,
 * marks them as missed, and updates streak metrics.
 * 
 * Note: This should be secured in production with an API key or similar mechanism.
 */
export async function GET(request: NextRequest) {
    try {
        // In production, this should be protected with an API key
        // const apiKey = request.headers.get('x-api-key');
        // if (apiKey !== process.env.CRON_API_KEY) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // Get yesterday's date at midnight UTC
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setUTCHours(0, 0, 0, 0);

        // Get today's date at midnight UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Find all active loops created before yesterday
        const loops = await Loop.find({
            startDate: { $lte: yesterday },
        });

        console.log(`Processing ${loops.length} loops for missed check-ins`);

        let processedCount = 0;
        let missedCount = 0;

        // For each loop, check if there was a check-in yesterday
        for (const loop of loops) {
            // Determine if yesterday was a day the user should have checked in
            const shouldHaveCheckedIn = shouldCheckIn(loop.frequency, yesterday);

            if (!shouldHaveCheckedIn) {
                // Skip if yesterday wasn't a scheduled day for this loop
                continue;
            }

            // Check if there's already a check-in for yesterday
            const existingCheckIn = await CheckIn.findOne({
                loopId: loop._id,
                date: yesterday
            });

            if (!existingCheckIn && shouldHaveCheckedIn) {
                // Mark as missed if there's no check-in but there should have been
                const missedCheckIn = new CheckIn({
                    loopId: loop._id,
                    userId: loop.ownerId,
                    date: yesterday,
                    status: 'missed'
                });

                await missedCheckIn.save();
                missedCount++;

                // Recalculate and update streak metrics
                const streaks = await calculateStreaks(
                    loop._id.toString(),
                    loop.ownerId.toString()
                );

                await Loop.findByIdAndUpdate(loop._id, {
                    currentStreak: streaks.currentStreak,
                    longestStreak: streaks.longestStreak
                });
            }

            processedCount++;
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            missedCheckIns: missedCount,
            date: yesterday.toISOString()
        });
    } catch (error) {
        console.error('Update streaks error:', error);
        return NextResponse.json(
            { error: 'Failed to update streaks' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to determine if a user should have checked in on a given date
 * based on their loop frequency settings
 */
function shouldCheckIn(frequency: string | string[], date: Date): boolean {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (typeof frequency === 'string') {
        switch (frequency) {
            case 'daily':
                return true; // Every day is expected
            case 'weekdays':
                return day >= 1 && day <= 5; // Monday-Friday
            case '3x/week':
                // Default: Monday, Wednesday, Friday
                return day === 1 || day === 3 || day === 5;
            default:
                return true;
        }
    } else if (Array.isArray(frequency)) {
        // Map day names to numbers
        const dayMap: Record<string, number> = {
            'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3,
            'thu': 4, 'fri': 5, 'sat': 6
        };

        // Check if the date is in the custom frequency days
        return frequency.some(d => dayMap[d.toLowerCase()] === day);
    }

    return true; // Default to daily if frequency is unknown
} 