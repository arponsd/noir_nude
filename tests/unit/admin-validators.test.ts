import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import {
  adminOrderStatusUpdateSchema,
  adminRefundSchema,
  adminOrdersQuerySchema,
  adminInventoryAdjustSchema,
  adminCouponCreateSchema,
  adminCouponUpdateSchema,
  adminBannerCreateSchema,
  adminBannerUpdateSchema,
  adminBannerReorderSchema,
  adminReportsQuerySchema,
  adminActivityQuerySchema,
  adminCustomersQuerySchema,
  adminDashboardQuerySchema,
} from "@/lib/validators/admin";

function oid(): string {
  return new Types.ObjectId().toString();
}

describe("adminOrderStatusUpdateSchema", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = adminOrderStatusUpdateSchema.parse({ status: "shipped" });
    expect(parsed.status).toBe("shipped");
  });

  it("accepts note + tracking + courier", () => {
    const parsed = adminOrderStatusUpdateSchema.parse({
      status: "shipped",
      note: "handed to carrier",
      trackingNumber: "SP-12345",
      courier: "Sundarban",
    });
    expect(parsed.trackingNumber).toBe("SP-12345");
  });

  it("rejects unknown status", () => {
    expect(() => adminOrderStatusUpdateSchema.parse({ status: "exploded" })).toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() => adminOrderStatusUpdateSchema.parse({ status: "packed", hack: true })).toThrow();
  });

  it("rejects empty note", () => {
    expect(() => adminOrderStatusUpdateSchema.parse({ status: "packed", note: "   " })).toThrow();
  });
});

describe("adminRefundSchema", () => {
  it("accepts a valid refund", () => {
    const parsed = adminRefundSchema.parse({ amount: 1000, reason: "damaged" });
    expect(parsed.amount).toBe(1000);
  });

  it("rejects zero/negative amount", () => {
    expect(() => adminRefundSchema.parse({ amount: 0, reason: "x" })).toThrow();
    expect(() => adminRefundSchema.parse({ amount: -1, reason: "x" })).toThrow();
  });

  it("rejects short reason", () => {
    expect(() => adminRefundSchema.parse({ amount: 1, reason: "ab" })).toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() => adminRefundSchema.parse({ amount: 1, reason: "damaged", foo: 1 })).toThrow();
  });
});

describe("adminOrdersQuerySchema", () => {
  it("coerces numeric strings", () => {
    const parsed = adminOrdersQuerySchema.parse({ page: "2", limit: "10" });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
  });

  it("accepts empty object", () => {
    expect(adminOrdersQuerySchema.parse({})).toEqual({});
  });

  it("rejects limit > 100", () => {
    expect(() => adminOrdersQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() => adminOrdersQuerySchema.parse({ foo: "bar" })).toThrow();
  });
});

describe("adminInventoryAdjustSchema", () => {
  it("accepts a positive delta", () => {
    const parsed = adminInventoryAdjustSchema.parse({
      productId: oid(),
      variantId: oid(),
      delta: 5,
      reason: "restock",
    });
    expect(parsed.delta).toBe(5);
  });

  it("accepts a negative delta", () => {
    const parsed = adminInventoryAdjustSchema.parse({
      productId: oid(),
      variantId: oid(),
      delta: -3,
      reason: "spoilage",
    });
    expect(parsed.delta).toBe(-3);
  });

  it("rejects zero delta (non-zero refine)", () => {
    expect(() =>
      adminInventoryAdjustSchema.parse({
        productId: oid(),
        variantId: oid(),
        delta: 0,
        reason: "noop",
      }),
    ).toThrow();
  });

  it("rejects non-integer delta", () => {
    expect(() =>
      adminInventoryAdjustSchema.parse({
        productId: oid(),
        variantId: oid(),
        delta: 1.5,
        reason: "weird",
      }),
    ).toThrow();
  });

  it("rejects bad ObjectId", () => {
    expect(() =>
      adminInventoryAdjustSchema.parse({
        productId: "not-an-id",
        variantId: oid(),
        delta: 1,
        reason: "x",
      }),
    ).toThrow();
  });

  it("rejects short reason", () => {
    expect(() =>
      adminInventoryAdjustSchema.parse({
        productId: oid(),
        variantId: oid(),
        delta: 1,
        reason: "ok",
      }),
    ).toThrow();
  });
});

