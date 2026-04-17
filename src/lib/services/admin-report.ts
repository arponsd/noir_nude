import { connectDb } from "@/lib/db/connect";
import { getSalesReport, type SalesReportGroupBy } from "@/lib/db/queries/admin-reports";
import { ValidationError } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/constants";
import type { AdminReportsQuery } from "@/lib/validators/admin";
import type { SalesReportPayload } from "@/types/api/admin-reports";

/* ----------------------------------------------------------------------------
 * Admin sales report service.
 *
 * Thin wrapper around the DB helper: resolves the date range, delegates, and
 * rolls up totals. Also exposes a CSV renderer used by the /sales.csv route.
 * -------------------------------------------------------------------------- */

function resolveWindow(query: AdminReportsQuery): {
  from: Date;
  to: Date;
  groupBy: SalesReportGroupBy;
} {
  const from = new Date(query.from);
  const to = new Date(query.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new ValidationError("Invalid date range", ERROR_CODES.VALIDATION_FAILED);
  }
  return { from, to, groupBy: query.groupBy };
}

export async function generateSalesReportService(
  query: AdminReportsQuery,
): Promise<SalesReportPayload> {
  await connectDb();
  const { from, to, groupBy } = resolveWindow(query);
  const rows = await getSalesReport({ from, to, groupBy });
  const totals = rows.reduce(
    (acc, r) => {
      acc.orderCount += r.orderCount;
      acc.revenue += r.revenue;
      return acc;
    },
    { orderCount: 0, revenue: 0 },
  );
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    groupBy,
    rows,
    totals,
  };
}

/**
 * Naive CSV renderer — quoted columns + BOM prefix so Excel treats the file as UTF-8.
 * Kept in-service (no streaming) because reports are paginated by date bucket; a
 * full year at `groupBy=day` is only 365 rows.
 */
export async function generateSalesReportCsv(query: AdminReportsQuery): Promise<string> {
  const payload = await generateSalesReportService(query);
  const lines: string[] = ["bucket,orderCount,revenue_paisa"];
  for (const r of payload.rows) {
    lines.push(`${csvCell(r.bucket)},${r.orderCount},${r.revenue}`);
  }
  lines.push(`TOTAL,${payload.totals.orderCount},${payload.totals.revenue}`);
  // reason: prepend UTF-8 BOM so Excel opens the file without mojibake.
  return `\uFEFF${lines.join("\n")}\n`;
}

function csvCell(v: string): string {
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
