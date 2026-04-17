import type { OrderSummary } from "./order";

/**
 * Admin-facing order list row. Extends the customer-facing `OrderSummary` with
 * customer contact + name so admin list pages can render without a second lookup.
 */
export type AdminOrderRow = OrderSummary & {
  customerEmail: string;
  customerName?: string;
  /** Guest checkouts have no userId — surfaced so admin UI can label the row. */
  isGuest: boolean;
};

export type AdminOrdersPage = {
  items: AdminOrderRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
