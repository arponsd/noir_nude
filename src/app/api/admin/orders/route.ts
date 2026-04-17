import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminOrdersQuerySchema } from "@/lib/validators/admin";
import { listAdminOrdersService } from "@/lib/services/admin-order";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const params = adminOrdersQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const page = await listAdminOrdersService(params);
  return NextResponse.json(ok(page));
});
