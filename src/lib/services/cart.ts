import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
// reason: cart needs live Product joins; no products query helper exposes the lean shape
// we need (variants + images slice) for cart rendering. Importing the model here is the
// documented exception in `docs/CLAUDE.md` for service-layer reads.
import { Product, type ProductVariantDoc } from "@/lib/db/models/Product";
import {
  getCartByUser,
  upsertCart,
  clearCart as clearCartQuery,
  type LeanCart,
} from "@/lib/db/queries/cart";
import { DEFAULT_SHIPPING_FEE, ERROR_CODES, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import type { Cart, CartItem } from "@/types/api/cart";
import type { CouponValidation } from "@/types/api/coupon";
import { validateCouponAgainstCart } from "./coupon";

export { FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE };

type ProductLean = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  images?: { url: string; alt?: string; order?: number }[];
  variants: ProductVariantDoc[];
  isActive: boolean;
  deletedAt: Date | null;
};

async function loadProductsForCart(
  productIds: Types.ObjectId[],
): Promise<Map<string, ProductLean>> {
  if (productIds.length === 0) return new Map();
  const docs = await Product.find({ _id: { $in: productIds } })
    .select({
      slug: 1,
      name: 1,
      brand: 1,
      images: { $slice: 1 },
      variants: 1,
      isActive: 1,
      deletedAt: 1,
    })
    .lean<ProductLean[]>();
  const map = new Map<string, ProductLean>();
  for (const d of docs) map.set(d._id.toString(), d);
  return map;
}

function computeTotals(
  items: CartItem[],
  discount: number,
): Pick<
  Cart,
  | "subtotal"
  | "discount"
  | "shippingFee"
  | "total"
  | "freeShippingEligible"
  | "freeShippingThreshold"
  | "freeShippingRemaining"
> {
  const subtotal = items.reduce((sum, it) => sum + it.lineSubtotal, 0);
  const postDiscount = Math.max(0, subtotal - discount);
  const freeShippingEligible = postDiscount >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = items.length === 0 || freeShippingEligible ? 0 : DEFAULT_SHIPPING_FEE;
  const total = postDiscount + shippingFee;
  const freeShippingRemaining = freeShippingEligible
    ? 0
    : Math.max(0, FREE_SHIPPING_THRESHOLD - postDiscount);
  return {
    subtotal,
    discount,
    shippingFee,
    total,
    freeShippingEligible,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    freeShippingRemaining,
  };
}

function compositeKey(productId: unknown, variantId: unknown): string {
  return `${String(productId)}:${String(variantId)}`;
}

async function buildCartFromDoc(cartDoc: LeanCart | null, userId: string): Promise<Cart> {
  if (!cartDoc || cartDoc.items.length === 0) {
    const empty = computeTotals([], 0);
    return { items: [], ...empty };
  }

  const productIds = Array.from(new Set(cartDoc.items.map((i) => i.productId.toString()))).map(
    (id) => new Types.ObjectId(id),
  );

  const productMap = await loadProductsForCart(productIds);

  const items: CartItem[] = [];
  for (const line of cartDoc.items) {
    const product = productMap.get(line.productId.toString());
    if (!product || !product.isActive || product.deletedAt) continue;
    const variant = product.variants.find((v) => v._id.toString() === line.variantId.toString());
    if (!variant || !variant.isActive) continue;

    const currentPrice = variant.price;
    const lineSubtotal = currentPrice * line.quantity;
    const item: CartItem = {
      itemId: compositeKey(product._id, variant._id),
      productId: product._id.toString(),
      variantId: variant._id.toString(),
      name: product.name,
      brand: product.brand,
      slug: product.slug,
      variantName: variant.name,
      sku: variant.sku,
      quantity: line.quantity,
      priceSnapshot: line.priceSnapshot,
      currentPrice,
      priceChanged: line.priceSnapshot !== currentPrice,
      lineSubtotal,
    };
    const image = product.images?.[0]?.url ?? variant.image;
    if (image) item.image = image;
    items.push(item);
  }

  let discount = 0;
  if (cartDoc.couponCode) {
    const preview = await validateCouponAgainstCart(
      cartDoc.couponCode,
      { items, subtotal: items.reduce((s, it) => s + it.lineSubtotal, 0) },
      userId,
    );
    if (preview.ok && preview.discount) discount = preview.discount;
  }

  const totals = computeTotals(items, discount);
  const cart: Cart = { items, ...totals };
  if (cartDoc.couponCode) cart.couponCode = cartDoc.couponCode;
  return cart;
}

