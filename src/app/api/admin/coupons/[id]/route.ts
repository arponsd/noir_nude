import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { adminCouponUpdateSchema } from "@/lib/validators/admin";
import {
  deactivateCouponService,
  getCouponService,
  updateCouponService,
} from "@/lib/services/admin-coupon";

const READ_ROLES = ["admin", "manager", "support"] as const;
const WRITE_ROLES = ["admin", "manager"] as const;

type RouteContext = { params: Promise<{ id: string }> };

export const GET = safeRoute(async (_req: Request, ctx: RouteContext) => {
  await requireRole(READ_ROLES);
  const { id } = objectIdRouteParamsSchema.parse(await ctx.params);
  const detail = await getCouponService(id);
  return NextResponse.json(ok(detail));
});

export const PATCH = safeRoute(async (req: Request, ctx: RouteContext) => {
  const session = await requireRole(WRITE_ROLES);
  const { id } = objectIdRouteParamsSchema.parse(await ctx.params);
  const input = adminCouponUpdateSchema.parse(await req.json());
  const detail = await updateCouponService(id, input, {
    id: session.user.id,
    role: session.user.role,
  });
  return NextResponse.json(ok(detail));
});

export const DELETE = safeRoute(async (_req: Request, ctx: RouteContext) => {
  const session = await requireRole(WRITE_ROLES);
  const { id } = objectIdRouteParamsSchema.parse(await ctx.params);
  const result = await deactivateCouponService(id, {
    id: session.user.id,
    role: session.user.role,
  });
  return NextResponse.json(ok(result));
});
