import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { User, type UserDoc } from "@/lib/db/models";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { ValidationError } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/constants";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
};

export type RegisteredUser = {
  userId: string;
  email: string;
  name: string;
};

export async function getUserById(id: string): Promise<UserDoc | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDb();
  return User.findById(id).lean<UserDoc | null>();
}

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  await connectDb();
  return User.findOne({ email: email.toLowerCase().trim() }).lean<UserDoc | null>();
}

export async function registerUser(input: RegisterUserInput): Promise<RegisteredUser> {
  await connectDb();

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();

  const strength = validatePasswordStrength(input.password, { email, name });
  if (!strength.ok) {
    const message =
      strength.reason === "TOO_SHORT"
        ? "Password must be at least 10 characters."
        : (strength.feedback ?? "Password is too weak.");
    throw new ValidationError(message, ERROR_CODES.VALIDATION_FAILED);
  }

  const existing = await User.findOne({ email }).lean<UserDoc | null>();
  if (existing) {
    throw new ValidationError("Email already registered", ERROR_CODES.EMAIL_TAKEN);
  }

  const passwordHash = await hashPassword(input.password);

  const created = await User.create({
    name,
    email,
    passwordHash,
    role: "customer",
    emailVerified: false,
    tier: "silver",
    loyaltyPoints: 0,
    ...(input.referralCode ? { referralCode: input.referralCode.trim() } : {}),
  });

  return {
    userId: created._id.toString(),
    email: created.email,
    name: created.name,
  };
}
