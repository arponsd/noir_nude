import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Coupon, type CouponDoc } from "@/lib/db/models/Coupon";

/**
 * Deterministic coupon seed for integration tests.
 *
 * Mirrors `scripts/seed/coupons.ts` — the 4 public launch coupons:
 *   - WELCOME10      (percentage,   10%, minOrder 50_000, usageLimit 1000)
 *   - SHIP0          (free_shipping)
 *   - FLAT500        (fixed,        50_000 paisa off, minOrder 100_000)
 *   - VIP20          (percentage,   20%, maxDiscount 200_000)
 *
 * Each coupon is valid from `now - 1 day` to `now + 90 days` by default so it
 * covers the majority of test dates. Callers can override via `overrides` to
 * exercise edge cases (expired, future, exhausted, etc.).
 */

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type SeedCouponInput = {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  perUserLimit?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  applicableProducts?: (Types.ObjectId | string)[];
  applicableCategories?: (Types.ObjectId | string)[];
};

export type SeededCoupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
};

const DEFAULT_COUPONS: SeedCouponInput[] = [
  { code: "WELCOME10", type: "percentage", value: 10, minOrderAmount: 50_000, usageLimit: 1000 },
  { code: "SHIP0", type: "free_shipping", value: 0 },
  { code: "FLAT500", type: "fixed", value: 50_000, minOrderAmount: 100_000 },
  { code: "VIP20", type: "percentage", value: 20, maxDiscount: 200_000 },
];

function toObjectId(id: Types.ObjectId | string): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

export async function seedCoupons(
  overrides: SeedCouponInput[] = DEFAULT_COUPONS,
): Promise<SeededCoupon[]> {
  await connectDb();
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - ONE_DAY_MS);
  const defaultUntil = new Date(now.getTime() + NINETY_DAYS_MS);

  const created: SeededCoupon[] = [];
  for (const entry of overrides) {
    const doc = await Coupon.create({
      code: entry.code,
      type: entry.type,
      value: entry.value,
      ...(entry.minOrderAmount !== undefined ? { minOrderAmount: entry.minOrderAmount } : {}),
      ...(entry.maxDiscount !== undefined ? { maxDiscount: entry.maxDiscount } : {}),
      ...(entry.usageLimit !== undefined ? { usageLimit: entry.usageLimit } : {}),
      usedCount: entry.usedCount ?? 0,
      ...(entry.perUserLimit !== undefined ? { perUserLimit: entry.perUserLimit } : {}),
      validFrom: entry.validFrom ?? defaultFrom,
      validUntil: entry.validUntil ?? defaultUntil,
      isActive: entry.isActive ?? true,
      applicableProducts: (entry.applicableProducts ?? []).map(toObjectId),
      applicableCategories: (entry.applicableCategories ?? []).map(toObjectId),
    });
    created.push({
      id: (doc as CouponDoc)._id.toString(),
      code: doc.code,
      type: doc.type,
    });
  }
  return created;
}

export async function seedDefaultCoupons(): Promise<SeededCoupon[]> {
  return seedCoupons(DEFAULT_COUPONS);
}
