// PRD: CreateLoop
import dbConnect from './mongoose';

// This function ensures we always connect to the real MongoDB
// and never use the mock database
export default async function connectDB() {
    try {
        return await dbConnect();
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw new Error('Database connection failed');
    }
} 