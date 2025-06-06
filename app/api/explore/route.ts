// PRD: PublicLoopBoard
import { NextRequest, NextResponse } from 'next/server';
import { Loop, User, Reaction, Clone } from '@/models';
import { Types } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';
import { exploreQuerySchema } from '@/lib/validation/explore';

// Default limit for pagination
const DEFAULT_LIMIT = 10;

/**
 * GET /api/explore - Fetch public loops with cursor-based pagination
 * Public endpoint (no auth required)
 *
 * Query parameters:
 * - cursor: string - The cursor for pagination (optional)
 * - limit: number - Number of loops to return (default: 10)
 * - frequency: string - Filter by frequency (optional)
 * - sortBy: string - Sort by 'newest', 'mostCheered', or 'longestStreak' (default: 'newest')
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Extract and validate query parameters
        const url = new URL(req.url);
        const queryParams = {
            cursor: url.searchParams.get('cursor') || undefined,
            limit: url.searchParams.get('limit') || String(DEFAULT_LIMIT),
            frequency: url.searchParams.get('frequency') || undefined,
            sortBy: url.searchParams.get('sortBy') || 'newest',
        };

        // Validate query parameters
        const validationResult = exploreQuerySchema.safeParse(queryParams);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid query parameters', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { cursor, limit, frequency, sortBy } = validationResult.data;

        // Build the base query: all public loops
        const baseQuery: any = { visibility: 'public' };

        // Add cursor-based pagination
        if (cursor) {
            // Assuming cursor is an ObjectId string
            try {
                baseQuery._id = { $lt: new Types.ObjectId(cursor) };
            } catch (error) {
                return NextResponse.json(
                    { error: 'Invalid cursor format' },
                    { status: 400 }
                );
            }
        }

        // Add frequency filter if provided
        if (frequency) {
            baseQuery.frequency = frequency;
        }

        // Determine the sort order based on sortBy parameter
        let sortOptions: any = {};
        switch (sortBy) {
            case 'mostCheered':
                // For this sorting, we'll need to fetch reaction counts separately
                sortOptions = { createdAt: -1 }; // Default, will handle later
                break;
            case 'longestStreak':
                sortOptions = { longestStreak: -1 };
                break;
            case 'newest':
            default:
                sortOptions = { createdAt: -1 };
                break;
        }

        // Fetch the loops
        let loops = await Loop.find(baseQuery)
            .sort(sortOptions)
            .limit(limit + 1) // Fetch one extra to determine if there are more results
            .populate('ownerId', 'email') // Get user email for display
            .lean();

        // Determine if there are more results
        const hasMore = loops.length > limit;
        if (hasMore) {
            // Remove the extra item
            loops = loops.slice(0, limit);
        }

        // Get the next cursor
        const nextCursor = hasMore ? loops[loops.length - 1]._id.toString() : null;

        // For each loop, fetch additional data: reaction counts and clone counts
        const loopsWithCounts = await Promise.all(
            loops.map(async (loop) => {
                // Get reaction (cheer) count
                const cheeredCount = await Reaction.countDocuments({ loopId: loop._id });

                // Get clone count
                const clonedCount = await Clone.countDocuments({ originalLoopId: loop._id });

                // If sorting by mostCheered, we need to fetch reactions for each loop
                // This is more efficient than aggregation for small datasets

                // Extract owner email from the populated field
                const ownerEmail = typeof loop.ownerId === 'object' && loop.ownerId !== null
                    ? (loop.ownerId as any).email
                    : '';

                // Create the public loop response object
                return {
                    loopId: loop._id,
                    ownerId: loop.ownerId._id,
                    ownerEmail: ownerEmail,
                    title: loop.title,
                    frequency: loop.frequency,
                    currentStreak: loop.currentStreak || 0,
                    longestStreak: loop.longestStreak || 0,
                    iconEmoji: loop.iconEmoji,
                    coverImageUrl: loop.coverImageUrl,
                    cheeredCount,
                    clonedCount,
                    createdAt: loop.createdAt
                };
            })
        );

        // If sorting by mostCheered, sort the results in memory
        if (sortBy === 'mostCheered') {
            loopsWithCounts.sort((a, b) => b.cheeredCount - a.cheeredCount);
        }

        // Return the response
        return NextResponse.json({
            loops: loopsWithCounts,
            nextCursor
        });

    } catch (error) {
        console.error('Error in explore API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch public loops' },
            { status: 500 }
        );
    }
} 