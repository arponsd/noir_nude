import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ValidationError, ok, safeRoute } from "@/lib/api/response";
import { authLimiter, checkLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { consumePasswordResetToken } from "@/lib/auth/tokens";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { User } from "@/lib/db/models";
import { connectDb } from "@/lib/db/connect";
import { ERROR_CODES } from "@/lib/constants";

function tokenBucketKey(token: string): string {
  // reason: rate-limit by token hash so one attacker with a valid token cannot burn
  //   reset attempts across many accounts; IP would be too broad here.
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

export const POST = safeRoute(async (req: Request) => {
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = resetPasswordSchema.parse(raw);

  await checkLimit(authLimiter, `reset:${tokenBucketKey(parsed.token)}`);
  await connectDb();

  const strength = validatePasswordStrength(parsed.password);
  if (!strength.ok) {
    const message =
      strength.reason === "TOO_SHORT"
        ? "Password must be at least 10 characters."
        : (strength.feedback ?? "Password is too weak.");
    throw new ValidationError(message, ERROR_CODES.VALIDATION_FAILED);
  }

  const { userId } = await consumePasswordResetToken(parsed.token);

  const passwordHash = await hashPassword(parsed.password);

  // ASK(database): please add `passwordChangedAt: Date` to the User schema. Until then we
  // write it with `strict: false` so Mongoose will not drop the field. Used by the JWT
  // session callback to invalidate tokens issued before the change (see docs/11-security).
  await User.findByIdAndUpdate(
    userId,
    { $set: { passwordHash, passwordChangedAt: new Date() } },
    { strict: false },
  );

  return NextResponse.json(ok({ reset: true }));
});
