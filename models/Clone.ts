// PRD: PublicLoopBoard
import mongoose, { Document, Schema, model, Model, Types } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

// Ensure mongoose is connected
dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

/**
 * Clone schema for tracking when users clone others' loops
 * Each record represents a single cloning event
 */
export interface IClone extends Document {
    _id: Types.ObjectId;
    originalLoopId: Types.ObjectId;
    clonedLoopId: Types.ObjectId;
    clonedBy: Types.ObjectId;
    clonedAt: Date;
}

const CloneSchema = new Schema<IClone>(
    {
        originalLoopId: {
            type: Schema.Types.ObjectId,
            ref: 'Loop',
            required: true,
            index: true
        },
        clonedLoopId: {
            type: Schema.Types.ObjectId,
            ref: 'Loop',
            required: true
        },
        clonedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        clonedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Index by clonedBy to quickly query user's cloned loops
CloneSchema.index({ clonedBy: 1 });

// Index by clonedAt for time-based queries
CloneSchema.index({ clonedAt: -1 });

// Check if model exists to avoid recompilation error
let Clone: Model<IClone>;
try {
    // Try to retrieve existing model
    Clone = mongoose.model<IClone>('Clone');
} catch (error) {
    // Model doesn't exist yet, so create it
    Clone = model<IClone>('Clone', CloneSchema);
}

export { Clone }; 