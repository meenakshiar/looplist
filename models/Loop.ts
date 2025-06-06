// PRD: CreateLoop
import mongoose, { Document, Schema, model, Model, Types } from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

// Ensure mongoose is connected
dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

export interface ILoop extends Document {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    title: string;
    frequency: string | string[]; // 'daily', 'weekdays', '3x/week' or array of weekdays
    startDate: Date;
    visibility: 'private' | 'public' | 'friends';
    iconEmoji?: string;
    coverImageUrl?: string;
    createdAt: Date;
    currentStreak?: number;
    longestStreak?: number;
}

const LoopSchema = new Schema<ILoop>(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true, maxlength: 100 },
        frequency: {
            type: Schema.Types.Mixed,
            required: true,
            // 'daily', 'weekdays', '3x/week' or Array of weekdays ['mon', 'wed', 'fri']
        },
        startDate: { type: Date, required: true },
        visibility: {
            type: String,
            enum: ['private', 'public', 'friends'],
            default: 'private',
            index: true,
        },
        iconEmoji: { type: String },
        coverImageUrl: { type: String },
        createdAt: { type: Date, default: Date.now },
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Create unique compound index on ownerId and title
LoopSchema.index({ ownerId: 1, title: 1 }, { unique: true });

// Check if the model already exists to prevent recompilation error
// Use a safer approach that doesn't directly access mongoose.models
let Loop: Model<ILoop>;
try {
    // Try to retrieve existing model
    Loop = mongoose.model<ILoop>('Loop');
} catch (error) {
    // Model doesn't exist yet, so create it
    Loop = model<ILoop>('Loop', LoopSchema);
}

export { Loop }; 