// e2e: tag=admin-orders
// TODO(security): enforce x-csrf-token once middleware covers admin API routes.

import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { adminOrderStatusUpdateSchema } from "@/lib/validators/admin";
import { adminUpdateOrderStatusService } from "@/lib/services/admin-order";

const ADMIN_ROLES = ["admin", "manager"] as const;

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = safeRoute(async (request: Request, ctx: RouteContext) => {
  const { id } = objectIdRouteParamsSchema.parse(await ctx.params);
  const session = await requireRole(ADMIN_ROLES);
  const body = adminOrderStatusUpdateSchema.parse(await request.json());
  const detail = await adminUpdateOrderStatusService(
    id,
    { id: session.user.id, role: session.user.role },
    body,
  );
  return NextResponse.json(ok(detail));
});
