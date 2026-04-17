// e2e: tag=commerce
import { NextResponse } from "next/server";
import { fail, ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { ERROR_CODES } from "@/lib/constants";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { getUserOrder } from "@/lib/services/order";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const order = await getUserOrder(session.user.id, id);
  if (!order) {
    return NextResponse.json(fail(ERROR_CODES.NOT_FOUND, "Order not found"), { status: 404 });
  }
  return NextResponse.json(ok(order));
});
