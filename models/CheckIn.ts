// PRD: TrackStreaks
import mongoose, { Document, Schema, model, Model, Types } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

// Ensure mongoose is connected
dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

/**
 * CheckIn schema for tracking loop completion status
 * Stores each time a user marks a loop as complete for a specific date
 */
export interface ICheckIn extends Document {
    _id: Types.ObjectId;
    loopId: Types.ObjectId;
    userId: Types.ObjectId;
    date: Date;           // Midnight UTC of check-in
    status: 'done' | 'missed';
    createdAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
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
        date: {
            type: Date,
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ['done', 'missed'],
            required: true,
            default: 'done'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Create a compound index for loopId and date to prevent duplicate check-ins
// and for faster querying of loop check-ins by date
CheckInSchema.index({ loopId: 1, date: 1 }, { unique: true });

// Check if the model already exists to prevent recompilation error
let CheckIn: Model<ICheckIn>;
try {
    // Try to retrieve existing model
    CheckIn = mongoose.model<ICheckIn>('CheckIn');
} catch (error) {
    // Model doesn't exist yet, so create it
    CheckIn = model<ICheckIn>('CheckIn', CheckInSchema);
}

export { CheckIn }; 