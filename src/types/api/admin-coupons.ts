export type CouponType = "percentage" | "fixed" | "free_shipping";

export type CouponSummary = {
  id: string;
  code: string;
  type: CouponType;
  /** Percentage 1..100 OR paisa for fixed discount OR 0 for free_shipping. */
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

export type CouponDetail = CouponSummary & {
  applicableCategories: string[];
  applicableProducts: string[];
  createdAt: string;
  updatedAt: string;
};

export type CouponListPage = {
  items: CouponSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
