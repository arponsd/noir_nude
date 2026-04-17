import type { PipelineStage, Types } from "mongoose";
import { Order } from "@/lib/db/models/Order";
import { Product } from "@/lib/db/models/Product";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

/** Statuses that count toward revenue — excludes cancelled/returned. */
const REVENUE_STATUSES: readonly OrderStatus[] = ORDER_STATUSES.filter(
  (s): s is OrderStatus => s !== "cancelled" && s !== "returned",
);

export type DashboardTopProduct = {
  productId: string;
  productSlug: string;
  productName: string;
  quantity: number;
};

export type DashboardLowStockVariant = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  stock: number;
  reservedStock: number;
  available: number;
};

export type DashboardStats = {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: DashboardTopProduct[];
  lowStockVariants: DashboardLowStockVariant[];
};

export type GetDashboardStatsOpts = {
  from?: Date;
  to?: Date;
};

type RevenueAggRow = { _id: null; revenue: number; orderCount: number };
type TopProductAggRow = { _id: Types.ObjectId; quantity: number };

type LeanProductNameSlug = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
};

type LeanLowStockProduct = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  variants?: Array<{
    _id: Types.ObjectId;
    name: string;
    stock: number;
    reservedStock: number;
    isActive: boolean;
  }>;
};

/**
 * Roll-up metrics for the admin dashboard.
 *
 * Decisions:
 *  - Revenue excludes cancelled/returned orders (refunded/charged-back flow is MVP-out).
 *  - `topProducts` aggregates by orderItem.productId summed over quantity — not revenue.
 *    Product names are attached via a single secondary find() rather than $lookup to
 *    keep the aggregation small on large Order collections.
 *  - `lowStockVariants` resolves against Product.variants directly (no aggregation);
 *    capped at 20 entries for dashboard density.
 */
export async function getDashboardStats(opts: GetDashboardStatsOpts = {}): Promise<DashboardStats> {
  const dateRange: { $gte?: Date; $lte?: Date } = {};
  if (opts.from) dateRange.$gte = opts.from;
  if (opts.to) dateRange.$lte = opts.to;

  const orderMatch: Record<string, unknown> = {
    orderStatus: { $in: REVENUE_STATUSES as unknown as string[] },
    deletedAt: null,
  };
  if (opts.from || opts.to) orderMatch.placedAt = dateRange;

  const revenuePipeline: PipelineStage[] = [
    { $match: orderMatch },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$total" },
        orderCount: { $sum: 1 },
      },
    },
  ];

  const topProductsPipeline: PipelineStage[] = [
    { $match: orderMatch },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ];

  const [revenueRows, topRows] = await Promise.all([
    Order.aggregate<RevenueAggRow>(revenuePipeline),
    Order.aggregate<TopProductAggRow>(topProductsPipeline),
  ]);

  const revenue = revenueRows[0]?.revenue ?? 0;
  const orderCount = revenueRows[0]?.orderCount ?? 0;
  const averageOrderValue = orderCount === 0 ? 0 : Math.round(revenue / orderCount);

  const topIds = topRows.map((r) => r._id);
  const topProducts: DashboardTopProduct[] = [];
  if (topIds.length > 0) {
    const products = await Product.find({ _id: { $in: topIds } })
      .select({ slug: 1, name: 1 })
      .lean<LeanProductNameSlug[]>();
    const byId = new Map(products.map((p) => [p._id.toString(), p]));
    for (const row of topRows) {
      const p = byId.get(row._id.toString());
      if (!p) continue;
      topProducts.push({
        productId: row._id.toString(),
        productSlug: p.slug,
        productName: p.name,
        quantity: row.quantity,
      });
    }
  }

  const lowStockVariants = await listLowStockInternal(5, 20);

  return { revenue, orderCount, averageOrderValue, topProducts, lowStockVariants };
}

/**
 * Internal helper shared with admin-products. Returns the first `limit` variants
 * whose available stock (stock - reservedStock) is below `threshold` and which are
 * still active on active, non-deleted products.
 */
async function listLowStockInternal(
  threshold: number,
  limit: number,
): Promise<DashboardLowStockVariant[]> {
  const docs = await Product.find({
    isActive: true,
    deletedAt: null,
    variants: {
      $elemMatch: {
        isActive: true,
        $expr: { $lt: [{ $subtract: ["$stock", "$reservedStock"] }, threshold] },
      },
    },
  })
    .select({ slug: 1, name: 1, variants: 1 })
    .lean<LeanLowStockProduct[]>();

  const out: DashboardLowStockVariant[] = [];
  for (const p of docs) {
    for (const v of p.variants ?? []) {
      if (!v.isActive) continue;
      const available = v.stock - v.reservedStock;
      if (available >= threshold) continue;
      out.push({
        productId: p._id.toString(),
        productSlug: p.slug,
        productName: p.name,
        variantId: v._id.toString(),
        variantName: v.name,
        stock: v.stock,
        reservedStock: v.reservedStock,
        available,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
