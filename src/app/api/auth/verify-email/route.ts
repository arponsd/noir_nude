import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { authLimiter, checkLimit } from "@/lib/rate-limit";
import { verifyEmailSchema } from "@/lib/validators/auth";
import { consumeEmailVerificationToken } from "@/lib/auth/tokens";
import { User } from "@/lib/db/models";
import { connectDb } from "@/lib/db/connect";

function clientIp(req: Request): string {
  const header = req.headers.get("x-forwarded-for");
  return header?.split(",")[0]?.trim() || "unknown";
}

export const POST = safeRoute(async (req: Request) => {
  await checkLimit(authLimiter, `verify:${clientIp(req)}`);
  await connectDb();

  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = verifyEmailSchema.parse(raw);

  const { userId } = await consumeEmailVerificationToken(parsed.token);

  await User.findByIdAndUpdate(userId, { $set: { emailVerified: true } });

  return NextResponse.json(ok({ verified: true, userId }));
});
