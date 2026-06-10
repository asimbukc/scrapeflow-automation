import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn("WARNING: MONGODB_URI environment variable is not defined in your environment variables.");
}

/**
 * Global state connection cache to avoid creating multiple mongo pools
 * in development due to fast refreshing hot paths.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not configured. Please define it in your environment/secrets.");
    }

    const connectWithRetry = async (retries = 5, initialDelay = 1000) => {
      let delay = initialDelay;
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Connecting to MongoDB (attempt ${i + 1}/${retries})...`);
          const mongooseInstance = await mongoose.connect(uri, opts);
          console.log("Successfully connected to MongoDB via Mongoose client pooling.");
          
          // Lazy-load the daemon to prevent compile-time loading issues
          try {
            const { startScheduler } = await import("./execution/scheduler");
            startScheduler();
          } catch (schedulerErr) {
            console.error("Failed to start automated background scheduler daemon:", schedulerErr);
          }
          
          return mongooseInstance;
        } catch (err) {
          console.error(`MongoDB connection attempt ${i + 1} failed: ${err.message}`);
          if (i === retries - 1) {
            throw err;
          }
          // Retry on typical network/DNS transient errors
          const isTransient = err.message.includes("ECONNREFUSED") || 
                              err.message.includes("ENOTFOUND") || 
                              err.message.includes("querySrv") ||
                              err.message.includes("ETIMEDOUT") ||
                              err.message.includes("TIMEOUT");
          if (!isTransient) {
            throw err; // Fail fast for auth or other static configuration errors
          }
          console.log(`Retrying connection in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        }
      }
    };

    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
