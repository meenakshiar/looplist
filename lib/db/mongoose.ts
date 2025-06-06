// PRD: Auth
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/looplist";

// Define the type for global mongoose cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare global namespace augmentation
declare global {
  var mongoose:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

// Get cached connection
let cached = global.mongoose as MongooseCache;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log("Using existing mongoose connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log(`Connecting to MongoDB: ${MONGODB_URI.substring(0, 20)}...`);

    const opts = {
      bufferCommands: false,
    };
    console.log("oooooooo");
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        mongoose.connection.on("error", (err) => {
          console.error("MongoDB connection error:", err);
        });
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        // For development, allow the app to continue even if MongoDB connection fails
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Running in development mode without MongoDB connection"
          );
          return mongoose; // Return mongoose instance anyway
        }
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Handle connection errors gracefully
    console.error("Failed to establish MongoDB connection:", error);
    if (process.env.NODE_ENV === "development") {
      // In development, return mongoose instance to prevent app from crashing
      return mongoose;
    }
    throw error;
  }
}

export default dbConnect;
