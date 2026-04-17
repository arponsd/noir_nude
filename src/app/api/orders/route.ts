// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { checkLimit, orderLimiter } from "@/lib/rate-limit";
import { ORDER_STATUSES } from "@/lib/constants";
import { placeOrderSchema } from "@/lib/validators/commerce";
import { listUserOrders, placeOrderForUser } from "@/lib/services/order";

export const dynamic = "force-dynamic";

const listQuerySchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const GET = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  const url = new URL(req.url);
  const parsed = listQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const result = await listUserOrders(session.user.id, parsed);
  return NextResponse.json(ok(result));
});

export const POST = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(orderLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = placeOrderSchema.parse(raw);
  const order = await placeOrderForUser(session.user.id, parsed);
  return NextResponse.json(ok({ orderNumber: order.orderNumber, orderId: order.id }), {
    status: 201,
  });
});
