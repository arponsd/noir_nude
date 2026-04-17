import { Download } from "lucide-react";
import StatCard from "@/components/admin/dashboard/StatCard";
import SalesChart, { type SalesChartBucket } from "@/components/admin/dashboard/SalesChart";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface SalesReportViewProps {
  buckets: SalesChartBucket[];
  /** Query string (without leading `?`) forwarded to the CSV endpoint. */
  csvQuery?: string;
  className?: string;
}

/**
 * Composite sales report: three stat cards (orders / revenue / AOV), a bar chart,
 * a detail table of buckets, and a CSV download link.
 */
export default function SalesReportView({ buckets, csvQuery, className }: SalesReportViewProps) {
  const totalOrders = buckets.reduce((n, b) => n + (b.orders ?? 0), 0);
  const totalRevenue = buckets.reduce((n, b) => n + b.revenue, 0);
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const csvHref = `/api/admin/reports/sales.csv${csvQuery ? `?${csvQuery}` : ""}`;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={totalOrders.toLocaleString()} />
        <StatCard label="Revenue" value={formatBDT(totalRevenue)} />
        <StatCard label="Avg. order value" value={formatBDT(aov)} />
      </div>

      <SalesChart buckets={buckets} />

      <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
          <h3 className="font-display text-base tracking-[-0.01em]">Breakdown</h3>
          <a
            href={csvHref}
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
          >
            <Download className="size-3.5" strokeWidth={1.5} aria-hidden />
            Download CSV
          </a>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--bg-alt)]/60 text-left text-xs tracking-[0.08em] text-[var(--ink-soft)] uppercase">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Period
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Orders
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {buckets.map((b, i) => (
                <tr key={`${b.label}-${i}`}>
                  <td className="px-4 py-2 text-[var(--ink)]">{b.label}</td>
                  <td className="px-4 py-2 text-right text-[var(--ink-soft)] tabular-nums">
                    {b.orders ?? 0}
                  </td>
                  <td className="font-display px-4 py-2 text-right text-[var(--ink)] tabular-nums">
                    {formatBDT(b.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
