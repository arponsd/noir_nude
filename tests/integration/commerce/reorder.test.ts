import { beforeEach, describe, expect, it } from "vitest";
import { seedCatalog, type SeededCatalog } from "../../harness/seed-catalog";
import { seedUser } from "../../harness/seed";
import { seedCart } from "../../harness/seed-cart";
import { createAddress } from "@/lib/services/address";
import { placeOrderForUser, reorderAsCart } from "@/lib/services/order";
import { Product } from "@/lib/db/models/Product";

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

describe("reorderAsCart", () => {
  let catalog: SeededCatalog;
  let userId: string;
  let addressId: string;
  let productA: { productId: string; variantId: string };
  let productB: { productId: string; variantId: string };

  beforeEach(async () => {
    catalog = await seedCatalog({
      products: [
        {
          name: "Reorder Lipstick",
          slug: "reorder-lipstick",
          categorySlug: "lipstick",
          basePrice: 70_000,
          variants: [{ name: "Default", sku: "RL-01", price: 70_000, stock: 20 }],
        },
        {
          name: "Reorder Foundation",
          slug: "reorder-foundation",
          categorySlug: "foundation",
          basePrice: 120_000,
          variants: [{ name: "Default", sku: "RF-01", price: 120_000, stock: 20 }],
        },
      ],
    });
    const user = await seedUser({ email: "reorder@example.com", password: "Zx!9aQpm.Vr34K" });
    userId = user.userId;
    const address = await createAddress(userId, orderAddress());
    addressId = address.id;

    const lipstick = catalog.productBySlug.get("reorder-lipstick");
    const foundation = catalog.productBySlug.get("reorder-foundation");
    if (!lipstick?.variantIds[0] || !foundation?.variantIds[0]) {
      throw new Error("seedCatalog missing variants");
    }
    productA = { productId: lipstick.id, variantId: lipstick.variantIds[0] };
    productB = { productId: foundation.id, variantId: foundation.variantIds[0] };
  });

  it("rehydrates the cart with the original items", async () => {
    await seedCart({
      userId,
      lines: [
        { productId: productA.productId, variantId: productA.variantId, quantity: 2 },
        { productId: productB.productId, variantId: productB.variantId, quantity: 1 },
      ],
    });
    const order = await placeOrderForUser(userId, { addressId });

    const { cart, skipped } = await reorderAsCart(userId, order.id);
    expect(skipped).toEqual([]);
    expect(cart.items.length).toBe(2);

    const byPid = new Map(cart.items.map((i) => [i.productId, i]));
    expect(byPid.get(productA.productId)?.quantity).toBe(2);
    expect(byPid.get(productB.productId)?.quantity).toBe(1);
  });

  it("skips inactive variants and reports them", async () => {
    await seedCart({
      userId,
      lines: [
        { productId: productA.productId, variantId: productA.variantId, quantity: 1 },
        { productId: productB.productId, variantId: productB.variantId, quantity: 1 },
      ],
    });
    const order = await placeOrderForUser(userId, { addressId });

    // Retire productB entirely (soft-delete + deactivate).
    await Product.updateOne(
      { _id: productB.productId },
      { $set: { isActive: false, deletedAt: new Date() } },
    );

    const { cart, skipped } = await reorderAsCart(userId, order.id);
    expect(cart.items.length).toBe(1);
    expect(cart.items[0]!.productId).toBe(productA.productId);
    expect(skipped).toContain("Reorder Foundation");
  });
});
