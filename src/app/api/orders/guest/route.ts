// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { checkLimit, orderLimiter } from "@/lib/rate-limit";
import { guestPlaceOrderSchema } from "@/lib/validators/commerce";
import { placeGuestOrder } from "@/lib/services/order";

/**
 * Extract client IP for guest order rate-limiting. Leftmost `x-forwarded-for` entry
 * wins, then `x-real-ip`. Fallback "unknown" bucket so abusive egress nodes still
 * collide in the limiter even if proxy headers are stripped.
 */
async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export const POST = safeRoute(async (req: Request) => {
  const ip = await clientIpFromHeaders();
  await checkLimit(orderLimiter, `guest:${ip}`);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = guestPlaceOrderSchema.parse(raw);
  const order = await placeGuestOrder(parsed);
  return NextResponse.json(ok({ orderNumber: order.orderNumber, orderId: order.id }), {
    status: 201,
  });
});
