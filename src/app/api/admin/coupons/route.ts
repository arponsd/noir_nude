import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminCouponCreateSchema } from "@/lib/validators/admin";
import { createCouponService, listCouponsService } from "@/lib/services/admin-coupon";

const READ_ROLES = ["admin", "manager", "support"] as const;
const WRITE_ROLES = ["admin", "manager"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(READ_ROLES);
  const url = new URL(req.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20;
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const result = await listCouponsService({ page, limit, includeInactive });
  return NextResponse.json(ok(result));
});

export const POST = safeRoute(async (req: Request) => {
  const session = await requireRole(WRITE_ROLES);
  const input = adminCouponCreateSchema.parse(await req.json());
  const detail = await createCouponService(input, {
    id: session.user.id,
    role: session.user.role,
  });
  return NextResponse.json(ok(detail), { status: 201 });
});
