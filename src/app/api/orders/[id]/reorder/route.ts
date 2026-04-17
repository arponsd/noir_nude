// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { removeCoupon } from "@/lib/services/cart";
import { reorderAsCart } from "@/lib/services/order";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const result = await reorderAsCart(session.user.id, id);
  let cart = result.cart;
  // If a stale coupon carried over but no longer discounts anything, strip it so
  // clients don't render a discount badge with discount=0.
  if (cart.couponCode && cart.discount === 0) {
    cart = await removeCoupon(session.user.id);
  }
  return NextResponse.json(ok({ cart, skipped: result.skipped }));
});
