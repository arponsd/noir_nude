import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Order, type OrderDoc } from "@/lib/db/models/Order";
import type { OrderStatus } from "@/lib/constants";

/**
 * Minimal, low-friction Order seeder for admin integration tests. Builds the
 * document directly via `Order.create`, bypassing the commerce transaction
 * (which asserts cart, address, stock, coupon, etc). Tests that need the full
 * place-order flow should go through `@/lib/services/order` instead.
 */

export type SeedOrderItemInput = {
  productId: Types.ObjectId | string;
  variantId: Types.ObjectId | string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
};

export type SeedOrderAddressInput = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country?: string;
};

export type SeedOrderInput = {
  userId?: Types.ObjectId | string;
  guestEmail?: string;
  items: SeedOrderItemInput[];
  status?: OrderStatus;
  shippingAddress?: Partial<SeedOrderAddressInput>;
  placedAt?: Date;
  deliveredAt?: Date;
  orderNumber?: string;
  /** Paisa. Defaults to sum(items[i].price * quantity). */
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  tax?: number;
  total?: number;
  couponCode?: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  trackingNumber?: string;
  courier?: string;
  isTest?: boolean;
};

const DEFAULT_ADDRESS: SeedOrderAddressInput = {
  recipientName: "Test Recipient",
  phone: "+8801712345678",
  addressLine1: "House 1, Road 1",
  city: "Dhaka",
  district: "Dhaka",
  postalCode: "1212",
  country: "BD",
};

function makeItems(items: SeedOrderItemInput[]): OrderDoc["items"] {
  return items.map((i) => ({
    productId: typeof i.productId === "string" ? new Types.ObjectId(i.productId) : i.productId,
    variantId: typeof i.variantId === "string" ? new Types.ObjectId(i.variantId) : i.variantId,
    name: i.name,
    image: i.image ?? "",
    sku: i.sku.toUpperCase(),
    price: i.price,
    quantity: i.quantity,
    subtotal: i.price * i.quantity,
  })) as unknown as OrderDoc["items"];
}

/**
 * Create an Order document directly. Returns the persisted doc (full model instance).
 */
export async function seedOrder(input: SeedOrderInput): Promise<OrderDoc> {
  await connectDb();
  if (!input.userId && !input.guestEmail) {
    throw new Error("seedOrder: userId or guestEmail is required");
  }

  const items = makeItems(input.items);
  const subtotal =
    input.subtotal ?? items.reduce((acc, it) => acc + (it as { subtotal: number }).subtotal, 0);
  const discount = input.discount ?? 0;
  const shippingFee = input.shippingFee ?? 0;
  const tax = input.tax ?? 0;
  const total = input.total ?? subtotal - discount + shippingFee + tax;

  const shippingAddress = {
    ...DEFAULT_ADDRESS,
    ...(input.shippingAddress ?? {}),
  };

  const status = input.status ?? "placed";
  const placedAt = input.placedAt ?? new Date();

  const payload: Record<string, unknown> = {
    userId: input.userId
      ? typeof input.userId === "string"
        ? new Types.ObjectId(input.userId)
        : input.userId
      : null,
    items,
    shippingAddress,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
    paymentMethod: "cod",
    paymentStatus: input.paymentStatus ?? (status === "delivered" ? "paid" : "pending"),
    orderStatus: status,
    placedAt,
    isTest: input.isTest ?? false,
  };
  if (input.guestEmail) payload.guestEmail = input.guestEmail;
  if (input.orderNumber) payload.orderNumber = input.orderNumber;
  if (input.couponCode) payload.couponCode = input.couponCode.toUpperCase();
  if (input.trackingNumber) payload.trackingNumber = input.trackingNumber;
  if (input.courier) payload.courier = input.courier;
  if (input.deliveredAt) payload.deliveredAt = input.deliveredAt;
  else if (status === "delivered") payload.deliveredAt = new Date(placedAt.getTime() + 86_400_000);

  const doc = await Order.create(payload);
  return doc;
}
