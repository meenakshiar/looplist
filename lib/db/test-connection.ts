// Test MongoDB connection
import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testMongoConnection() {
    const MONGODB_URI = process.env.MONGODB_URI;

    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI exists:', !!MONGODB_URI);
    console.log('MongoDB URI prefix:', MONGODB_URI ? MONGODB_URI.substring(0, 10) + '...' : 'undefined');

    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not defined in environment variables');
        process.exit(1);
    }

    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');

        if (mongoose.connection.db) {
            const dbs = await mongoose.connection.db.admin().listDatabases();
            console.log('Available databases:', dbs.databases.map(db => db.name).join(', '));
        } else {
            console.log('Database connection established but cannot access db property');
        }
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the test
testMongoConnection().catch(console.error); 