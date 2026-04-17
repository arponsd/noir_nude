import { safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminReportsQuerySchema } from "@/lib/validators/admin";
import { generateSalesReportCsv } from "@/lib/services/admin-report";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const params = adminReportsQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const csv = await generateSalesReportCsv(params);
  const filename = `sales-${params.from.slice(0, 10)}_${params.to.slice(0, 10)}_${params.groupBy}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
