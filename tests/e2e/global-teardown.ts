/**
 * Playwright global teardown.
 *
 * Drops the e2e test database collections so the next run starts clean. Only
 * runs if MONGODB_URI + MONGODB_DB are set and the database name contains the
 * substring `test` or `e2e` — a belt-and-suspenders guard against ever wiping
 * a production database by configuration error.
 */

import mongoose from "mongoose";
import { disconnectTestDb } from "../harness/db";

const SAFE_DB_MARKERS = ["test", "e2e"];

function isSafeToDrop(dbName: string | undefined): dbName is string {
  if (!dbName) return false;
  const normalized = dbName.toLowerCase();
  return SAFE_DB_MARKERS.some((m) => normalized.includes(m));
}

async function globalTeardown(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri || !isSafeToDrop(dbName)) {
    // Refuse to drop if the DB name doesn't look like a test DB.
    // reason: fail-safe. Better to leak fixtures than wipe prod data.
    return;
  }

  try {
    await mongoose.connect(uri, { dbName });
    const db = mongoose.connection.db;
    if (db) {
      await db.dropDatabase();
    }
  } finally {
    await disconnectTestDb();
  }
}

export default globalTeardown;
