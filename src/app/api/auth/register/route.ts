import { NextResponse } from "next/server";
import { safeRoute } from "@/lib/api/response";
import { ok } from "@/lib/api/response";
import { authLimiter, checkLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { registerSchema } from "@/lib/validators/auth";
import { registerUser } from "@/lib/services/user";
import { createEmailVerificationToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/services/email";
import { connectDb } from "@/lib/db/connect";
import logger from "@/lib/utils/logger";

export const POST = safeRoute(async (req: Request) => {
  await checkLimit(authLimiter, `register:${getClientIp(req)}`);
  await connectDb();

  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = registerSchema.parse(raw);

  const user = await registerUser(parsed);

  // Generate verification token and deliver email. Email failure should not roll back
  // the user record — the user can request a fresh verification later.
  const rawToken = await createEmailVerificationToken(user.userId);
  try {
    await sendVerificationEmail(user.email, rawToken, user.name);
  } catch (err) {
    logger.error({ err, userId: user.userId }, "verification email dispatch failed");
  }

  return NextResponse.json(ok({ userId: user.userId, email: user.email }), { status: 201 });
});
