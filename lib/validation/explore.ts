// PRD: PublicLoopBoard
import { z } from 'zod';

// Validation schema for the reaction API
export const reactionSchema = z.object({
    emoji: z.string().min(1).max(4),
});

// Validation schema for the explore query parameters
export const exploreQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.string().optional().transform((val) => {
        const parsed = parseInt(val || '10');
        return isNaN(parsed) ? 10 : Math.min(Math.max(parsed, 1), 50);
    }),
    frequency: z.string().optional(),
    sortBy: z.enum(['newest', 'mostCheered', 'longestStreak']).optional().default('newest'),
});

// Extract types from schemas
export type ReactionInput = z.infer<typeof reactionSchema>;
export type ExploreQueryInput = z.infer<typeof exploreQuerySchema>; 