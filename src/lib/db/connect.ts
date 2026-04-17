import mongoose from "mongoose";
import type { Mongoose } from "mongoose";

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

/**
 * Why a global cache: Next.js dev server and Jest/vitest hot-reload re-evaluate this
 * module on every change. Without caching on globalThis we would open a new socket pool
 * on each reload and quickly exhaust Atlas connection limits.
 */
declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache =
  globalThis.__mongooseCache ?? (globalThis.__mongooseCache = { conn: null, promise: null });

export async function connectDb(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error("connectDb: MONGODB_URI is not set. Add it to your .env file.");
  }
  if (!dbName) {
    throw new Error("connectDb: MONGODB_DB is not set. Add it to your .env file.");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      dbName,
      bufferCommands: false,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

export async function disconnectDb(): Promise<void> {
  if (cache.conn) {
    await cache.conn.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}