describe("adminCouponCreateSchema", () => {
  const base = () => ({
    code: "summer10",
    type: "percentage" as const,
    value: 10,
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: "2026-12-31T00:00:00.000Z",
  });

  it("accepts a valid percentage coupon", () => {
    const parsed = adminCouponCreateSchema.parse(base());
    // code is upper-cased by the transform
    expect(parsed.code).toBe("SUMMER10");
    expect(parsed.type).toBe("percentage");
  });

  it("rejects percentage coupon outside 1..100", () => {
    expect(() => adminCouponCreateSchema.parse({ ...base(), value: 0 })).toThrow();
    expect(() => adminCouponCreateSchema.parse({ ...base(), value: 101 })).toThrow();
  });

  it("accepts a fixed coupon with value > 100 (no percentage clamp)", () => {
    const parsed = adminCouponCreateSchema.parse({
      ...base(),
      type: "fixed",
      value: 5000,
    });
    expect(parsed.value).toBe(5000);
  });

  it("rejects validFrom >= validUntil", () => {
    expect(() =>
      adminCouponCreateSchema.parse({
        ...base(),
        validFrom: "2026-12-31T00:00:00.000Z",
        validUntil: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
    expect(() =>
      adminCouponCreateSchema.parse({
        ...base(),
        validFrom: "2026-01-01T00:00:00.000Z",
        validUntil: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects bad code format", () => {
    expect(() => adminCouponCreateSchema.parse({ ...base(), code: "ab" })).toThrow(); // too short after upper
    expect(() => adminCouponCreateSchema.parse({ ...base(), code: "lower!case" })).toThrow();
  });

  it("rejects non-ISO dates", () => {
    expect(() => adminCouponCreateSchema.parse({ ...base(), validFrom: "nope" })).toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() => adminCouponCreateSchema.parse({ ...base(), sneaky: true })).toThrow();
  });
});

describe("adminCouponUpdateSchema", () => {
  it("accepts partial update", () => {
    const parsed = adminCouponUpdateSchema.parse({ isActive: false });
    expect(parsed.isActive).toBe(false);
  });

  it("rejects validFrom >= validUntil when both provided", () => {
    expect(() =>
      adminCouponUpdateSchema.parse({
        validFrom: "2026-05-01T00:00:00.000Z",
        validUntil: "2026-05-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("accepts only validFrom (no cross check)", () => {
    const parsed = adminCouponUpdateSchema.parse({ validFrom: "2026-05-01T00:00:00.000Z" });
    expect(parsed.validFrom).toBe("2026-05-01T00:00:00.000Z");
  });

  it("rejects percentage value outside 1..100 when type=percentage", () => {
    expect(() => adminCouponUpdateSchema.parse({ type: "percentage", value: 101 })).toThrow();
  });
});

describe("adminBannerCreateSchema", () => {
  const base = () => ({
    title: "Holiday",
    imageUrl: "https://cdn.example.com/b.jpg",
  });

  it("accepts minimal banner + applies defaults", () => {
    const parsed = adminBannerCreateSchema.parse(base());
    expect(parsed.order).toBe(0);
    expect(parsed.isActive).toBe(true);
  });

  it("rejects empty title", () => {
    expect(() => adminBannerCreateSchema.parse({ ...base(), title: "   " })).toThrow();
  });

  it("rejects non-URL imageUrl", () => {
    expect(() => adminBannerCreateSchema.parse({ ...base(), imageUrl: "not-a-url" })).toThrow();
  });

  it("rejects publishFrom > publishUntil", () => {
    expect(() =>
      adminBannerCreateSchema.parse({
        ...base(),
        publishFrom: "2026-02-01T00:00:00.000Z",
        publishUntil: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("accepts publishFrom == publishUntil", () => {
    const parsed = adminBannerCreateSchema.parse({
      ...base(),
      publishFrom: "2026-02-01T00:00:00.000Z",
      publishUntil: "2026-02-01T00:00:00.000Z",
    });
    expect(parsed.publishFrom).toBeDefined();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() => adminBannerCreateSchema.parse({ ...base(), nope: 1 })).toThrow();
  });
});

describe("adminBannerUpdateSchema", () => {
  it("accepts partial update", () => {
    const parsed = adminBannerUpdateSchema.parse({ isActive: false });
    expect(parsed.isActive).toBe(false);
  });

  it("rejects publishFrom > publishUntil when both set", () => {
    expect(() =>
      adminBannerUpdateSchema.parse({
        publishFrom: "2026-03-01T00:00:00.000Z",
        publishUntil: "2026-02-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("adminBannerReorderSchema", () => {
  it("accepts a non-empty list of {id, order}", () => {
    const parsed = adminBannerReorderSchema.parse({
      items: [
        { id: oid(), order: 0 },
        { id: oid(), order: 1 },
      ],
    });
    expect(parsed.items.length).toBe(2);
  });

  it("rejects empty list", () => {
    expect(() => adminBannerReorderSchema.parse({ items: [] })).toThrow();
  });

  it("rejects bad id", () => {
    expect(() => adminBannerReorderSchema.parse({ items: [{ id: "bad", order: 0 }] })).toThrow();
  });
});

describe("adminReportsQuerySchema", () => {
  it("accepts a valid range and defaults groupBy to 'day'", () => {
    const parsed = adminReportsQuerySchema.parse({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T00:00:00.000Z",
    });
    expect(parsed.groupBy).toBe("day");
  });

  it("accepts groupBy=week and month", () => {
    expect(
      adminReportsQuerySchema.parse({
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-02T00:00:00.000Z",
        groupBy: "week",
      }).groupBy,
    ).toBe("week");
    expect(
      adminReportsQuerySchema.parse({
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-02T00:00:00.000Z",
        groupBy: "month",
      }).groupBy,
    ).toBe("month");
  });

  it("rejects groupBy outside enum", () => {
    expect(() =>
      adminReportsQuerySchema.parse({
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-02T00:00:00.000Z",
        groupBy: "hour",
      }),
    ).toThrow();
  });

  it("rejects from > to", () => {
    expect(() =>
      adminReportsQuerySchema.parse({
        from: "2026-02-01T00:00:00.000Z",
        to: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("adminActivityQuerySchema", () => {
  it("accepts empty filters", () => {
    expect(adminActivityQuerySchema.parse({})).toEqual({});
  });

  it("coerces page/limit strings", () => {
    const parsed = adminActivityQuerySchema.parse({ page: "3", limit: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it("rejects bad actorId", () => {
    expect(() => adminActivityQuerySchema.parse({ actorId: "bad" })).toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() => adminActivityQuerySchema.parse({ rogue: 1 })).toThrow();
  });
});

describe("adminCustomersQuerySchema", () => {
  it("accepts q + pagination", () => {
    const parsed = adminCustomersQuerySchema.parse({ q: "ali", page: 1, limit: 10 });
    expect(parsed.q).toBe("ali");
  });

  it("rejects empty q after trim", () => {
    expect(() => adminCustomersQuerySchema.parse({ q: "   " })).toThrow();
  });
});

describe("adminDashboardQuerySchema", () => {
  it("accepts empty", () => {
    expect(adminDashboardQuerySchema.parse({})).toEqual({});
  });

  it("rejects from > to", () => {
    expect(() =>
      adminDashboardQuerySchema.parse({
        from: "2026-02-01T00:00:00.000Z",
        to: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("accepts from == to", () => {
    const parsed = adminDashboardQuerySchema.parse({
      from: "2026-02-01T00:00:00.000Z",
      to: "2026-02-01T00:00:00.000Z",
    });
    expect(parsed.from).toBeDefined();
  });
});
