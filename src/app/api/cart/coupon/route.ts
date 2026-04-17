// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cartLimiter, checkLimit } from "@/lib/rate-limit";
import { applyCouponSchema } from "@/lib/validators/commerce";
import { applyCoupon, removeCoupon } from "@/lib/services/cart";

export const POST = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const { code } = applyCouponSchema.parse(raw);
  const result = await applyCoupon(session.user.id, code);
  return NextResponse.json(ok(result));
});

export const DELETE = safeRoute(async () => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const cart = await removeCoupon(session.user.id);
  return NextResponse.json(ok(cart));
});