export async function getCartForUser(userId: string): Promise<Cart> {
  await connectDb();
  const cartDoc = await getCartByUser(userId);
  return buildCartFromDoc(cartDoc, userId);
}

function mergeItems(
  current: LeanCart["items"],
  incoming: {
    productId: Types.ObjectId;
    variantId: Types.ObjectId;
    quantity: number;
    priceSnapshot: number;
  },
  maxQuantity: number,
): LeanCart["items"] {
  const next: LeanCart["items"] = [];
  let merged = false;
  for (const line of current) {
    if (
      line.productId.toString() === incoming.productId.toString() &&
      line.variantId.toString() === incoming.variantId.toString()
    ) {
      const combined = Math.min(line.quantity + incoming.quantity, maxQuantity, 99);
      next.push({ ...line, quantity: combined, priceSnapshot: incoming.priceSnapshot });
      merged = true;
    } else {
      next.push(line);
    }
  }
  if (!merged) {
    next.push({
      productId: incoming.productId,
      variantId: incoming.variantId,
      quantity: Math.min(incoming.quantity, maxQuantity, 99),
      priceSnapshot: incoming.priceSnapshot,
    });
  }
  return next;
}

export async function addCartItem(
  userId: string,
  input: { productId: string; variantId: string; quantity: number },
): Promise<Cart> {
  await connectDb();

  const product = await Product.findById(input.productId)
    .select({ variants: 1, isActive: 1, deletedAt: 1 })
    .lean<{
      _id: Types.ObjectId;
      variants: ProductVariantDoc[];
      isActive: boolean;
      deletedAt: Date | null;
    } | null>();
  if (!product || !product.isActive || product.deletedAt) {
    throw new NotFoundError("Product not found");
  }
  const variant = product.variants.find((v) => v._id.toString() === input.variantId);
  if (!variant || !variant.isActive) {
    throw new NotFoundError("Variant not found");
  }

  const availableStock = Math.max(0, variant.stock - variant.reservedStock);
  if (availableStock <= 0) {
    throw new ValidationError("Out of stock", ERROR_CODES.INSUFFICIENT_STOCK);
  }

  const maxQuantity = Math.min(99, availableStock);
  const existing = await getCartByUser(userId);
  const current = existing?.items ?? [];
  const items = mergeItems(
    current,
    {
      productId: new Types.ObjectId(input.productId),
      variantId: new Types.ObjectId(input.variantId),
      quantity: input.quantity,
      priceSnapshot: variant.price,
    },
    maxQuantity,
  );

  await upsertCart(
    userId,
    items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
      priceSnapshot: i.priceSnapshot,
    })),
    existing?.couponCode,
  );

  return getCartForUser(userId);
}

function findLineByItemId(items: LeanCart["items"], itemId: string): number {
  return items.findIndex((line) => compositeKey(line.productId, line.variantId) === itemId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<Cart> {
  await connectDb();
  const cart = await getCartByUser(userId);
  if (!cart) throw new NotFoundError("Cart not found");

  const idx = findLineByItemId(cart.items, itemId);
  if (idx === -1) throw new NotFoundError("Cart item not found");

  let items: LeanCart["items"];
  if (quantity <= 0) {
    items = cart.items.filter((_, i) => i !== idx);
  } else {
    items = cart.items.map((line, i) =>
      i === idx ? { ...line, quantity: Math.min(quantity, 99) } : line,
    );
  }

  await upsertCart(
    userId,
    items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
      priceSnapshot: i.priceSnapshot,
    })),
    cart.couponCode,
  );
  return getCartForUser(userId);
}

export async function removeCartItem(userId: string, itemId: string): Promise<Cart> {
  return updateCartItem(userId, itemId, 0);
}

export async function clearCart(userId: string): Promise<Cart> {
  await connectDb();
  await clearCartQuery(userId);
  return getCartForUser(userId);
}

export async function applyCoupon(userId: string, code: string): Promise<CouponValidation> {
  await connectDb();
  const cart = await getCartForUser(userId);
  const preview = await validateCouponAgainstCart(code, cart, userId);
  if (preview.ok) {
    const existing = await getCartByUser(userId);
    const items = existing?.items ?? [];
    await upsertCart(
      userId,
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        priceSnapshot: i.priceSnapshot,
      })),
      code.toUpperCase(),
    );
  }
  return preview;
}

export async function removeCoupon(userId: string): Promise<Cart> {
  await connectDb();
  const existing = await getCartByUser(userId);
  if (existing) {
    await upsertCart(
      userId,
      existing.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        priceSnapshot: i.priceSnapshot,
      })),
      // undefined => $unset couponCode in upsertCart
      undefined,
    );
  }
  return getCartForUser(userId);
}
