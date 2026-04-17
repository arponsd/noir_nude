import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { listOrdersByUser, getOrderById, type LeanOrder } from "@/lib/db/queries/order";
import {
  placeOrderTransaction,
  type PlaceOrderInput as PlaceOrderTxInput,
} from "@/lib/db/transactions/place-order";
import { cancelOrderTransaction } from "@/lib/db/transactions/cancel-order";
import type { OrderAddressSnapshot } from "@/lib/db/models/Order";
import { ERROR_CODES, type OrderStatus } from "@/lib/constants";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import type { Cart } from "@/types/api/cart";
import type { Address, AddressInput } from "@/types/api/address";
import type {
  OrderDetail,
  OrderLine,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatusHistoryEntry,
  OrderSummary,
} from "@/types/api/order";
import { getCartForUser, addCartItem } from "./cart";
import { getAddress } from "./address";

/* ----------------------------------------------------------------------------
 * Order service. Wraps the DB-layer transactions with API DTO mapping + cart joins
 * for the authenticated user flow and direct item hydration for guest checkout.
 * -------------------------------------------------------------------------- */

function snapshotToAddress(snap: OrderAddressSnapshot, sourceId: Types.ObjectId | null): Address {
  const out: Address = {
    // reason: the order-time snapshot has no label/id; we surface the sourceAddressId
    // when known, otherwise a stable "snapshot" sentinel so the UI can treat it as read-only.
    id: sourceId ? sourceId.toString() : "snapshot",
    // reason: Order model snapshot does not persist the label enum; default to "home" for
    // display — the real label still lives on the user's Address doc if they reuse it.
    label: "home",
    recipientName: snap.recipientName,
    phone: snap.phone,
    addressLine1: snap.addressLine1,
    city: snap.city,
    district: snap.district,
    postalCode: snap.postalCode,
    country: snap.country,
    isDefault: false,
    createdAt: new Date(0).toISOString(),
  };
  if (snap.addressLine2) out.addressLine2 = snap.addressLine2;
  return out;
}

function itemDocToLine(i: LeanOrder["items"][number]): OrderLine {
  const line: OrderLine = {
    productId: i.productId.toString(),
    variantId: i.variantId.toString(),
    name: i.name,
    sku: i.sku,
    price: i.price,
    quantity: i.quantity,
    subtotal: i.subtotal,
  };
  if (i.image) line.image = i.image;
  return line;
}

export function orderDocToSummary(doc: LeanOrder): OrderSummary {
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    placedAt: (doc.placedAt ?? doc.createdAt).toISOString(),
    orderStatus: doc.orderStatus as OrderStatus,
    paymentStatus: doc.paymentStatus as OrderPaymentStatus,
    total: doc.total,
    itemCount: doc.items.reduce((sum, it) => sum + it.quantity, 0),
  };
}

export function orderDocToDetail(doc: LeanOrder): OrderDetail {
  const summary = orderDocToSummary(doc);
  const detail: OrderDetail = {
    ...summary,
    items: doc.items.map(itemDocToLine),
    shippingAddress: snapshotToAddress(doc.shippingAddress, null),
    subtotal: doc.subtotal,
    discount: doc.discount,
    shippingFee: doc.shippingFee,
    tax: doc.tax,
    total: doc.total,
    paymentMethod: doc.paymentMethod as OrderPaymentMethod,
    statusHistory: (doc.statusHistory ?? []).map((h) => {
      const entry: OrderStatusHistoryEntry = {
        status: h.status as OrderStatus,
        changedAt: (h.changedAt ?? new Date(0)).toISOString(),
      };
      if (h.note) entry.note = h.note;
      if (h.changedBy) entry.changedBy = h.changedBy.toString();
      return entry;
    }),
  };
  if (doc.billingAddress) {
    detail.billingAddress = snapshotToAddress(doc.billingAddress, null);
  }
  if (doc.couponCode) detail.couponCode = doc.couponCode;
  if (doc.trackingNumber) detail.trackingNumber = doc.trackingNumber;
  if (doc.courier) detail.courier = doc.courier;
  if (doc.notes) detail.notes = doc.notes;
  if (doc.deliveredAt) detail.deliveredAt = doc.deliveredAt.toISOString();
  return detail;
}

/* ---------- Helpers ---------- */

function addressDtoToSnapshot(addr: Address): OrderAddressSnapshot {
  const snap: OrderAddressSnapshot = {
    recipientName: addr.recipientName,
    phone: addr.phone,
    addressLine1: addr.addressLine1,
    city: addr.city,
    district: addr.district,
    postalCode: addr.postalCode,
    country: addr.country,
  };
  if (addr.addressLine2) snap.addressLine2 = addr.addressLine2;
  return snap;
}

