"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ApiResponse } from "@/lib/api/response";
import { safeAction } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cartLimiter, checkLimit } from "@/lib/rate-limit";
import { addCartItemSchema, applyCouponSchema } from "@/lib/validators/commerce";
import {
  addCartItem,
  applyCoupon,
  clearCart,
  getCartForUser,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from "@/lib/services/cart";
import { itemIdParamSchema } from "@/lib/utils/object-id";
import type { Cart } from "@/types/api/cart";
import type { CouponValidation } from "@/types/api/coupon";

/**
 * Action-side schema: qty=0 means "remove". This diverges from the route-level
 * updateCartItemSchema (which mandates min 1) — the service treats qty<=0 as a
 * delete, and UI steppers clamp at the boundary.
 */
const updateCartQuantitySchema = z
  .object({
    itemId: itemIdParamSchema,
    quantity: z.number().int().min(0).max(99),
  })
  .strict();

/**
 * Revalidate every surface that renders cart state. `/` covers the header badge,
 * `/cart` the full page, `/checkout` the order-review block.
 */
function revalidateCartPaths(): void {
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export const addToCartAction = safeAction(
  async (input: { productId: string; variantId: string; quantity: number }): Promise<Cart> => {
    const session = await requireAuth();
    await checkLimit(cartLimiter, session.user.id);
    const parsed = addCartItemSchema.parse(input);
    const cart = await addCartItem(session.user.id, parsed);
    revalidateCartPaths();
    return cart;
  },
);

export const updateCartItemAction = safeAction(
  async (input: { itemId: string; quantity: number }): Promise<Cart> => {
    const session = await requireAuth();
    await checkLimit(cartLimiter, session.user.id);
    const { itemId, quantity } = updateCartQuantitySchema.parse(input);
    const cart = await updateCartItem(session.user.id, itemId, quantity);
    revalidateCartPaths();
    return cart;
  },
);

export const removeCartItemAction = safeAction(async (input: { itemId: string }): Promise<Cart> => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const itemId = itemIdParamSchema.parse(input.itemId);
  const cart = await removeCartItem(session.user.id, itemId);
  revalidateCartPaths();
  return cart;
});

export const clearCartAction = safeAction(async (): Promise<Cart> => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const cart = await clearCart(session.user.id);
  revalidateCartPaths();
  return cart;
});

/**
 * Coupon apply returns the validation envelope so the UI can surface reason codes
 * (e.g. MIN_SPEND_NOT_MET) without re-fetching the cart.
 */
export const applyCouponAction = safeAction(
  async (input: { code: string }): Promise<CouponValidation> => {
    const session = await requireAuth();
    await checkLimit(cartLimiter, session.user.id);
    const { code } = applyCouponSchema.parse(input);
    const result = await applyCoupon(session.user.id, code);
    revalidateCartPaths();
    return result;
  },
);

export const removeCouponAction = safeAction(async (): Promise<Cart> => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const cart = await removeCoupon(session.user.id);
  revalidateCartPaths();
  return cart;
});

/** Read-only helper for server components that want to forward through `safeAction`. */
export const getCartAction: () => Promise<ApiResponse<Cart>> = safeAction(
  async (): Promise<Cart> => {
    const session = await requireAuth();
    return getCartForUser(session.user.id);
  },
);
