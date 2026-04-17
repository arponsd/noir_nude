/**
 * Cart API DTOs.
 *
 * All money values are integer paisa (1 BDT = 100 paisa). Never floats.
 *
 * `priceSnapshot` is the per-unit price captured when the item was added to the cart.
 * `currentPrice` reflects the live variant price. `priceChanged` is true when they differ,
 * so the UI can warn the shopper before checkout.
 */
export type CartItem = {
  /**
   * Stable line key = `${productId}:${variantId}`. The underlying Cart schema has no _id
   * on sub-items (we enforce uniqueness on productId+variantId inside the service),
   * so we expose a composite key that the client uses for PATCH/DELETE targeting.
   */
  itemId: string;
  productId: string;
  variantId: string;
  name: string;
  image?: string;
  brand: string;
  slug: string;
  variantName: string;
  sku: string;
  quantity: number;
  /** Per-unit price captured at add-time (paisa). */
  priceSnapshot: number;
  /** Per-unit price as of now (paisa). */
  currentPrice: number;
  priceChanged: boolean;
  /** quantity * currentPrice (paisa). */
  lineSubtotal: number;
};

export type Cart = {
  items: CartItem[];
  couponCode?: string;
  /** Sum of line subtotals before discount/shipping (paisa). */
  subtotal: number;
  /** Coupon discount (paisa). */
  discount: number;
  /** Shipping fee for this cart (paisa). */
  shippingFee: number;
  /** subtotal - discount + shippingFee (paisa). */
  total: number;
  freeShippingEligible: boolean;
  freeShippingThreshold: number;
  /** 0 if already eligible. */
  freeShippingRemaining: number;
};
