import type { PipelineStage } from "mongoose";
import { Order } from "@/lib/db/models/Order";

export type SalesReportGroupBy = "day" | "week" | "month";

export type SalesReportRow = {
  /** ISO date for the start of the bucket (UTC midnight). */
  bucket: string;
  orderCount: number;
  revenue: number;
};

export type GetSalesReportOpts = {
  from: Date;
  to: Date;
  groupBy: SalesReportGroupBy;
};

type AggRow = {
  _id: string;
  orderCount: number;
  revenue: number;
};

/**
 * Map from the contract `groupBy` alias to a MongoDB date-format directive.
 * Using string bucket IDs keeps output serializable and avoids cross-driver
 * ISO-week edge cases (Mongo's $isoWeek starts from 1).
 */
const FORMAT_BY_GROUP: Record<SalesReportGroupBy, string> = {
  day: "%Y-%m-%d",
  week: "%G-W%V", // ISO week year + week number (e.g. 2026-W16)
  month: "%Y-%m",
};

/**
 * Time-series sales report bucketed by day/week/month. Excludes cancelled/returned
 * orders and soft-deleted docs. Returns rows sorted ascending by bucket.
 */
export async function getSalesReport(opts: GetSalesReportOpts): Promise<SalesReportRow[]> {
  if (!(opts.from instanceof Date) || !(opts.to instanceof Date)) {
    throw new Error("getSalesReport: from/to must be Date instances");
  }
  if (opts.from > opts.to) {
    throw new Error("getSalesReport: from must be <= to");
  }

  const format = FORMAT_BY_GROUP[opts.groupBy];

  const pipeline: PipelineStage[] = [
    {
      $match: {
        placedAt: { $gte: opts.from, $lte: opts.to },
        orderStatus: { $nin: ["cancelled", "returned"] },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format, date: "$placedAt", timezone: "UTC" } },
        orderCount: { $sum: 1 },
        revenue: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const rows = await Order.aggregate<AggRow>(pipeline);
  return rows.map((r) => ({
    bucket: r._id,
    orderCount: r.orderCount,
    revenue: r.revenue,
  }));
}
