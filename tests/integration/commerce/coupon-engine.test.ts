import { beforeEach, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { seedCatalog, type SeededCatalog } from "../../harness/seed-catalog";
import { seedUser } from "../../harness/seed";
import { seedCart } from "../../harness/seed-cart";
import { seedCoupons, seedDefaultCoupons } from "../../harness/seed-coupons";
import { createAddress } from "@/lib/services/address";
import { validateCouponAgainstCart } from "@/lib/services/coupon";
import { placeOrderForUser } from "@/lib/services/order";
import { getCartForUser } from "@/lib/services/cart";

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

describe("coupon engine — validateCouponForOrder (via validateCouponAgainstCart)", () => {
  let catalog: SeededCatalog;
  let userId: string;
  let productId: string;
  let variantId: string;

  beforeEach(async () => {
    catalog = await seedCatalog({
      products: [
        {
          name: "Coupon Test Lipstick",
          slug: "coupon-test-lipstick",
          categorySlug: "lipstick",
          basePrice: 100_000,
          variants: [{ name: "Default", sku: "CPL-01", price: 100_000, stock: 50 }],
        },
      ],
    });
    const user = await seedUser({ email: "coupon+tester@example.com", password: "Zx!9aQpm.Vr34K" });
    userId = user.userId;
    const lipstick = catalog.productBySlug.get("coupon-test-lipstick");
    if (!lipstick?.variantIds[0]) throw new Error("missing variant");
    productId = lipstick.id;
    variantId = lipstick.variantIds[0];
    await seedCart({
      userId,
      lines: [{ productId, variantId, quantity: 2 }], // subtotal = 200_000
    });
  });

  async function previewAgainstCart(code: string, uId = userId) {
    const cart = await getCartForUser(uId);
    return validateCouponAgainstCart(
      code,
      { items: cart.items, subtotal: cart.items.reduce((s, i) => s + i.lineSubtotal, 0) },
      uId,
    );
  }

  it("percentage: discount = subtotal * value / 100", async () => {
    await seedDefaultCoupons();
    const result = await previewAgainstCart("WELCOME10");
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(20_000); // 10% of 200_000
  });

  it("percentage: capped at maxDiscount", async () => {
    // VIP20 = 20%, capped at 200_000. With subtotal 200_000 → 20% = 40_000 (below cap, fine).
    // Use a higher-subtotal cart to exercise cap.
    const other = await seedUser({ email: "vip+tester@example.com", password: "Zx!9aQpm.Vr34K" });
    await seedCart({
      userId: other.userId,
      lines: [{ productId, variantId, quantity: 20 }], // subtotal 2,000,000; 20% = 400_000 → capped at 200_000
    });
    await seedDefaultCoupons();
    const result = await previewAgainstCart("VIP20", other.userId);
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(200_000);
  });

  it("fixed: discount = value, capped at subtotal", async () => {
    // FLAT500 = 50_000 off, minOrder 100_000. Subtotal 200_000 easily passes.
    await seedDefaultCoupons();
    const result = await previewAgainstCart("FLAT500");
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(50_000);

    // Exercise the cap path: seed a fixed coupon larger than subtotal.
    await seedCoupons([{ code: "BIGOFF", type: "fixed", value: 999_999 }]);
    const capped = await previewAgainstCart("BIGOFF");
    expect(capped.ok).toBe(true);
    expect(capped.discount).toBe(200_000); // capped to subtotal
  });

  it("free_shipping: freeShipping=true, discount=0", async () => {
    await seedDefaultCoupons();
    const result = await previewAgainstCart("SHIP0");
    expect(result.ok).toBe(true);
    expect(result.freeShipping).toBe(true);
    expect(result.discount).toBe(0);
  });

  it("MIN_ORDER_NOT_MET when subtotal < minOrderAmount", async () => {
    await seedCoupons([{ code: "MIN500K", type: "fixed", value: 10_000, minOrderAmount: 500_000 }]);
    const result = await previewAgainstCart("MIN500K");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("MIN_ORDER_NOT_MET");
  });

  it("EXPIRED when validUntil has passed", async () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const longerPast = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await seedCoupons([
      {
        code: "OLDIE",
        type: "percentage",
        value: 10,
        validFrom: longerPast,
        validUntil: past,
      },
    ]);
    const result = await previewAgainstCart("OLDIE");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("EXPIRED");
  });

  it("INACTIVE (isActive=false) returns INVALID (coupon hidden)", async () => {
    await seedCoupons([{ code: "DORMANT", type: "percentage", value: 5, isActive: false }]);
    const result = await previewAgainstCart("DORMANT");
    expect(result.ok).toBe(false);
    // reason: the coupon-helpers query filters `isActive: true`, so inactive coupons
    // look indistinguishable from non-existent → "INVALID" is the documented reason.
    expect(result.reason).toBe("INVALID");
  });

  it("USAGE_EXHAUSTED when usedCount >= usageLimit", async () => {
    await seedCoupons([
      { code: "CAPPED", type: "percentage", value: 5, usageLimit: 1, usedCount: 1 },
    ]);
    const result = await previewAgainstCart("CAPPED");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("USAGE_EXHAUSTED");
  });

  it("PER_USER_EXHAUSTED after a user redeems the coupon once (limit 1)", async () => {
    await seedCoupons([{ code: "ONCEPU", type: "fixed", value: 10_000, perUserLimit: 1 }]);
    const addr = await createAddress(userId, orderAddress());

    // First order: redeems it.
    await seedCart({
      userId,
      lines: [{ productId, variantId, quantity: 2 }],
      couponCode: "ONCEPU",
    });
    await placeOrderForUser(userId, { addressId: addr.id });

    // Second attempt: seed a fresh cart and try again.
    await seedCart({
      userId,
      lines: [{ productId, variantId, quantity: 2 }],
    });
    const result = await previewAgainstCart("ONCEPU");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("PER_USER_EXHAUSTED");
  });

  it("applicableProducts scope: rejects when no cart item matches", async () => {
    // Scope the coupon to a product id that is NOT in the cart.
    const unrelatedProductId = new Types.ObjectId().toString();
    await seedCoupons([
      {
        code: "SCOPED",
        type: "percentage",
        value: 10,
        applicableProducts: [unrelatedProductId],
      },
    ]);
    const result = await previewAgainstCart("SCOPED");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("NOT_APPLICABLE");
  });
});
