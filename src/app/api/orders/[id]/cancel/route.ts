// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cancelOrderSchema } from "@/lib/validators/commerce";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { cancelOrder } from "@/lib/services/order";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = safeRoute(async (req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const raw: unknown = await req.json().catch(() => ({}));
  const { reason } = cancelOrderSchema.parse(raw);
  const order = await cancelOrder(session.user.id, id, reason);
  return NextResponse.json(ok(order));
});
