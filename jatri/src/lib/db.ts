import mongoose, { Connection } from "mongoose";

// Disable buffering globally so queries fail fast with clear errors instead of hanging 10 seconds
mongoose.set("bufferCommands", false);

interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

const connectDb = async (): Promise<Connection | null> => {
  const mongodbUrl = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!mongodbUrl) {
    console.warn("MongoDB URI missing in environment variables (MONGODB_URI or MONGODB_URL)");
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };
    cached.promise = mongoose
      .connect(mongodbUrl, opts)
      .then((m) => m.connection)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection error:", error);
    return null;
  }
};

export default connectDb;
