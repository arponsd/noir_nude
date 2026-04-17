import { connectDb } from "@/lib/db/connect";
import { getDashboardStats } from "@/lib/db/queries/admin-dashboard";
import type { DashboardStats } from "@/types/api/admin-dashboard";

export type GetDashboardStatsOpts = {
  from?: Date;
  to?: Date;
};

/**
 * Window-defaulting contract: when no range is given, we default to the trailing 30
 * days. `from`/`to` on the DTO always echo the resolved window (not the raw input).
 */
function resolveWindow(opts: GetDashboardStatsOpts): { from: Date; to: Date } {
  const to = opts.to ?? new Date();
  const from = opts.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to };
}

export async function getDashboardStatsService(
  opts: GetDashboardStatsOpts = {},
): Promise<DashboardStats> {
  await connectDb();
  const { from, to } = resolveWindow(opts);
  const raw = await getDashboardStats({ from, to });

  return {
    revenue: raw.revenue,
    orderCount: raw.orderCount,
    averageOrderValue: raw.averageOrderValue,
    topProducts: raw.topProducts.map((p) => ({
      slug: p.productSlug,
      name: p.productName,
      unitsSold: p.quantity,
    })),
    lowStockVariants: raw.lowStockVariants.map((v) => ({
      productSlug: v.productSlug,
      productName: v.productName,
      variantName: v.variantName,
      stock: v.available,
    })),
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
