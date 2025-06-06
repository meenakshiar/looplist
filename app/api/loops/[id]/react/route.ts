// PRD: PublicLoopBoard
import { NextRequest, NextResponse } from 'next/server';
import { Loop, Reaction } from '@/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Types } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';
import { reactionSchema } from '@/lib/validation/explore';

/**
 * POST /api/loops/:id/react - React to a loop with an emoji
 * Authentication required
 * 
 * Request body:
 * - emoji: string - The emoji to react with
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
        const loop = await Loop.findById(loopId);
        if (!loop) {
            return NextResponse.json(
                { error: 'Loop not found' },
                { status: 404 }
            );
        }

        if (loop.visibility !== 'public') {
            return NextResponse.json(
                { error: 'Cannot react to non-public loops' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await req.json();
        const validationResult = reactionSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request body', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { emoji } = validationResult.data;

        // Try to create a new reaction, or update existing one (upsert)
        const reaction = await Reaction.findOneAndUpdate(
            { loopId: new Types.ObjectId(loopId), userId: new Types.ObjectId(userId) },
            { emoji },
            { upsert: true, new: true }
        );

        return NextResponse.json({ reaction });

    } catch (error) {
        // Handle duplicate key error (user already reacted)
        if ((error as any).code === 11000) {
            return NextResponse.json(
                { error: 'You have already reacted to this loop' },
                { status: 409 }
            );
        }

        console.error('Error in loop reaction API:', error);
        return NextResponse.json(
            { error: 'Failed to add reaction' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/loops/:id/react - Remove a reaction from a loop
 * Authentication required
 */
export async function DELETE(
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

        // Delete the reaction
        const result = await Reaction.findOneAndDelete({
            loopId: new Types.ObjectId(loopId),
            userId: new Types.ObjectId(userId)
        });

        if (!result) {
            return NextResponse.json(
                { error: 'Reaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in remove reaction API:', error);
        return NextResponse.json(
            { error: 'Failed to remove reaction' },
            { status: 500 }
        );
    }
} 