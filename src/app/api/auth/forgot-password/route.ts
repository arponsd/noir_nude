import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { authLimiter, checkLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { getUserByEmail } from "@/lib/services/user";
import { createPasswordResetToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/services/email";
import { connectDb } from "@/lib/db/connect";
import logger from "@/lib/utils/logger";

export const POST = safeRoute(async (req: Request) => {
  await checkLimit(authLimiter, `forgot:${getClientIp(req)}`);
  await connectDb();

  const raw: unknown = await req.json().catch(() => ({}));
  const { email } = forgotPasswordSchema.parse(raw);

  const user = await getUserByEmail(email);

  // Always respond success to prevent account enumeration.
  if (user) {
    try {
      const rawToken = await createPasswordResetToken(user._id.toString());
      await sendPasswordResetEmail(user.email, rawToken, user.name);
    } catch (err) {
      // reason: swallow internal errors here to keep the response uniform — log for ops.
      logger.error({ err, userId: user._id.toString() }, "password reset dispatch failed");
    }
  } else {
    logger.info({ email }, "forgot-password: no account for email (response still success)");
  }

  return NextResponse.json(ok({ delivered: true }));
});
