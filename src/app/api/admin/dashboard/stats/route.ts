import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminDashboardQuerySchema } from "@/lib/validators/admin";
import { getDashboardStatsService } from "@/lib/services/admin-dashboard";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const params = adminDashboardQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const opts: { from?: Date; to?: Date } = {};
  if (params.from) opts.from = new Date(params.from);
  if (params.to) opts.to = new Date(params.to);
  const stats = await getDashboardStatsService(opts);
  return NextResponse.json(ok(stats));
});
