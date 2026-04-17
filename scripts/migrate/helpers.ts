import type mongoose from "mongoose";
import { connectDb } from "../../src/lib/db/connect.js";

type Db = mongoose.mongo.Db;

/**
 * Why this helper: migration scripts operate at the driver level, not through
 * Mongoose models (models may not exist yet for a brand-new collection).
 */
export async function getDb(): Promise<Db> {
  const mg = await connectDb();
  const db = mg.connection.db;
  if (!db) {
    throw new Error("getDb: mongoose connection has no underlying Db handle");
  }
  return db;
}

export type Migration = {
  /** Called once when the migration runs. Must be idempotent. */
  up: (db: Db) => Promise<void>;
};
