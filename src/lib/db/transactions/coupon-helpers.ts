import type { ClientSession, Types } from "mongoose";
import { Coupon, type CouponDoc } from "@/lib/db/models/Coupon";
import { CouponRedemption } from "@/lib/db/models/CouponRedemption";

export type ValidateCouponItem = {
  productId: Types.ObjectId;
  categoryId?: Types.ObjectId | null;
  subtotal: number;
};

export type ValidateCouponInput = {
  couponCode: string;
  subtotal: number;
  userId?: Types.ObjectId | string | null;
  guestEmail?: string | null;
  items: ValidateCouponItem[];
  session?: ClientSession;
};

export type ValidateCouponReason =
  | "ok"
  | "INVALID"
  | "EXPIRED"
  | "MIN_ORDER_NOT_MET"
  | "USAGE_EXHAUSTED"
  | "PER_USER_EXHAUSTED"
  | "NOT_APPLICABLE"
  | "FREE_SHIPPING";

export type ValidateCouponResult = {
  reason: ValidateCouponReason;
  discount: number;
  freeShipping: boolean;
  coupon?: CouponDoc;
};

function notApplicable(): ValidateCouponResult {
  return { reason: "NOT_APPLICABLE", discount: 0, freeShipping: false };
}

/**
 * Resolve + validate a coupon for an order. Returns a discriminated-ish result
 * the caller inspects: `reason === "ok"` or `"FREE_SHIPPING"` means apply; anything
 * else means reject. Runs inside the passed session so it composes with the
 * order-placement transaction.
 */
export async function validateCouponForOrder(
  input: ValidateCouponInput,
): Promise<ValidateCouponResult> {
  const { couponCode, subtotal, userId, guestEmail, items, session } = input;

  const codeUpper = couponCode.toUpperCase();
  const query = Coupon.findOne({ code: codeUpper, isActive: true });
  if (session) query.session(session);
  const coupon = await query.exec();

  if (!coupon) return { reason: "INVALID", discount: 0, freeShipping: false };

  const now = new Date();
  if (coupon.validFrom > now || coupon.validUntil < now) {
    return { reason: "EXPIRED", discount: 0, freeShipping: false };
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return { reason: "MIN_ORDER_NOT_MET", discount: 0, freeShipping: false };
  }

  if (coupon.usageLimit !== undefined && coupon.usageLimit !== null) {
    if (coupon.usedCount >= coupon.usageLimit) {
      return { reason: "USAGE_EXHAUSTED", discount: 0, freeShipping: false };
    }
  }

  if (coupon.perUserLimit !== undefined && coupon.perUserLimit !== null) {
    const filter: Record<string, unknown> = { couponId: coupon._id };
    if (userId) filter.userId = userId;
    else if (guestEmail) filter.guestEmail = guestEmail.toLowerCase();
    else filter.userId = null;
    const existingQuery = CouponRedemption.countDocuments(filter);
    if (session) existingQuery.session(session);
    const existingCount = await existingQuery.exec();
    if (existingCount >= coupon.perUserLimit) {
      return { reason: "PER_USER_EXHAUSTED", discount: 0, freeShipping: false };
    }
  }

  const hasProductScope = coupon.applicableProducts && coupon.applicableProducts.length > 0;
  const hasCategoryScope = coupon.applicableCategories && coupon.applicableCategories.length > 0;
  if (hasProductScope || hasCategoryScope) {
    const productSet = new Set((coupon.applicableProducts ?? []).map((id) => id.toString()));
    const categorySet = new Set((coupon.applicableCategories ?? []).map((id) => id.toString()));
    const anyMatch = items.some((it) => {
      if (productSet.has(it.productId.toString())) return true;
      if (it.categoryId && categorySet.has(it.categoryId.toString())) return true;
      return false;
    });
    if (!anyMatch) return notApplicable();
  }

  if (coupon.type === "free_shipping") {
    return { reason: "FREE_SHIPPING", discount: 0, freeShipping: true, coupon };
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.floor((subtotal * coupon.value) / 100);
  } else if (coupon.type === "fixed") {
    discount = coupon.value;
  }
  if (coupon.maxDiscount !== undefined && coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal);

  return { reason: "ok", discount, freeShipping: false, coupon };
}
