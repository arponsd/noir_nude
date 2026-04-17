import { format, parseISO } from "date-fns";
import DateRangePicker from "@/components/admin/reports/DateRangePicker";
import SalesReportView from "@/components/admin/reports/SalesReportView";
import { generateSalesReportService } from "@/lib/services/admin-report";
import type { SalesReportGroupBy } from "@/types/api/admin-reports";

export const metadata = { title: "Reports — Admin" };
export const dynamic = "force-dynamic";

const ALLOWED_GROUPS: readonly SalesReportGroupBy[] = ["day", "week", "month"];

function parseGroup(raw: unknown): SalesReportGroupBy {
  return typeof raw === "string" && (ALLOWED_GROUPS as readonly string[]).includes(raw)
    ? (raw as SalesReportGroupBy)
    : "day";
}

function parseDate(raw: unknown): Date | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  const n = Date.parse(raw);
  return Number.isFinite(n) ? new Date(n) : undefined;
}

function formatBucket(raw: string, groupBy: SalesReportGroupBy): string {
  try {
    if (groupBy === "day") return format(parseISO(raw), "MMM d");
    if (groupBy === "month") return format(parseISO(`${raw}-01`), "MMM yyyy");
    return raw; // ISO week buckets like "2026-W16" — leave as-is.
  } catch {
    return raw;
  }
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const groupBy = parseGroup(sp.groupBy);

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = parseDate(sp.from) ?? defaultFrom;
  const to = parseDate(sp.to) ?? now;

  const report = await generateSalesReportService({
    from: from.toISOString(),
    to: to.toISOString(),
    groupBy,
  });

  const buckets = report.rows.map((r) => ({
    label: formatBucket(r.bucket, groupBy),
    revenue: r.revenue,
    orders: r.orderCount,
  }));

  const csvQuery = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    groupBy,
  }).toString();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Reports</h1>
        <p className="text-sm text-[var(--ink-soft)] tabular-nums">
          {format(from, "MMM d, yyyy")} — {format(to, "MMM d, yyyy")}
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <DateRangePicker />
        <form action="/admin/reports" method="get" className="flex items-center gap-2">
          {sp.from ? <input type="hidden" name="from" value={String(sp.from)} /> : null}
          {sp.to ? <input type="hidden" name="to" value={String(sp.to)} /> : null}
          <label
            htmlFor="groupBy"
            className="text-xs tracking-[0.08em] text-[var(--muted)] uppercase"
          >
            Group by
          </label>
          <select
            id="groupBy"
            name="groupBy"
            defaultValue={groupBy}
            className="h-9 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-none"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <button
            type="submit"
            className="h-9 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
          >
            Apply
          </button>
        </form>
      </div>

      <SalesReportView buckets={buckets} csvQuery={csvQuery} />
    </div>
  );
}
