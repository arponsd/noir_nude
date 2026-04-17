import { describe, it, expect, beforeEach } from "vitest";
import type { Types } from "mongoose";
import { seedCatalog, type SeededCatalog } from "../../harness/seed-catalog";
import { seedUser } from "../../harness/seed";
import { seedDefaultCoupons, seedCoupons } from "../../harness/seed-coupons";
import { seedCart } from "../../harness/seed-cart";
import { createAddress } from "@/lib/services/address";
import { getCartForUser } from "@/lib/services/cart";
import { placeGuestOrder, placeOrderForUser } from "@/lib/services/order";
import { Cart } from "@/lib/db/models/Cart";
import { Coupon } from "@/lib/db/models/Coupon";
import { CouponRedemption } from "@/lib/db/models/CouponRedemption";
import { Order } from "@/lib/db/models/Order";
import { Product } from "@/lib/db/models/Product";
import { ERROR_CODES } from "@/lib/constants";

const orderAddress = () => ({
  label: "home" as const,
  recipientName: "Rumana K",
  phone: "+8801712345678",
  addressLine1: "Road 4, House 22",
  city: "Dhaka",
  district: "Dhaka",
  postalCode: "1212",
  country: "BD",
});

async function variantStock(productId: string, variantId: string): Promise<number> {
  const doc = await Product.findById(productId)
    .select({ variants: 1 })
    .lean<{ variants: { _id: Types.ObjectId; stock: number }[] } | null>();
  const v = doc?.variants.find((x) => x._id.toString() === variantId);
  if (!v) throw new Error(`variant ${variantId} not found`);
  return v.stock;
}

