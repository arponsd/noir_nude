// reason: Next 15 / Mongoose code we import under test reads process.env at module-import
// time (see @/lib/env and @/lib/db/connect). We must set placeholder env vars BEFORE
// any `@/lib/*` import resolves; the real MONGODB_URI is swapped in beforeAll once the
// in-memory replica set has started. Tests should use `await import(...)` inside hooks
// or tests so the mongo URI swap lands before mongoose connects.
//
// MVP NOTE: for a stricter guarantee across unknown import orders, lift this to a
// Vitest globalSetup file. We haven't needed that yet because our integration tests
// defer `@/lib/...` imports until after beforeAll — but any test that top-level-imports
// `@/lib/db/connect` must be reviewed.
process.env.SKIP_ENV_VALIDATION ??= "1";
// reason: NODE_ENV is typed read-only ("development" | "production" | "test") in
// @types/node. Go through the record-shape view so we can safely default it without
// stepping on TS strict mode. `SKIP_ENV_VALIDATION=1` means env.ts won't validate
// whatever value ends up here — we only need "test" for logger + next code.
(process.env as Record<string, string | undefined>).NODE_ENV ??= "test";
process.env.MONGODB_URI ??= "mongodb://placeholder:27017";
process.env.MONGODB_DB ??= "cosmetic_test";
process.env.NEXTAUTH_SECRET ??= "test-secret-test-secret-test-secret-1234";
process.env.NEXTAUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";

import { afterAll, beforeAll, beforeEach } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replSet: MongoMemoryReplSet | undefined;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = "cosmetic_test";
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
    replSet = undefined;
  }
});
