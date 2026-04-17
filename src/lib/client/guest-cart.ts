/**
 * Guest cart (localStorage-backed).
 *
 * Contract 04 locks server carts to authenticated users. Anonymous shoppers coming
 * through "Buy now" on the PDP are given a minimal client-only basket here so that
 * /checkout/guest can submit to `placeGuestOrderAction` with a concrete set of lines.
 *
 * This module is **client-only** — guard every accessor with a `typeof window` check.
 */

const STORAGE_KEY = "guest_cart:v1";

export interface GuestCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  /** Snapshot metadata for rendering on /checkout/guest without a product fetch. */
  name: string;
  brand?: string;
  variantName: string;
  image?: string;
  /** Per-unit price in paisa, captured at add-time. Re-priced by the server at order. */
  priceSnapshot: number;
}

const MAX_ITEMS = 50;
const MAX_QTY = 99;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function lineKey(productId: string, variantId: string): string {
  return `${productId}:${variantId}`;
}

function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.floor(n)));
}

function safeParse(raw: string | null): GuestCartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // reason: guard against malformed historical entries; drop anything that fails a shape check.
    return parsed.filter(
      (x): x is GuestCartItem =>
        !!x &&
        typeof x === "object" &&
        typeof x.productId === "string" &&
        typeof x.variantId === "string" &&
        typeof x.quantity === "number" &&
        typeof x.name === "string" &&
        typeof x.variantName === "string" &&
        typeof x.priceSnapshot === "number",
    );
  } catch {
    return [];
  }
}

export function getGuestCart(): GuestCartItem[] {
  if (!isBrowser()) return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function setGuestCart(items: GuestCartItem[]): void {
  if (!isBrowser()) return;
  const sliced = items.slice(0, MAX_ITEMS).map((i) => ({ ...i, quantity: clampQty(i.quantity) }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
}

export function clearGuestCart(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function addGuestCartItem(item: GuestCartItem): GuestCartItem[] {
  const cart = getGuestCart();
  const key = lineKey(item.productId, item.variantId);
  const existingIdx = cart.findIndex((c) => lineKey(c.productId, c.variantId) === key);
  if (existingIdx >= 0) {
    const existing = cart[existingIdx];
    if (existing) {
      cart[existingIdx] = {
        ...existing,
        quantity: clampQty(existing.quantity + item.quantity),
        priceSnapshot: item.priceSnapshot,
      };
    }
  } else {
    cart.push({ ...item, quantity: clampQty(item.quantity) });
  }
  setGuestCart(cart);
  return cart;
}

export function updateGuestCartItem(
  productId: string,
  variantId: string,
  quantity: number,
): GuestCartItem[] {
  const cart = getGuestCart();
  const key = lineKey(productId, variantId);
  const next =
    quantity <= 0
      ? cart.filter((c) => lineKey(c.productId, c.variantId) !== key)
      : cart.map((c) =>
          lineKey(c.productId, c.variantId) === key ? { ...c, quantity: clampQty(quantity) } : c,
        );
  setGuestCart(next);
  return next;
}

export function removeGuestCartItem(productId: string, variantId: string): GuestCartItem[] {
  return updateGuestCartItem(productId, variantId, 0);
}

export function guestCartSubtotal(items: GuestCartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
}
