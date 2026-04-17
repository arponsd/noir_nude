import mongoose, { Types } from "mongoose";
import type { ClientSession } from "mongoose";
import { DEFAULT_SHIPPING_FEE, ERROR_CODES, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Cart } from "@/lib/db/models/Cart";
import { Coupon } from "@/lib/db/models/Coupon";
import { CouponRedemption } from "@/lib/db/models/CouponRedemption";
import { Order, type OrderAddressSnapshot, type OrderDoc } from "@/lib/db/models/Order";
import { Product } from "@/lib/db/models/Product";
import { validateCouponForOrder } from "./coupon-helpers";

export type PlaceOrderItemInput = {
  productId: Types.ObjectId | string;
  variantId: Types.ObjectId | string;
  quantity: number;
};

export type PlaceOrderInput = {
  userId?: Types.ObjectId | string | null;
  guestEmail?: string;
  items: PlaceOrderItemInput[];
  shippingAddress: OrderAddressSnapshot;
  billingAddress?: OrderAddressSnapshot;
  couponCode?: string;
  notes?: string;
  isTest?: boolean;
};

export class OrderError extends Error {
  public code: string;
  public details?: Record<string, unknown>;
  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    if (details) this.details = details;
  }
}

type ProductLean = {
  _id: Types.ObjectId;
  name: string;
  categoryId: Types.ObjectId;
  images?: Array<{ url: string }>;
  isActive: boolean;
  deletedAt: Date | null;
  variants: Array<{
    _id: Types.ObjectId;
    name: string;
    sku: string;
    price: number;
    stock: number;
    reservedStock: number;
    isActive: boolean;
  }>;
};

function toObjectId(id: Types.ObjectId | string): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

async function runInTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    // reason: withTransaction always invokes the callback at least once on success.
    return result as T;
  } finally {
    await session.endSession();
  }
}

/**
 * Place an order atomically:
 *   1. Validate stock + snapshot price per item.
 *   2. Resolve/apply coupon.
 *   3. Decrement variant stock.
 *   4. Create Order with seeded statusHistory.
 *   5. Record CouponRedemption if applicable.
 *   6. Clear the user's cart (if userId provided).
 *
 * Throws OrderError on domain failures (INSUFFICIENT_STOCK, COUPON_INVALID, etc.).
 * The transaction auto-rolls back on any throw.
 */
