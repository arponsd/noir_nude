import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminReportsQuerySchema } from "@/lib/validators/admin";
import { generateSalesReportService } from "@/lib/services/admin-report";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const params = adminReportsQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const payload = await generateSalesReportService(params);
  return NextResponse.json(ok(payload));
});
