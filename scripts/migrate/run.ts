import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { connectDb, disconnectDb } from "../../src/lib/db/connect.js";
import type { Migration } from "./helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PENDING_DIR = join(__dirname, "pending");
const COLLECTION = "migrations";

type MigrationRecord = { name: string; ranAt: Date };

async function listPendingFiles(): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(PENDING_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return entries.filter((f) => f.endsWith(".ts") || f.endsWith(".mts")).sort();
}

async function main(): Promise<void> {
  const start = Date.now();
  console.log("[migrate] connecting…");
  const mg = await connectDb();
  const db = mg.connection.db;
  if (!db) throw new Error("[migrate] no Db handle on connection");

  const collection = db.collection<MigrationRecord>(COLLECTION);
  await collection.createIndex({ name: 1 }, { unique: true });

  const files = await listPendingFiles();
  if (files.length === 0) {
    console.log("[migrate] no pending migration files");
    return;
  }

  const ran = await collection.find({}).project<{ name: string }>({ name: 1 }).toArray();
  const ranSet = new Set(ran.map((r) => r.name));

  let executed = 0;
  let skipped = 0;

  for (const file of files) {
    if (ranSet.has(file)) {
      skipped++;
      continue;
    }
    const fullPath = join(PENDING_DIR, file);
    const mod = (await import(pathToFileURL(fullPath).href)) as {
      default?: Migration;
      up?: Migration["up"];
    };
    const up = mod.default?.up ?? mod.up;
    if (!up) {
      throw new Error(`[migrate] ${file} has no exported up() function`);
    }
    console.log(`[migrate] running ${file}…`);
    await up(db);
    await collection.insertOne({ name: file, ranAt: new Date() });
    executed++;
  }

  const elapsed = Date.now() - start;
  console.log(`[migrate] done: executed=${executed} skipped=${skipped} in ${elapsed}ms`);
}

main()
  .catch((err) => {
    console.error("[migrate] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDb();
  });
