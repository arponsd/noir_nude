import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Types } from "mongoose";
import { seedCatalog } from "../../harness/seed-catalog";
import { seedUser } from "../../harness/seed";
import { seedCart } from "../../harness/seed-cart";
import { createAddress } from "@/lib/services/address";
import { cancelOrder, placeOrderForUser } from "@/lib/services/order";
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
  if (!v) throw new Error("variant not found");
  return v.stock;
}

describe("cancelOrder", () => {
  let userId: string;
  let addressId: string;
  let productId: string;
  let variantId: string;

  beforeEach(async () => {
    const catalog = await seedCatalog({
      products: [
        {
          name: "Cancel Test Lipstick",
          slug: "cancel-test-lipstick",
          categorySlug: "lipstick",
          basePrice: 80_000,
          variants: [{ name: "Default", sku: "CTL-01", price: 80_000, stock: 10 }],
        },
      ],
    });
    const user = await seedUser({ email: "cancel+tester@example.com", password: "Zx!9aQpm.Vr34K" });
    userId = user.userId;
    const address = await createAddress(userId, orderAddress());
    addressId = address.id;
    const lipstick = catalog.productBySlug.get("cancel-test-lipstick");
    if (!lipstick?.variantIds[0]) throw new Error("missing variant");
    productId = lipstick.id;
    variantId = lipstick.variantIds[0];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cancels an order within the 2h window and restores stock", async () => {
    await seedCart({ userId, lines: [{ productId, variantId, quantity: 3 }] });
    const order = await placeOrderForUser(userId, { addressId });
    expect(await variantStock(productId, variantId)).toBe(7);

    const cancelled = await cancelOrder(userId, order.id, "changed my mind");
    expect(cancelled.orderStatus).toBe("cancelled");
    // statusHistory has placed + cancelled entries.
    const statuses = cancelled.statusHistory.map((s) => s.status);
    expect(statuses).toContain("placed");
    expect(statuses).toContain("cancelled");

    // Stock restored.
    expect(await variantStock(productId, variantId)).toBe(10);
  });

  it("throws ORDER_NOT_CANCELLABLE after the 2h window elapses", async () => {
    await seedCart({ userId, lines: [{ productId, variantId, quantity: 1 }] });
    const order = await placeOrderForUser(userId, { addressId });

    // Jump 3 hours forward using fake timers.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 3 * 60 * 60 * 1000));

    await expect(cancelOrder(userId, order.id, "too late")).rejects.toMatchObject({
      code: ERROR_CODES.ORDER_NOT_CANCELLABLE,
    });
  });

  it("throws ORDER_NOT_CANCELLABLE from a non-cancellable status ('shipped')", async () => {
    await seedCart({ userId, lines: [{ productId, variantId, quantity: 1 }] });
    const order = await placeOrderForUser(userId, { addressId });

    // Force the order to 'shipped' directly — cancel should reject.
    await Order.updateOne({ _id: order.id }, { $set: { orderStatus: "shipped" } });

    await expect(cancelOrder(userId, order.id, "trying to cancel")).rejects.toMatchObject({
      code: ERROR_CODES.ORDER_NOT_CANCELLABLE,
    });
  });

  it("non-owner cannot cancel — surfaces NOT_FOUND", async () => {
    await seedCart({ userId, lines: [{ productId, variantId, quantity: 1 }] });
    const order = await placeOrderForUser(userId, { addressId });

    const other = await seedUser({
      email: "other+user@example.com",
      password: "Zx!9aQpm.Vr34K",
    });

    await expect(cancelOrder(other.userId, order.id, "not mine to cancel")).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
    });

    // Original order untouched.
    const reloaded = await Order.findById(order.id).lean<{ orderStatus: string } | null>();
    expect(reloaded!.orderStatus).toBe("placed");
  });
});
