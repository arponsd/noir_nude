import { connectDb, disconnectDb } from "../../src/lib/db/connect.js";
import { seedAdminUsers } from "./users.js";
import { seedCategories } from "./categories.js";
import { seedProducts } from "./products.js";
import { seedCoupons } from "./coupons.js";

type SeedResult = { created: number; skipped: number };

function line(label: string, r: SeedResult): string {
  return `  ${label.padEnd(14)} created=${r.created} skipped=${r.skipped}`;
}

async function main(): Promise<void> {
  const start = Date.now();
  console.log("[seed] connecting…");
  await connectDb();

  console.log("[seed] seeding users…");
  const users = await seedAdminUsers();

  console.log("[seed] seeding categories…");
  const categories = await seedCategories();

  console.log("[seed] seeding products…");
  const products = await seedProducts();

  console.log("[seed] seeding coupons…");
  const coupons = await seedCoupons();

  const elapsed = Date.now() - start;
  console.log("\n[seed] summary:");
  console.log(line("users", users));
  console.log(line("categories", categories));
  console.log(line("products", products));
  console.log(line("coupons", coupons));
  console.log(`[seed] done in ${elapsed}ms`);
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDb();
  });
