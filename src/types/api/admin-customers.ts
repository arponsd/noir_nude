import type { OrderSummary } from "./order";
import type { UserProfile } from "./user";

/** Admin customer list row — aggregated from Orders. */
export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  /** Lifetime spend in paisa (excludes cancelled + returned). */
  totalSpent: number;
  /** ISO timestamp of the most recent order, if any. */
  lastOrderAt?: string;
};

export type AdminCustomersPage = {
  items: AdminCustomerRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminCustomerDetail = UserProfile & {
  orders: OrderSummary[];
  totalOrders: number;
  /** Lifetime spend in paisa. */
  totalSpent: number;
};
