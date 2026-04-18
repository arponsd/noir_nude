// e2e: tag=commerce
// CSRF: guest orders are unauthenticated so there's no session-bound token to
// verify — we rely on rate limiting + server-side origin validation instead.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { checkLimit, orderLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { guestPlaceOrderSchema } from "@/lib/validators/commerce";
import { placeGuestOrder } from "@/lib/services/order";

export const POST = safeRoute(async (req: Request) => {
  const ip = getClientIp(req);
  await checkLimit(orderLimiter, `guest:${ip}`);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = guestPlaceOrderSchema.parse(raw);
  const order = await placeGuestOrder(parsed);
  return NextResponse.json(ok({ orderNumber: order.orderNumber, orderId: order.id }), {
    status: 201,
  });
});
