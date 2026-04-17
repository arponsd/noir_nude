import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/Product";
import { validateCouponForOrder } from "@/lib/db/transactions/coupon-helpers";
import type { CartItem } from "@/types/api/cart";
import type { CouponValidation } from "@/types/api/coupon";

/* ----------------------------------------------------------------------------
 * Thin wrapper over the coupon engine exposed by the DB transactions module.
 *
 * Cart-page "apply coupon" preview flows through here: it resolves the category id
 * of each line (for category-scoped coupons) and calls `validateCouponForOrder`
 * without incrementing usage — usage only ticks inside the place-order transaction.
 * -------------------------------------------------------------------------- */

export type CartPreviewInput = { items: CartItem[]; subtotal: number };

async function resolveCategoryMap(
  productIds: Types.ObjectId[],
): Promise<Map<string, Types.ObjectId | null>> {
  if (productIds.length === 0) return new Map();
  const docs = await Product.find({ _id: { $in: productIds } })
    .select({ categoryId: 1 })
    .lean<{ _id: Types.ObjectId; categoryId: Types.ObjectId | null }[]>();
  const map = new Map<string, Types.ObjectId | null>();
  for (const d of docs) map.set(d._id.toString(), d.categoryId ?? null);
  return map;
}

export async function validateCouponAgainstCart(
  code: string,
  cart: CartPreviewInput,
  userId?: string,
  guestEmail?: string,
): Promise<CouponValidation> {
  await connectDb();

  if (cart.items.length === 0 || cart.subtotal <= 0) {
    return { ok: false, code: code.toUpperCase(), reason: "MIN_ORDER_NOT_MET" };
  }

  const productIds = Array.from(new Set(cart.items.map((i) => i.productId))).map(
    (id) => new Types.ObjectId(id),
  );
  const categoryMap = await resolveCategoryMap(productIds);

  const result = await validateCouponForOrder({
    couponCode: code,
    subtotal: cart.subtotal,
    userId: userId ?? null,
    guestEmail: guestEmail ?? null,
    items: cart.items.map((it) => {
      const categoryId = categoryMap.get(it.productId) ?? null;
      const base: {
        productId: Types.ObjectId;
        categoryId?: Types.ObjectId | null;
        subtotal: number;
      } = {
        productId: new Types.ObjectId(it.productId),
        subtotal: it.lineSubtotal,
      };
      if (categoryId) base.categoryId = categoryId;
      return base;
    }),
  });

  if (result.reason === "ok") {
    return {
      ok: true,
      code: code.toUpperCase(),
      discount: result.discount,
      freeShipping: result.freeShipping,
    };
  }
  if (result.reason === "FREE_SHIPPING") {
    return {
      ok: true,
      code: code.toUpperCase(),
      discount: 0,
      freeShipping: true,
    };
  }
  return {
    ok: false,
    code: code.toUpperCase(),
    reason: result.reason,
  };
}
