import { connectDb } from "@/lib/db/connect";
import { User, type UserDoc } from "@/lib/db/models";
import { hashPassword } from "@/lib/auth/password";
import type { UserRole } from "@/lib/constants";

export type SeedUserInput = {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  emailVerified?: boolean;
};

export type SeededUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
};

/**
 * Idempotent user seed for tests. Upserts by email so repeated calls in a single
 * test suite do not trip the unique-email index.
 */
export async function seedUser(input: SeedUserInput): Promise<SeededUser> {
  await connectDb();

  const email = input.email.toLowerCase().trim();
  const role: UserRole = input.role ?? "customer";
  const name = input.name ?? email.split("@")[0] ?? "Test User";
  const passwordHash = await hashPassword(input.password);

  const doc = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        passwordHash,
        role,
        emailVerified: input.emailVerified ?? true,
        tier: "silver",
        loyaltyPoints: 0,
        isActive: true,
        deletedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<UserDoc | null>();

  if (!doc) {
    throw new Error(`seedUser: upsert returned null for ${email}`);
  }

  return {
    userId: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role as UserRole,
  };
}
