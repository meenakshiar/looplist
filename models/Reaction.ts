// PRD: PublicLoopBoard
import mongoose, { Document, Schema, model, Model, Types } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

// Ensure mongoose is connected
dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

/**
 * Reaction schema for tracking emoji reactions ("Cheers") on loops
 * Each reaction represents a single user's emoji reaction to a loop
 */
export interface IReaction extends Document {
    _id: Types.ObjectId;
    loopId: Types.ObjectId;
    userId: Types.ObjectId;
    emoji: string;
    createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
    {
        loopId: {
            type: Schema.Types.ObjectId,
            ref: 'Loop',
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        emoji: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Create a compound index for loopId and userId to prevent multiple reactions from the same user
// This makes the combination unique - a user can only have one reaction per loop
ReactionSchema.index({ loopId: 1, userId: 1 }, { unique: true });

// Also index by createdAt for sorting queries
ReactionSchema.index({ createdAt: -1 });

// Check if model exists to avoid recompilation error
let Reaction: Model<IReaction>;
try {
    // Try to retrieve existing model
    Reaction = mongoose.model<IReaction>('Reaction');
} catch (error) {
    // Model doesn't exist yet, so create it
    Reaction = model<IReaction>('Reaction', ReactionSchema);
}

export { Reaction }; 