import type { ClientSession, Types } from "mongoose";
import { Cart, type CartDoc, type CartItemDoc } from "@/lib/db/models/Cart";

export type CartItemInput = {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;
  priceSnapshot: number;
};

export type LeanCart = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDoc[];
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getCartByUser(userId: Types.ObjectId | string): Promise<LeanCart | null> {
  return Cart.findOne({ userId }).lean<LeanCart | null>();
}

/**
 * Upsert the user's single cart document. Intended for service-layer use only —
 * the service owns merge / quantity-combining semantics; this helper just writes.
 */
export async function upsertCart(
  userId: Types.ObjectId | string,
  items: CartItemInput[],
  couponCode?: string,
  session?: ClientSession,
): Promise<CartDoc> {
  const update: Record<string, unknown> = { items };
  if (couponCode !== undefined) {
    update.couponCode = couponCode;
  } else {
    update.$unset = { couponCode: 1 };
  }

  const options: {
    new: true;
    upsert: true;
    setDefaultsOnInsert: true;
    session?: ClientSession;
  } = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  };
  if (session) options.session = session;

  const doc = await Cart.findOneAndUpdate({ userId }, update, options);
  if (!doc) {
    throw new Error("upsertCart: failed to upsert cart");
  }
  return doc;
}

export async function clearCart(
  userId: Types.ObjectId | string,
  session?: ClientSession,
): Promise<void> {
  const options: { session?: ClientSession } = {};
  if (session) options.session = session;
  await Cart.updateOne({ userId }, { $set: { items: [] }, $unset: { couponCode: 1 } }, options);
}
