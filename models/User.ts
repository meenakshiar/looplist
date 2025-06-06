// PRD: Auth
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

// Ensure mongoose is connected
dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

// Check if we're in Edge runtime (middleware)
const isEdgeRuntime = typeof process !== 'undefined' &&
    process.env.NEXT_RUNTIME === 'edge';

// Define the schema
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    passwordHash: {
        type: String,
        required: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the 'updatedAt' field on save
UserSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Add helper method to exclude sensitive fields (available on real mongoose model)
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

// If we're in Edge runtime, we need to provide a minimal mock implementation
// In non-Edge environments, we'll use the real mongoose model
let User:any;

if (isEdgeRuntime) {
    // Minimal mock for Edge runtime only
    User = {
        findOne: async () => null,
        findById: async () => null,
        create: async (data: any) => ({ _id: 'edge-id', ...data }),
        updateOne: async () => ({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: async () => ({ deletedCount: 0 }),
        deleteMany: async () => ({ deletedCount: 0 }),
        select: () => ({
            findOne: async () => null,
            findById: async () => null
        })
    };
    console.warn('Using minimal mock User model in Edge runtime');
} else {
    // For all non-Edge environments, use the real mongoose model
    try {
        User = mongoose.model('User');
    } catch (error) {
        User = mongoose.model('User', UserSchema);
    }
}

export default User; 