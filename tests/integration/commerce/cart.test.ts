import { describe, it, expect, beforeEach } from "vitest";
import { seedCatalog, type SeededCatalog } from "../../harness/seed-catalog";
import { seedUser } from "../../harness/seed";
import { seedDefaultCoupons } from "../../harness/seed-coupons";
import {
  addCartItem,
  clearCart,
  getCartForUser,
  removeCartItem,
  updateCartItem,
  applyCoupon,
  removeCoupon,
} from "@/lib/services/cart";

/**
 * Cart service integration — exercises real Mongo via mongodb-memory-server.
 * The DB is dropped between tests (see tests/integration/setup.ts), so every
 * `it` starts from empty collections.
 */
describe("cart service", () => {
  let catalog: SeededCatalog;
  let userId: string;
  let productId: string;
  let variantId: string;
  let altProductId: string;
  let altVariantId: string;

  beforeEach(async () => {
    catalog = await seedCatalog();
    const user = await seedUser({ email: "cart+tester@example.com", password: "Zx!9aQpm.Vr34K" });
    userId = user.userId;

    const lipstick = catalog.productBySlug.get("velvet-matte-lipstick");
    const foundation = catalog.productBySlug.get("velvet-cushion-foundation");
    if (!lipstick || !foundation) throw new Error("seedCatalog missing expected products");
    productId = lipstick.id;
    variantId = lipstick.variantIds[0] ?? "";
    altProductId = foundation.id;
    altVariantId = foundation.variantIds[0] ?? "";
    if (!variantId || !altVariantId) throw new Error("seedCatalog missing variant ids");
  });

  it("adds a single item and snapshots its price", async () => {
    const cart = await addCartItem(userId, { productId, variantId, quantity: 1 });
    expect(cart.items.length).toBe(1);
    const line = cart.items[0]!;
    expect(line.productId).toBe(productId);
    expect(line.variantId).toBe(variantId);
    expect(line.quantity).toBe(1);
    expect(line.priceSnapshot).toBe(85000);
    expect(line.currentPrice).toBe(85000);
    expect(line.lineSubtotal).toBe(85000);
    expect(line.priceChanged).toBe(false);
  });

  it("adding the same variant twice accumulates quantity (not two lines)", async () => {
    await addCartItem(userId, { productId, variantId, quantity: 2 });
    const cart = await addCartItem(userId, { productId, variantId, quantity: 3 });
    expect(cart.items.length).toBe(1);
    expect(cart.items[0]!.quantity).toBe(5);
  });

  it("different variants produce separate lines", async () => {
    await addCartItem(userId, { productId, variantId, quantity: 1 });
    const cart = await addCartItem(userId, {
      productId: altProductId,
      variantId: altVariantId,
      quantity: 1,
    });
    expect(cart.items.length).toBe(2);
  });

  it("update qty to 0 removes the line", async () => {
    const seeded = await addCartItem(userId, { productId, variantId, quantity: 2 });
    const itemId = seeded.items[0]!.itemId;
    const after = await updateCartItem(userId, itemId, 0);
    expect(after.items.length).toBe(0);
  });

  it("update qty to a new positive number rewrites the line", async () => {
    const seeded = await addCartItem(userId, { productId, variantId, quantity: 2 });
    const itemId = seeded.items[0]!.itemId;
    const after = await updateCartItem(userId, itemId, 7);
    expect(after.items[0]!.quantity).toBe(7);
  });

  it("removeCartItem deletes the line", async () => {
    const seeded = await addCartItem(userId, { productId, variantId, quantity: 1 });
    const itemId = seeded.items[0]!.itemId;
    const after = await removeCartItem(userId, itemId);
    expect(after.items.length).toBe(0);
  });

  it("clearCart empties all lines", async () => {
    await addCartItem(userId, { productId, variantId, quantity: 1 });
    await addCartItem(userId, { productId: altProductId, variantId: altVariantId, quantity: 1 });
    const cleared = await clearCart(userId);
    expect(cleared.items.length).toBe(0);
    expect(cleared.subtotal).toBe(0);
  });

  describe("coupon apply / remove", () => {
    beforeEach(async () => {
      await seedDefaultCoupons();
    });

    it("applies WELCOME10 (10%) and stores it on the cart", async () => {
      await addCartItem(userId, { productId, variantId, quantity: 1 }); // 85,000
      await addCartItem(userId, {
        productId: altProductId,
        variantId: altVariantId,
        quantity: 1,
      }); // 125,000 → subtotal 210,000 ≥ minOrder 50,000

      const result = await applyCoupon(userId, "WELCOME10");
      expect(result.ok).toBe(true);
      expect(result.code).toBe("WELCOME10");
      expect(result.discount).toBe(21_000); // 10% of 210_000

      const cart = await getCartForUser(userId);
      expect(cart.couponCode).toBe("WELCOME10");
      expect(cart.discount).toBe(21_000);
    });

    it("rejects an invalid coupon with ok:false + reason", async () => {
      await addCartItem(userId, { productId, variantId, quantity: 1 });
      const result = await applyCoupon(userId, "DOESNOTEXIST");
      expect(result.ok).toBe(false);
      expect(result.reason).toBe("INVALID");
    });

    it("removeCoupon strips couponCode from the cart", async () => {
      await addCartItem(userId, { productId, variantId, quantity: 1 });
      await addCartItem(userId, {
        productId: altProductId,
        variantId: altVariantId,
        quantity: 1,
      });
      await applyCoupon(userId, "WELCOME10");
      const cleared = await removeCoupon(userId);
      expect(cleared.couponCode).toBeUndefined();
      expect(cleared.discount).toBe(0);
    });
  });
});
