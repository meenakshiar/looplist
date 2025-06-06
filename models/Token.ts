// PRD: Auth
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

// Ensure mongoose is connected
dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

// Check if we're in Edge runtime (middleware)
const isEdgeRuntime = typeof process !== 'undefined' &&
    process.env.NEXT_RUNTIME === 'edge';

const TokenSchema = new mongoose.Schema({
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
    type: {
        type: String,
        required: true,
        enum: ['verification', 'reset', 'refresh']
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
let Token: any;

if (isEdgeRuntime) {
    // Minimal mock for Edge runtime only
    Token = {
        findOne: async () => null,
        create: async (data: any) => ({ _id: 'edge-id', ...data }),
        deleteOne: async () => ({ deletedCount: 0 }),
        deleteMany: async () => ({ deletedCount: 0 }),
        select: () => ({
            findOne: async () => null
        })
    };
    console.warn('Using minimal Token model in Edge runtime');
} else {
    // For non-Edge environments, use the real mongoose model
    // First, try to remove the existing model to force schema update
    try {
        if (mongoose.models.Token) {
            delete mongoose.models.Token;
        }
        Token = mongoose.model('Token', TokenSchema);
    } catch (error) {
        console.error('Error creating Token model:', error);
        Token = mongoose.model('Token');
    }
}

export default Token; 