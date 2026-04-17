import type { FilterQuery, Types } from "mongoose";
import { Coupon, type CouponDoc } from "@/lib/db/models/Coupon";

export type AdminCouponDTO = {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  applicableCategoryIds: string[];
  applicableProductIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListAdminCouponsOpts = {
  q?: string;
  page?: number;
  limit?: number;
  activeOnly?: boolean;
};

export type ListAdminCouponsResult = {
  items: AdminCouponDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LeanCoupon = {
  _id: Types.ObjectId;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  applicableCategories?: Types.ObjectId[];
  applicableProducts?: Types.ObjectId[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}

function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 20;
  return Math.min(Math.floor(n), 100);
}

// reason: coupon codes match `[A-Z0-9_-]{3,24}` — still escape defensively before RegExp.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toDTO(c: LeanCoupon): AdminCouponDTO {
  const dto: AdminCouponDTO = {
    id: c._id.toString(),
    code: c.code,
    type: c.type,
    value: c.value,
    usedCount: c.usedCount ?? 0,
    validFrom: c.validFrom.toISOString(),
    validUntil: c.validUntil.toISOString(),
    applicableCategoryIds: (c.applicableCategories ?? []).map((id) => id.toString()),
    applicableProductIds: (c.applicableProducts ?? []).map((id) => id.toString()),
    isActive: c.isActive ?? true,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
  if (c.minOrderAmount !== undefined) dto.minOrderAmount = c.minOrderAmount;
  if (c.maxDiscount !== undefined) dto.maxDiscount = c.maxDiscount;
  if (c.usageLimit !== undefined) dto.usageLimit = c.usageLimit;
  if (c.perUserLimit !== undefined) dto.perUserLimit = c.perUserLimit;
  return dto;
}

/**
 * Paginated coupon list for the admin panel. `q` matches code prefix (upper-cased
 * before matching since all codes are uppercase). `activeOnly` restricts to codes
 * flagged active and currently within their validity window.
 */
export async function listAdminCoupons(
  opts: ListAdminCouponsOpts = {},
): Promise<ListAdminCouponsResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<CouponDoc> = {};

  const q = opts.q?.trim().toUpperCase();
  if (q) {
    filter.code = new RegExp(`^${escapeRegex(q)}`);
  }

  if (opts.activeOnly) {
    const now = new Date();
    filter.isActive = true;
    filter.validFrom = { $lte: now };
    filter.validUntil = { $gte: now };
  }

  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<LeanCoupon[]>(),
    Coupon.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items: items.map(toDTO), page, limit, total, totalPages };
}

export async function getCouponById(id: Types.ObjectId | string): Promise<AdminCouponDTO | null> {
  const doc = await Coupon.findOne({ _id: id }).lean<LeanCoupon | null>();
  if (!doc) return null;
  return toDTO(doc);
}
