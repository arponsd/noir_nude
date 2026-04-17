import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { adminRefundSchema } from "@/lib/validators/admin";
import { adminRecordRefundService } from "@/lib/services/admin-order";

const ADMIN_ROLES = ["admin", "manager"] as const;

type RouteContext = { params: Promise<{ id: string }> };

export const POST = safeRoute(async (req: Request, ctx: RouteContext) => {
  const session = await requireRole(ADMIN_ROLES);
  const { id } = objectIdRouteParamsSchema.parse(await ctx.params);
  const input = adminRefundSchema.parse(await req.json());
  const detail = await adminRecordRefundService(
    id,
    { id: session.user.id, role: session.user.role },
    input,
  );
  return NextResponse.json(ok(detail));
});
