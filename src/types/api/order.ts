import type { OrderStatus } from "@/lib/constants";
import type { Address } from "./address";

/**
 * Order API DTOs.
 *
 * All money values are integer paisa. `price` on OrderLine is the captured per-unit price
 * snapshotted at order time (not the live variant price).
 */
export type OrderLine = {
  productId: string;
  variantId: string;
  name: string;
  image?: string;
  sku: string;
  /** Per-unit paisa snapshot at order time. */
  price: number;
  quantity: number;
  /** quantity * price (paisa). */
  subtotal: number;
};

export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderPaymentMethod = "cod";

export type OrderStatusHistoryEntry = {
  status: OrderStatus;
  note?: string;
  /** User/admin id that triggered the transition. Omitted for system-initiated entries. */
  changedBy?: string;
  changedAt: string;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  placedAt: string;
  orderStatus: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  /** Final total (paisa). */
  total: number;
  itemCount: number;
};

export type OrderDetail = OrderSummary & {
  items: OrderLine[];
  /** Address snapshot at order time — not a live reference. */
  shippingAddress: Address;
  billingAddress?: Address;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponCode?: string;
  paymentMethod: OrderPaymentMethod;
  statusHistory: OrderStatusHistoryEntry[];
  trackingNumber?: string;
  courier?: string;
  notes?: string;
  deliveredAt?: string;
};
