import { describe, it, expect, beforeEach } from "vitest";
import { Types } from "mongoose";

import { seedOrder } from "../../harness/seed-orders";
import { listAdminOrdersService } from "@/lib/services/admin-order";

describe("listAdminOrdersService", () => {
  const userId = new Types.ObjectId();

  beforeEach(async () => {
    const baseItem = {
      productId: new Types.ObjectId(),
      variantId: new Types.ObjectId(),
      name: "Sample",
      sku: "SAMPLE-01",
      price: 10_000,
      quantity: 1,
    };

    await seedOrder({
      userId,
      status: "placed",
      orderNumber: "GC-20260101-AAAA1",
      items: [baseItem],
    });
    await seedOrder({
      userId,
      status: "shipped",
      orderNumber: "GC-20260101-BBBB2",
      items: [baseItem],
    });
    await seedOrder({
      userId,
      status: "shipped",
      orderNumber: "GC-20260101-CCCC3",
      items: [baseItem],
    });
    await seedOrder({
      userId,
      status: "delivered",
      orderNumber: "GC-20260101-DDDD4",
      items: [baseItem],
    });
  });

  it("filters by status=shipped", async () => {
    const page = await listAdminOrdersService({ status: "shipped" });
    expect(page.total).toBe(2);
    for (const row of page.items) {
      expect(row.orderStatus).toBe("shipped");
    }
  });

  it("matches q by orderNumber prefix (case-insensitive)", async () => {
    const page = await listAdminOrdersService({ q: "gc-20260101-bbbb" });
    expect(page.total).toBe(1);
    expect(page.items[0]?.orderNumber).toBe("GC-20260101-BBBB2");
  });

  it("paginates with envelope {page, limit, total, totalPages}", async () => {
    const page = await listAdminOrdersService({ page: 1, limit: 2 });
    expect(page.page).toBe(1);
    expect(page.limit).toBe(2);
    expect(page.total).toBe(4);
    expect(page.totalPages).toBe(2);
    expect(page.items.length).toBe(2);

    const second = await listAdminOrdersService({ page: 2, limit: 2 });
    expect(second.items.length).toBe(2);
  });

  it("returns empty result when nothing matches", async () => {
    const page = await listAdminOrdersService({ status: "returned" });
    expect(page.total).toBe(0);
    expect(page.items).toEqual([]);
    expect(page.totalPages).toBe(0);
  });
});
