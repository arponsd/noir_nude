/**
 * Admin dashboard DTOs.
 *
 * Money values are integer paisa. `from`/`to` bound the window the stats are computed
 * over — both ISO date strings when present so the UI can round-trip the query params.
 */
export type DashboardTopProduct = {
  slug: string;
  name: string;
  unitsSold: number;
};

export type DashboardLowStockVariant = {
  productSlug: string;
  productName: string;
  variantName: string;
  stock: number;
};

export type DashboardStats = {
  /** Revenue in paisa across the window (excludes cancelled + returned). */
  revenue: number;
  orderCount: number;
  /** revenue / orderCount, rounded to whole paisa. 0 when orderCount === 0. */
  averageOrderValue: number;
  topProducts: DashboardTopProduct[];
  lowStockVariants: DashboardLowStockVariant[];
  /** ISO bounds actually used — echoed back for UI display. */
  from: string;
  to: string;
};
