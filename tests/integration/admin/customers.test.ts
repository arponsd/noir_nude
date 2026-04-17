import { describe, it, expect, beforeEach } from "vitest";
import { Types } from "mongoose";

import { seedUser } from "../../harness/seed";
import { seedOrder } from "../../harness/seed-orders";
import { getCustomerDetailService, listCustomersService } from "@/lib/services/admin-customer";

describe("admin customers service", () => {
  let u1: string;
  let u2: string;
  let u3: string;

  beforeEach(async () => {
    const a = await seedUser({
      email: "alice@example.com",
      password: "Zx!9aQpm.Vr34K",
      name: "Alice",
    });
    const b = await seedUser({ email: "bob@example.com", password: "Zx!9aQpm.Vr34K", name: "Bob" });
    const c = await seedUser({
      email: "carol@example.com",
      password: "Zx!9aQpm.Vr34K",
      name: "Carol",
    });
    await seedUser({
      email: "admin@example.com",
      password: "Zx!9aQpm.Vr34K",
      role: "admin",
      name: "Adminy",
    });

    u1 = a.userId;
    u2 = b.userId;
    u3 = c.userId;

    const baseItem = {
      productId: new Types.ObjectId(),
      variantId: new Types.ObjectId(),
      name: "Sample",
      sku: "S-01",
      price: 10_000,
      quantity: 1,
    };

    // Alice: 1 delivered (10k) + 1 cancelled (should be excluded)
    await seedOrder({ userId: u1, status: "delivered", items: [baseItem] });
    await seedOrder({ userId: u1, status: "cancelled", items: [baseItem] });

    // Bob: 2 delivered (20k)
    await seedOrder({ userId: u2, status: "delivered", items: [baseItem] });
    await seedOrder({ userId: u2, status: "delivered", items: [baseItem] });
  });

  it("listCustomers returns only role=customer users", async () => {
    const page = await listCustomersService({});
    const emails = page.items.map((r) => r.email);
    expect(emails).toContain("alice@example.com");
    expect(emails).toContain("bob@example.com");
    expect(emails).toContain("carol@example.com");
    expect(emails).not.toContain("admin@example.com");
    expect(page.total).toBe(3);
  });

  it("q prefix match restricts the listing", async () => {
    const page = await listCustomersService({ q: "ali" });
    expect(page.items.length).toBe(1);
    expect(page.items[0]?.email).toBe("alice@example.com");
  });

  it("getCustomerDetail returns profile + last 10 orders + totalSpent excluding cancelled/returned", async () => {
    const detail = await getCustomerDetailService(u1);
    expect(detail.email).toBe("alice@example.com");
    // Alice placed 2 orders; only delivered counts toward totalSpent (10k).
    expect(detail.totalSpent).toBe(10_000);
    // orders surface both (cancelled is still part of history).
    expect(detail.orders.length).toBe(2);
    // totalOrders = raw count (all non-deleted, including cancelled).
    expect(detail.totalOrders).toBe(2);
  });

  it("Bob aggregates both delivered orders", async () => {
    const detail = await getCustomerDetailService(u2);
    expect(detail.totalSpent).toBe(20_000);
    expect(detail.totalOrders).toBe(2);
  });

  it("Carol has no orders → totalSpent=0, orders empty", async () => {
    const detail = await getCustomerDetailService(u3);
    expect(detail.totalSpent).toBe(0);
    expect(detail.orders).toEqual([]);
    expect(detail.totalOrders).toBe(0);
  });
});
