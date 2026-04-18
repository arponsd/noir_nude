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

// reason: a hanging test is worse than a failing test. With bufferCommands on
// (the default), any query issued before mongoose is connected will silently
// queue and eventually time out; with it off the query throws immediately and
// the failure points directly at the setup bug.
mongoose.set("bufferCommands", false);

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = "cosmetic_test";
});

// Drop state across every connected mongoose instance. Some modules under test
// keep their own connection (e.g. transactions that call `mongoose.createConnection`),
// so iterating `mongoose.connections` — rather than just `mongoose.connection` —
// catches them and prevents state bleed between tests.
beforeEach(async () => {
  for (const conn of mongoose.connections) {
    if (conn.readyState === 1 && conn.db) {
      await conn.db.dropDatabase();
    }
  }
});

afterAll(async () => {
  for (const conn of mongoose.connections) {
    if (conn.readyState !== 0) {
      await conn.close();
    }
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
    replSet = undefined;
  }
});

// ---------------------------------------------------------------------------
// Parallel flakiness note
// ---------------------------------------------------------------------------
// If you see integration tests flake when running in parallel (e.g. two specs
// racing on the same Mongo collection even though each calls dropDatabase in
// beforeEach), it almost always means a module keeps its own mongoose
// connection cached across files and the two files end up pointing at the
// same replica set database.
//
// The fast fix for CI is to disable cross-file parallelism. Vitest exposes
// `--no-file-parallelism` for exactly this. We expose it as a dedicated CI
// script so CI configs do not need to re-derive the flag set:
//
//   pnpm test:integration:ci
//
// Locally, `pnpm test:integration` remains parallel — it's an order of
// magnitude faster and the occasional flake is easier to investigate in dev
// than in CI.
