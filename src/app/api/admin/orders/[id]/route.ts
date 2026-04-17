import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { adminGetOrderService } from "@/lib/services/admin-order";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

type RouteContext = { params: Promise<{ id: string }> };

export const GET = safeRoute(async (_req: Request, ctx: RouteContext) => {
  await requireRole(ADMIN_ROLES);
  const { id } = objectIdRouteParamsSchema.parse(await ctx.params);
  const detail = await adminGetOrderService(id);
  return NextResponse.json(ok(detail));
});
