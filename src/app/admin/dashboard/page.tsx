import { format, parseISO } from "date-fns";
import StatCard from "@/components/admin/dashboard/StatCard";
import TopProductsList from "@/components/admin/dashboard/TopProductsList";
import LowStockList from "@/components/admin/dashboard/LowStockList";
import SalesChart from "@/components/admin/dashboard/SalesChart";
import { formatBDT } from "@/lib/constants";
import { getDashboardStatsService } from "@/lib/services/admin-dashboard";
import { generateSalesReportService } from "@/lib/services/admin-report";

export const metadata = { title: "Dashboard — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [stats, report] = await Promise.all([
    getDashboardStatsService({ from, to }),
    generateSalesReportService({
      from: from.toISOString(),
      to: to.toISOString(),
      groupBy: "day",
    }),
  ]);

  const lowStockCount = stats.lowStockVariants.length;

  // Bucket labels — "Apr 10". Falls back to the raw bucket id if parse fails.
  const buckets = report.rows.map((r) => {
    let label = r.bucket;
    try {
      label = format(parseISO(r.bucket), "MMM d");
    } catch {
      // use raw bucket id
    }
    return { label, revenue: r.revenue, orders: r.orderCount };
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Last 30 days
        </p>
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Dashboard</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key metrics">
        <StatCard label="Revenue" value={formatBDT(stats.revenue)} />
        <StatCard label="Orders" value={stats.orderCount.toLocaleString()} />
        <StatCard label="Avg. order value" value={formatBDT(stats.averageOrderValue)} />
        <StatCard
          label="Low stock"
          value={lowStockCount.toLocaleString()}
          footnote="Variants below threshold"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TopProductsList
          products={stats.topProducts.map((p, i) => ({
            id: p.slug || String(i),
            slug: p.slug,
            name: p.name,
            unitsSold: p.unitsSold,
            revenue: 0,
          }))}
        />
        <LowStockList
          items={stats.lowStockVariants.map((v) => ({
            productId: v.productSlug,
            productSlug: v.productSlug,
            productName: v.productName,
            variantId: `${v.productSlug}-${v.variantName}`,
            variantName: v.variantName,
            sku: "",
            stock: v.stock,
          }))}
        />
      </section>

      <section aria-label="Sales by day">
        <h2 className="font-display mb-3 text-lg tracking-[-0.01em] text-[var(--ink)]">
          Sales (daily)
        </h2>
        <SalesChart buckets={buckets} title="Daily revenue, last 30 days" />
      </section>
    </div>
  );
}
