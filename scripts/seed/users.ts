import bcrypt from "bcryptjs";
import { User } from "../../src/lib/db/models/index.js";

const DEFAULT_PASSWORD = "ChangeMe!2026";
const BCRYPT_ROUNDS = 12;

type SeedUser = {
  name: string;
  email: string;
  role: "admin" | "manager" | "support";
};

const seedUsers: SeedUser[] = [
  { name: "Admin Root", email: "admin@example.com", role: "admin" },
  { name: "Store Manager", email: "manager@example.com", role: "manager" },
  { name: "Support Agent", email: "support@example.com", role: "support" },
];

export async function seedAdminUsers(): Promise<{ created: number; skipped: number }> {
  const existing = await User.find({ email: { $in: seedUsers.map((u) => u.email) } })
    .select({ email: 1 })
    .lean();
  const existingEmails = new Set(existing.map((u) => u.email));

  let created = 0;
  let skipped = 0;

  for (const entry of seedUsers) {
    if (existingEmails.has(entry.email)) {
      skipped++;
      continue;
    }
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
    await User.create({
      name: entry.name,
      email: entry.email,
      passwordHash,
      role: entry.role,
      emailVerified: true,
      isActive: true,
    });
    created++;
  }

  return { created, skipped };
}
