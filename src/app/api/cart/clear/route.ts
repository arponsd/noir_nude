// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cartLimiter, checkLimit } from "@/lib/rate-limit";
import { clearCart } from "@/lib/services/cart";

export const POST = safeRoute(async () => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const cart = await clearCart(session.user.id);
  return NextResponse.json(ok(cart));
});