function addressInputToSnapshot(addr: AddressInput): OrderAddressSnapshot {
  const snap: OrderAddressSnapshot = {
    recipientName: addr.recipientName,
    phone: addr.phone,
    addressLine1: addr.addressLine1,
    city: addr.city,
    district: addr.district,
    postalCode: addr.postalCode,
    country: addr.country,
  };
  if (addr.addressLine2) snap.addressLine2 = addr.addressLine2;
  return snap;
}

function cartItemsToOrderItems(cart: Cart): PlaceOrderTxInput["items"] {
  // The DB-layer placeOrderTransaction re-reads live price + snapshots name/sku/image
  // itself — we just hand over productId/variantId/quantity.
  return cart.items.map((it) => ({
    productId: it.productId,
    variantId: it.variantId,
    quantity: it.quantity,
  }));
}

/* ---------- Public API ---------- */

export async function placeOrderForUser(
  userId: string,
  input: { addressId: string; billingAddressId?: string; couponCode?: string; notes?: string },
): Promise<OrderDetail> {
  await connectDb();

  const cart = await getCartForUser(userId);
  if (cart.items.length === 0) {
    throw new ValidationError("Cart is empty", ERROR_CODES.VALIDATION_FAILED);
  }

  const shipping = await getAddress(userId, input.addressId);
  const shippingSnapshot = addressDtoToSnapshot(shipping);

  let billingSnapshot: OrderAddressSnapshot | undefined;
  if (input.billingAddressId) {
    const billing = await getAddress(userId, input.billingAddressId);
    billingSnapshot = addressDtoToSnapshot(billing);
  }

  const txInput: PlaceOrderTxInput = {
    userId,
    items: cartItemsToOrderItems(cart),
    shippingAddress: shippingSnapshot,
  };
  if (billingSnapshot) txInput.billingAddress = billingSnapshot;
  const couponCode = input.couponCode ?? cart.couponCode;
  if (couponCode) txInput.couponCode = couponCode.toUpperCase();
  if (input.notes) txInput.notes = input.notes;

  const doc = await placeOrderTransaction(txInput);
  return orderDocToDetail(doc as unknown as LeanOrder);
}

export async function placeGuestOrder(input: {
  guestEmail: string;
  phone: string;
  shippingAddress: AddressInput;
  billingAddress?: AddressInput;
  couponCode?: string;
  notes?: string;
  items: { productId: string; variantId: string; quantity: number }[];
}): Promise<OrderDetail> {
  await connectDb();

  if (input.items.length === 0) {
    throw new ValidationError("Cart is empty", ERROR_CODES.VALIDATION_FAILED);
  }

  const shippingSnapshot = addressInputToSnapshot(input.shippingAddress);
  // Ensure the guest-supplied phone makes it onto the snapshot even if the caller
  // forgot to mirror it into shippingAddress.phone.
  if (!shippingSnapshot.phone) shippingSnapshot.phone = input.phone;

  const txInput: PlaceOrderTxInput = {
    guestEmail: input.guestEmail,
    items: input.items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId,
      quantity: it.quantity,
    })),
    shippingAddress: shippingSnapshot,
  };
  if (input.billingAddress) {
    txInput.billingAddress = addressInputToSnapshot(input.billingAddress);
  }
  if (input.couponCode) txInput.couponCode = input.couponCode.toUpperCase();
  if (input.notes) txInput.notes = input.notes;

  const doc = await placeOrderTransaction(txInput);
  return orderDocToDetail(doc as unknown as LeanOrder);
}

export async function listUserOrders(
  userId: string,
  opts: { status?: OrderStatus; page?: number; limit?: number } = {},
): Promise<{
  items: OrderSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  await connectDb();
  const page = await listOrdersByUser(userId, opts);
  return {
    items: page.items.map(orderDocToSummary),
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: page.totalPages,
  };
}

export async function getUserOrder(userId: string, orderId: string): Promise<OrderDetail | null> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) return null;
  const doc = await getOrderById(orderId, userId);
  if (!doc) return null;
  return orderDocToDetail(doc);
}

export async function cancelOrder(
  userId: string,
  orderId: string,
  reason: string,
): Promise<OrderDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new NotFoundError("Order not found");
  const doc = await cancelOrderTransaction(orderId, userId, reason);
  return orderDocToDetail(doc as unknown as LeanOrder);
}

export async function reorderAsCart(
  userId: string,
  orderId: string,
): Promise<{ cart: Cart; skipped: string[] }> {
  await connectDb();
  const order = await getUserOrder(userId, orderId);
  if (!order) throw new NotFoundError("Order not found");

  const skipped: string[] = [];
  let lastCart: Cart | null = null;
  for (const line of order.items) {
    try {
      lastCart = await addCartItem(userId, {
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
      });
    } catch {
      skipped.push(line.name);
    }
  }
  const cart = lastCart ?? (await getCartForUser(userId));
  return { cart, skipped };
}
