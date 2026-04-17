export type SalesReportGroupBy = "day" | "week" | "month";

export type SalesReportRow = {
  /** ISO date string identifying the bucket start (day/week/month boundary, UTC). */
  bucket: string;
  orderCount: number;
  /** Revenue in paisa across the bucket. */
  revenue: number;
};

export type SalesReportTotals = {
  orderCount: number;
  /** Total revenue across the window in paisa. */
  revenue: number;
};

export type SalesReportPayload = {
  from: string;
  to: string;
  groupBy: SalesReportGroupBy;
  rows: SalesReportRow[];
  totals: SalesReportTotals;
};