describe("placeOrderForUser — happy path", () => {
  let catalog: SeededCatalog;
  let userId: string;
  let addressId: string;
  let productA: { productId: string; variantId: string };
  let productB: { productId: string; variantId: string };

  beforeEach(async () => {
    catalog = await seedCatalog({
      products: [
        {
          name: "Stock Test Lipstick",
          slug: "stock-test-lipstick",
          categorySlug: "lipstick",
          basePrice: 80_000,
          variants: [{ name: "Default", sku: "STL-01", price: 80_000, stock: 10 }],
        },
        {
          name: "Stock Test Foundation",
          slug: "stock-test-foundation",
          categorySlug: "foundation",
          basePrice: 150_000,
          variants: [{ name: "Default", sku: "STF-01", price: 150_000, stock: 5 }],
        },
      ],
    });
    const user = await seedUser({
      email: "place-order@example.com",
      password: "Zx!9aQpm.Vr34K",
    });
    userId = user.userId;
    const address = await createAddress(userId, orderAddress());
    addressId = address.id;

    const lipstick = catalog.productBySlug.get("stock-test-lipstick");
    const foundation = catalog.productBySlug.get("stock-test-foundation");
    if (!lipstick?.variantIds[0] || !foundation?.variantIds[0]) {
      throw new Error("seedCatalog returned no variants");
    }
    productA = { productId: lipstick.id, variantId: lipstick.variantIds[0] };
    productB = { productId: foundation.id, variantId: foundation.variantIds[0] };
  });

  it("places an order, snapshots items, decrements stock, clears cart", async () => {
    await seedCart({
      userId,
      lines: [
        { productId: productA.productId, variantId: productA.variantId, quantity: 2 },
        { productId: productB.productId, variantId: productB.variantId, quantity: 1 },
      ],
    });

    const order = await placeOrderForUser(userId, { addressId });

    expect(order.orderNumber).toMatch(/^GC-\d{8}-[A-Z0-9]{5}$/);
    expect(order.items.length).toBe(2);

    // Snapshot assertions: name/sku/price captured at order time.
    const lineA = order.items.find((i) => i.productId === productA.productId)!;
    expect(lineA.price).toBe(80_000);
    expect(lineA.quantity).toBe(2);
    expect(lineA.subtotal).toBe(160_000);
    expect(lineA.sku).toBe("STL-01");
    expect(lineA.name).toBe("Stock Test Lipstick");

    // statusHistory seeded with the initial "placed" entry.
    expect(order.statusHistory.length).toBeGreaterThanOrEqual(1);
    expect(order.statusHistory[0]!.status).toBe("placed");

    // Stock decremented atomically.
    expect(await variantStock(productA.productId, productA.variantId)).toBe(8);
    expect(await variantStock(productB.productId, productB.variantId)).toBe(4);

    // Cart cleared.
    const cart = await getCartForUser(userId);
    expect(cart.items.length).toBe(0);
  });

  it("INSUFFICIENT_STOCK throws and leaves stock + cart untouched", async () => {
    // Stock is 10 for productA; request 11.
    await seedCart({
      userId,
      lines: [{ productId: productA.productId, variantId: productA.variantId, quantity: 11 }],
    });

    await expect(placeOrderForUser(userId, { addressId })).rejects.toMatchObject({
      code: ERROR_CODES.INSUFFICIENT_STOCK,
    });

    // Stock unchanged.
    expect(await variantStock(productA.productId, productA.variantId)).toBe(10);

    // No Order persisted.
    const orderCount = await Order.countDocuments({ userId });
    expect(orderCount).toBe(0);

    // Cart still has the failed line (cart isn't cleared on failure).
    const cartDoc = await Cart.findOne({ userId }).lean<{ items: unknown[] } | null>();
    expect(cartDoc?.items.length).toBe(1);
  });

  it("coupon WELCOME10 applies 10% discount, records redemption, increments usedCount", async () => {
    await seedDefaultCoupons();
    await seedCart({
      userId,
      lines: [
        { productId: productA.productId, variantId: productA.variantId, quantity: 1 }, // 80_000
        { productId: productB.productId, variantId: productB.variantId, quantity: 1 }, // 150_000
      ],
      couponCode: "WELCOME10",
    });

    const order = await placeOrderForUser(userId, { addressId });

    // subtotal 230_000, 10% = 23_000 discount.
    expect(order.subtotal).toBe(230_000);
    expect(order.discount).toBe(23_000);
    expect(order.couponCode).toBe("WELCOME10");
    // Subtotal post-discount 207_000 ≥ free shipping threshold (200_000) → shippingFee 0.
    expect(order.shippingFee).toBe(0);
    expect(order.total).toBe(207_000);

    const redemptions = await CouponRedemption.find({ orderId: order.id }).lean();
    expect(redemptions.length).toBe(1);
    expect(redemptions[0]!.userId?.toString()).toBe(userId);

    const coupon = await Coupon.findOne({ code: "WELCOME10" }).lean();
    expect(coupon!.usedCount).toBe(1);
  });

  it("below free-shipping threshold → shippingFee=5000; above → 0", async () => {
    // Below: 1 lipstick @ 80_000 → shipping 5_000.
    await seedCart({
      userId,
      lines: [{ productId: productA.productId, variantId: productA.variantId, quantity: 1 }],
    });
    const below = await placeOrderForUser(userId, { addressId });
    expect(below.subtotal).toBe(80_000);
    expect(below.shippingFee).toBe(5_000);
    expect(below.total).toBe(85_000);

    // Above: 3 lipsticks (240_000) → shipping 0. Different user so cart/address starts clean.
    const user2 = await seedUser({ email: "above+ship@example.com", password: "Zx!9aQpm.Vr34K" });
    const addr2 = await createAddress(user2.userId, orderAddress());
    await seedCart({
      userId: user2.userId,
      lines: [{ productId: productA.productId, variantId: productA.variantId, quantity: 3 }],
    });
    const above = await placeOrderForUser(user2.userId, { addressId: addr2.id });
    expect(above.subtotal).toBe(240_000);
    expect(above.shippingFee).toBe(0);
    expect(above.total).toBe(240_000);
  });

  it("SHIP0 coupon forces free shipping regardless of subtotal", async () => {
    await seedCoupons([{ code: "SHIP0", type: "free_shipping", value: 0 }]);
    await seedCart({
      userId,
      lines: [{ productId: productA.productId, variantId: productA.variantId, quantity: 1 }], // 80_000 — below threshold
      couponCode: "SHIP0",
    });
    const order = await placeOrderForUser(userId, { addressId });
    expect(order.shippingFee).toBe(0);
    expect(order.discount).toBe(0);
    expect(order.total).toBe(80_000);
    expect(order.couponCode).toBe("SHIP0");
  });
});

describe("placeGuestOrder", () => {
  let productA: { productId: string; variantId: string };

  beforeEach(async () => {
    const catalog = await seedCatalog({
      products: [
        {
          name: "Guest Test Lipstick",
          slug: "guest-test-lipstick",
          categorySlug: "lipstick",
          basePrice: 60_000,
          variants: [{ name: "Default", sku: "GTL-01", price: 60_000, stock: 15 }],
        },
      ],
    });
    const lipstick = catalog.productBySlug.get("guest-test-lipstick");
    if (!lipstick?.variantIds[0]) throw new Error("missing variant");
    productA = { productId: lipstick.id, variantId: lipstick.variantIds[0] };
  });

  it("creates an Order with guestEmail, statusHistory, and snapshotted items", async () => {
    const order = await placeGuestOrder({
      guestEmail: "guest@example.com",
      phone: "+8801712345678",
      shippingAddress: orderAddress(),
      items: [{ productId: productA.productId, variantId: productA.variantId, quantity: 2 }],
    });

    expect(order.orderNumber).toMatch(/^GC-\d{8}-[A-Z0-9]{5}$/);
    expect(order.items.length).toBe(1);
    expect(order.items[0]!.price).toBe(60_000);
    expect(order.items[0]!.subtotal).toBe(120_000);
    expect(order.statusHistory[0]!.status).toBe("placed");

    // Guest email persisted on the raw doc.
    const raw = await Order.findById(order.id).lean<{ guestEmail?: string } | null>();
    expect(raw!.guestEmail).toBe("guest@example.com");
  });
});
