// PRD: Auth
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

// Ensure mongoose is connected
dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

// Check if we're in Edge runtime (middleware)
const isEdgeRuntime = typeof process !== 'undefined' &&
    process.env.NEXT_RUNTIME === 'edge';

const RefreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index, will remove document when expiresAt is reached
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// If we're in Edge runtime, we need to provide a minimal mock implementation
// In non-Edge environments, we'll use the real mongoose model
let RefreshToken: any;

if (isEdgeRuntime) {
    // Minimal mock for Edge runtime only
    RefreshToken = {
        findOne: async () => null,
        create: async (data: any) => ({ _id: 'edge-id', ...data }),
        deleteOne: async () => ({ deletedCount: 0 }),
        deleteMany: async () => ({ deletedCount: 0 }),
        select: () => ({
            findOne: async () => null
        })
    };
    console.warn('Using minimal RefreshToken model in Edge runtime');
} else {
    // For non-Edge environments, use the real mongoose model
    try {
        // Force model recreation
        if (mongoose.models.RefreshToken) {
            delete mongoose.models.RefreshToken;
        }
        RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
    } catch (error) {
        console.error('Error creating RefreshToken model:', error);
        RefreshToken = mongoose.model('RefreshToken');
    }
}

export default RefreshToken; 