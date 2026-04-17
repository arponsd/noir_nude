import type { ClientSession, Types } from "mongoose";
import { Coupon, type CouponDoc } from "@/lib/db/models/Coupon";

export type LeanCoupon = {
  _id: Types.ObjectId;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  applicableCategories: Types.ObjectId[];
  applicableProducts: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getCouponByCode(
  code: string,
  session?: ClientSession,
): Promise<LeanCoupon | null> {
  const query = Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (session) query.session(session);
  return query.lean<LeanCoupon | null>();
}

/**
 * Atomically increment a coupon's usedCount. Returns the updated count, or null if
 * the write would exceed `usageLimit` (conditional update filter). Callers must
 * treat `null` as "usage exhausted" and refuse to apply the coupon.
 */
export async function incrementCouponUsage(
  couponId: Types.ObjectId | string,
  session?: ClientSession,
): Promise<CouponDoc | null> {
  const options: { new: true; session?: ClientSession } = { new: true };
  if (session) options.session = session;

  return Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isActive: true,
      $or: [
        { usageLimit: { $exists: false } },
        { usageLimit: null },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
      ],
    },
    { $inc: { usedCount: 1 } },
    options,
  );
}
