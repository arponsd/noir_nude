import { randomBytes, createHash } from "node:crypto";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { AuthError } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/constants";
import { AuthToken, type AuthTokenType, type AuthTokenDoc } from "./token-store";

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export type GeneratedToken = { raw: string; hashed: string };

export function generateToken(): GeneratedToken {
  const raw = randomBytes(32).toString("hex");
  const hashed = hashToken(raw);
  return { raw, hashed };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function createToken(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AuthError("Invalid user id", ERROR_CODES.TOKEN_INVALID);
  }
  await connectDb();
  const { raw, hashed } = generateToken();
  const expiresAt = new Date(Date.now() + ttlMs);
  await AuthToken.create({
    userId: new Types.ObjectId(userId),
    type,
    tokenHash: hashed,
    expiresAt,
    usedAt: null,
  });
  return raw;
}

async function consumeToken(raw: string, type: AuthTokenType): Promise<AuthTokenDoc> {
  await connectDb();
  const hashed = hashToken(raw);
  const now = new Date();
  const doc = await AuthToken.findOneAndUpdate(
    { tokenHash: hashed, type, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true },
  ).lean<AuthTokenDoc | null>();

  if (!doc) {
    const existing = await AuthToken.findOne({
      tokenHash: hashed,
      type,
    }).lean<AuthTokenDoc | null>();
    if (!existing) {
      throw new AuthError("Invalid token", ERROR_CODES.TOKEN_INVALID);
    }
    if (existing.usedAt) {
      throw new AuthError("Token already used", ERROR_CODES.TOKEN_INVALID);
    }
    if (existing.expiresAt.getTime() <= now.getTime()) {
      throw new AuthError("Token expired", ERROR_CODES.TOKEN_EXPIRED);
    }
    throw new AuthError("Invalid token", ERROR_CODES.TOKEN_INVALID);
  }
  return doc;
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  return createToken(userId, "email_verify", EMAIL_VERIFY_TTL_MS);
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  return createToken(userId, "password_reset", PASSWORD_RESET_TTL_MS);
}

type ConsumedToken = { userId: string };

export async function consumeEmailVerificationToken(raw: string): Promise<ConsumedToken> {
  const doc = await consumeToken(raw, "email_verify");
  return { userId: doc.userId.toString() };
}

export async function consumePasswordResetToken(raw: string): Promise<ConsumedToken> {
  const doc = await consumeToken(raw, "password_reset");
  return { userId: doc.userId.toString() };
}