export async function placeOrderTransaction(input: PlaceOrderInput): Promise<OrderDoc> {
  if (!input.items || input.items.length === 0) {
    throw new OrderError(ERROR_CODES.VALIDATION_FAILED, "Order must contain at least one item");
  }
  if (!input.userId && !input.guestEmail) {
    throw new OrderError(ERROR_CODES.VALIDATION_FAILED, "Order requires userId or guestEmail");
  }

  return runInTransaction(async (session) => {
    const productIds = Array.from(
      new Set(input.items.map((it) => toObjectId(it.productId).toString())),
    ).map((s) => new Types.ObjectId(s));

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      deletedAt: null,
    })
      .session(session)
      .lean<ProductLean[]>();

    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems: Array<{
      productId: Types.ObjectId;
      variantId: Types.ObjectId;
      name: string;
      image: string;
      sku: string;
      price: number;
      quantity: number;
      subtotal: number;
    }> = [];

    const couponItems: Array<{
      productId: Types.ObjectId;
      categoryId: Types.ObjectId | null;
      subtotal: number;
    }> = [];

    let subtotal = 0;

    for (const it of input.items) {
      const pid = toObjectId(it.productId);
      const vid = toObjectId(it.variantId);
      const product = byId.get(pid.toString());
      if (!product) {
        throw new OrderError(ERROR_CODES.NOT_FOUND, "Product not found or inactive", {
          productId: pid.toString(),
        });
      }
      const variant = product.variants.find((v) => v._id.toString() === vid.toString());
      if (!variant || !variant.isActive) {
        throw new OrderError(ERROR_CODES.NOT_FOUND, "Variant not found or inactive", {
          productId: pid.toString(),
          variantId: vid.toString(),
        });
      }
      const available = variant.stock - variant.reservedStock;
      if (available < it.quantity) {
        throw new OrderError(ERROR_CODES.INSUFFICIENT_STOCK, "Insufficient stock for variant", {
          productId: pid.toString(),
          variantId: vid.toString(),
          available,
        });
      }

      const itemSubtotal = variant.price * it.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: pid,
        variantId: vid,
        name: product.name,
        image: product.images?.[0]?.url ?? "",
        sku: variant.sku,
        price: variant.price,
        quantity: it.quantity,
        subtotal: itemSubtotal,
      });

      couponItems.push({
        productId: pid,
        categoryId: product.categoryId ?? null,
        subtotal: itemSubtotal,
      });
    }

    let discount = 0;
    let freeShipping = false;
    let appliedCouponCode: string | undefined;
    let couponIdForRedemption: Types.ObjectId | undefined;

    if (input.couponCode) {
      const result = await validateCouponForOrder({
        couponCode: input.couponCode,
        subtotal,
        userId: input.userId ?? null,
        guestEmail: input.guestEmail ?? null,
        items: couponItems,
        session,
      });

      if (result.reason !== "ok" && result.reason !== "FREE_SHIPPING") {
        const code =
          result.reason === "EXPIRED" ? ERROR_CODES.COUPON_EXPIRED : ERROR_CODES.COUPON_INVALID;
        throw new OrderError(code, `Coupon ${input.couponCode} rejected: ${result.reason}`, {
          reason: result.reason,
        });
      }

      discount = result.discount;
      freeShipping = result.freeShipping;
      if (result.coupon) {
        appliedCouponCode = result.coupon.code;
        couponIdForRedemption = result.coupon._id;
      }
    }

    const shippingFee =
      freeShipping || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
    const tax = 0;
    const total = Math.max(0, subtotal - discount + shippingFee + tax);

    for (const item of orderItems) {
      const res = await Product.updateOne(
        { _id: item.productId, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": -item.quantity, totalSold: item.quantity } },
        { session },
      );
      if (res.modifiedCount !== 1) {
        throw new OrderError(
          ERROR_CODES.INSUFFICIENT_STOCK,
          "Stock decrement failed — concurrent modification",
          {
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
          },
        );
      }
    }

    if (couponIdForRedemption) {
      const updated = await Coupon.findOneAndUpdate(
        {
          _id: couponIdForRedemption,
          isActive: true,
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
          ],
        },
        { $inc: { usedCount: 1 } },
        { new: true, session },
      );
      if (!updated) {
        throw new OrderError(ERROR_CODES.COUPON_INVALID, "Coupon usage could not be incremented");
      }
    }

    const orderDocs = await Order.create(
      [
        {
          userId: input.userId ?? null,
          guestEmail: input.guestEmail,
          items: orderItems,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          subtotal,
          discount,
          shippingFee,
          tax,
          total,
          couponCode: appliedCouponCode,
          paymentMethod: "cod",
          paymentStatus: "pending",
          orderStatus: "placed",
          notes: input.notes,
          isTest: input.isTest ?? false,
          placedAt: new Date(),
        },
      ],
      { session },
    );
    const order = orderDocs[0];
    if (!order) {
      throw new OrderError(ERROR_CODES.INTERNAL_ERROR, "Order creation returned no document");
    }

    if (couponIdForRedemption) {
      await CouponRedemption.create(
        [
          {
            couponId: couponIdForRedemption,
            userId: input.userId ?? null,
            guestEmail: input.guestEmail?.toLowerCase(),
            orderId: order._id,
            appliedAt: new Date(),
          },
        ],
        { session },
      );
    }

    if (input.userId) {
      await Cart.updateOne(
        { userId: input.userId },
        { $set: { items: [] }, $unset: { couponCode: 1 } },
        { session },
      );
    }

    return order;
  });
}
