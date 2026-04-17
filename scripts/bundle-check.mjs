#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";

const BUDGET_KB = 180;
const target = join(process.cwd(), ".next/static/chunks");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (e.name.endsWith(".js")) files.push(p);
  }
  return files;
}

try {
  const files = await walk(target);
  let largest = 0;
  let largestName = "";
  for (const f of files) {
    const buf = await readFile(f);
    const gz = gzipSync(buf).length;
    if (gz > largest) {
      largest = gz;
      largestName = f;
    }
  }
  const kb = (largest / 1024).toFixed(1);
  console.log(`Largest chunk (gz): ${kb} KB — ${largestName}`);
  if (largest > BUDGET_KB * 1024) {
    console.error(`Budget ${BUDGET_KB} KB exceeded.`);
    process.exit(1);
  }
} catch (err) {
  if (err.code === "ENOENT") {
    console.warn("No build output yet — skipping bundle check.");
    process.exit(0);
  }
  throw err;
}
