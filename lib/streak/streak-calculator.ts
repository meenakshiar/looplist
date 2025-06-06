// PRD: TrackStreaks
import { CheckIn } from '@/models/CheckIn';
import { Loop } from '@/models/Loop';
import { Types } from 'mongoose';

/**
 * Interface for streak calculation results
 */
interface StreakResult {
    currentStreak: number;
    longestStreak: number;
}

/**
 * Calculate the current and longest streak for a loop
 * 
 * @param loopId - The ID of the loop
 * @param userId - The ID of the user
 * @returns Promise with current and longest streak values
 */
export async function calculateStreaks(
    loopId: string,
    userId: string
): Promise<StreakResult> {
    // Get the loop to check its frequency
    const loop = await Loop.findById(loopId);
    if (!loop) {
        throw new Error('Loop not found');
    }

    // Get all check-ins for this loop in ascending date order
    const checkIns = await CheckIn.find({
        loopId: new Types.ObjectId(loopId),
        userId: new Types.ObjectId(userId),
        status: 'done'
    }).sort({ date: 1 });

    if (checkIns.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let lastCheckInDate: Date | null = null;

    // Determine the frequency pattern to know what days to expect check-ins
    const frequency = loop.frequency;

    // Get expected days based on frequency
    const getExpectedDays = (date: Date): boolean => {
        const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        if (typeof frequency === 'string') {
            switch (frequency) {
                case 'daily':
                    return true; // Every day is expected
                case 'weekdays':
                    return day >= 1 && day <= 5; // Monday-Friday
                case '3x/week':
                    // Default Monday, Wednesday, Friday
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

            // Check if today is in the custom frequency days
            return frequency.some(d => dayMap[d.toLowerCase()] === day);
        }

        return true; // Default to daily if frequency is unknown
    };

    // First, identify missed days and add them as 'missed' entries
    const startDate = new Date(loop.startDate);
    startDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const checkInMap = new Map();
    checkIns.forEach(checkIn => {
        const dateStr = checkIn.date.toISOString().split('T')[0];
        checkInMap.set(dateStr, checkIn);
    });

    // Iterate through all days from start to today
    let tempCurrentStreak = 0;
    let tempLongestStreak = 0;

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        // Only count days that match the frequency pattern
        if (getExpectedDays(d)) {
            const dateStr = d.toISOString().split('T')[0];
            const checkIn = checkInMap.get(dateStr);

            if (checkIn) {
                // Day was checked in
                tempCurrentStreak++;
                tempLongestStreak = Math.max(tempLongestStreak, tempCurrentStreak);
            } else {
                // Day was missed (and should not have been missed)
                // If the date is today, we don't break the streak yet - give the user until end of day
                if (d.getTime() < today.getTime()) {
                    tempCurrentStreak = 0; // Break streak on missed days
                }
            }
        }
    }

    // Set final streak values
    currentStreak = tempCurrentStreak;
    longestStreak = tempLongestStreak;

    return { currentStreak, longestStreak };
} 