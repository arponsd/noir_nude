"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { checkLimit, orderLimiter } from "@/lib/rate-limit";
import {
  cancelOrderSchema,
  guestPlaceOrderSchema,
  placeOrderSchema,
  type GuestPlaceOrderInput,
} from "@/lib/validators/commerce";
import { objectIdParamSchema } from "@/lib/utils/object-id";
import { removeCoupon } from "@/lib/services/cart";
import {
  cancelOrder,
  placeGuestOrder,
  placeOrderForUser,
  reorderAsCart,
} from "@/lib/services/order";
import { sendOrderCancelledEmail, sendOrderPlacedEmail } from "@/lib/services/email";
import { getUserById } from "@/lib/services/user";
import type { Cart } from "@/types/api/cart";
import type { OrderDetail } from "@/types/api/order";
import logger from "@/lib/utils/logger";

function revalidateOrderPaths(): void {
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/account/orders");
}

/**
 * Extract a best-effort client IP for guest rate-limiting. Prefers the leftmost entry in
 * `x-forwarded-for`, then falls back to `x-real-ip`. When nothing is present we use a
 * sentinel so the bucket still collapses (and someone will notice 429s in telemetry).
 */
async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export const placeOrderAction = safeAction(
  async (input: {
    addressId: string;
    billingAddressId?: string;
    couponCode?: string;
    notes?: string;
  }): Promise<{ orderNumber: string; orderId: string }> => {
    const session = await requireAuth();
    await checkLimit(orderLimiter, session.user.id);
    const parsed = placeOrderSchema.parse(input);
    const order = await placeOrderForUser(session.user.id, parsed);
    revalidateOrderPaths();

    // Best-effort confirmation email. Never fail the order placement if the
    // provider or template render rejects — the user already has a placed order.
    try {
      const user = await getUserById(session.user.id);
      if (user?.email) {
        await sendOrderPlacedEmail(user.email, order, user.name ?? "there");
      }
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "order-placed email failed");
    }

    return { orderNumber: order.orderNumber, orderId: order.id };
  },
);

export const placeGuestOrderAction = safeAction(
  async (input: GuestPlaceOrderInput): Promise<{ orderNumber: string; orderId: string }> => {
    const ip = await clientIpFromHeaders();
    await checkLimit(orderLimiter, `guest:${ip}`);
    const parsed = guestPlaceOrderSchema.parse(input);
    const order = await placeGuestOrder(parsed);
    revalidateOrderPaths();
    return { orderNumber: order.orderNumber, orderId: order.id };
  },
);

export const cancelOrderAction = safeAction(
  async (input: { orderId: string; reason: string }): Promise<OrderDetail> => {
    const session = await requireAuth();
    const orderId = objectIdParamSchema.parse(input.orderId);
    const { reason } = cancelOrderSchema.parse({ reason: input.reason });
    const order = await cancelOrder(session.user.id, orderId, reason);
    revalidateOrderPaths();
    revalidatePath(`/account/orders/${orderId}`);

    try {
      const user = await getUserById(session.user.id);
      if (user?.email) {
        await sendOrderCancelledEmail(user.email, order, reason, user.name ?? "there");
      }
    } catch (err) {
      logger.warn({ err, orderId }, "order-cancelled email failed");
    }

    return order;
  },
);

/**
 * Reorder tolerates coupon drift — `reorderAsCart` re-adds each line individually,
 * skipping items that are out of stock. If the cart inherited a coupon (because the
 * user had one on the existing cart before reordering) and that coupon is no longer
 * valid (discount=0 on a coupon-carrying cart), we strip it so stale codes don't
 * silently ride along. UI shows the `skipped` list as a toast.
 */
export const reorderAction = safeAction(
  async (input: { orderId: string }): Promise<{ cart: Cart; skipped: string[] }> => {
    const session = await requireAuth();
    const orderId = objectIdParamSchema.parse(input.orderId);
    const result = await reorderAsCart(session.user.id, orderId);
    let cart = result.cart;
    if (cart.couponCode && cart.discount === 0) {
      cart = await removeCoupon(session.user.id);
    }
    revalidateOrderPaths();
    return { cart, skipped: result.skipped };
  },
);
