// PRD: PublicLoopBoard
import { NextRequest, NextResponse } from 'next/server';
import { Loop, Clone } from '@/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Types } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

/**
 * POST /api/loops/:id/clone - Clone a public loop
 * Authentication required
 * 
 * The clone creates a new loop with the same title, frequency, and iconEmoji,
 * but resets the start date to today and sets visibility to private by default.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();

        // Verify authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const loopId = params.id;

        // Validate loopId format
        if (!Types.ObjectId.isValid(loopId)) {
            return NextResponse.json(
                { error: 'Invalid loop ID format' },
                { status: 400 }
            );
        }

        // Check if the loop exists and is public
        const originalLoop = await Loop.findById(loopId);
        if (!originalLoop) {
            return NextResponse.json(
                { error: 'Loop not found' },
                { status: 404 }
            );
        }

        if (originalLoop.visibility !== 'public') {
            return NextResponse.json(
                { error: 'Cannot clone non-public loops' },
                { status: 403 }
            );
        }

        // Check if the user already has a loop with this title
        const existingLoop = await Loop.findOne({
            ownerId: new Types.ObjectId(userId),
            title: originalLoop.title
        });

        if (existingLoop) {
            return NextResponse.json(
                { error: 'You already have a loop with this title' },
                { status: 409 }
            );
        }

        // Create the new cloned loop
        const newLoop = new Loop({
            ownerId: new Types.ObjectId(userId),
            title: originalLoop.title,
            frequency: originalLoop.frequency,
            startDate: new Date(), // Reset to today
            visibility: 'private', // Default to private
            iconEmoji: originalLoop.iconEmoji,
            coverImageUrl: originalLoop.coverImageUrl,
            // Reset streak info
            currentStreak: 0,
            longestStreak: 0,
        });

        // Save the new loop
        await newLoop.save();

        // Record the clone action
        const cloneRecord = new Clone({
            originalLoopId: new Types.ObjectId(loopId),
            clonedLoopId: newLoop._id,
            clonedBy: new Types.ObjectId(userId),
            clonedAt: new Date()
        });

        await cloneRecord.save();

        return NextResponse.json({ loop: newLoop });

    } catch (error) {
        console.error('Error in clone loop API:', error);
        return NextResponse.json(
            { error: 'Failed to clone loop' },
            { status: 500 }
        );
    }
} 