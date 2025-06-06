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
 * DELETE /api/loops/:id/checkin/:date
 * Delete a check-in for a specific date
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; date: string } }
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
        const dateParam = params.date;

        // Parse the date parameter
        const checkInDate = new Date(decodeURIComponent(dateParam));

        // Validate date
        if (isNaN(checkInDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        // Normalize to midnight UTC
        checkInDate.setUTCHours(0, 0, 0, 0);

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

        // Delete the check-in
        const deleteResult = await CheckIn.deleteOne({
            loopId: new Types.ObjectId(loopId),
            userId: new Types.ObjectId(userId),
            date: checkInDate
        });

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Check-in not found' },
                { status: 404 }
            );
        }

        // Recalculate and update streak metrics
        const updatedStreaks = await calculateStreaks(loopId, userId);

        // Update the loop with new streak metrics
        await Loop.findByIdAndUpdate(loopId, {
            currentStreak: updatedStreaks.currentStreak,
            longestStreak: updatedStreaks.longestStreak
        });

        return NextResponse.json({
            success: true,
            currentStreak: updatedStreaks.currentStreak,
            longestStreak: updatedStreaks.longestStreak
        });
    } catch (error) {
        console.error('Delete check-in error:', error);
        return NextResponse.json(
            { error: 'Failed to delete check-in' },
            { status: 500 }
        );
    }
} 