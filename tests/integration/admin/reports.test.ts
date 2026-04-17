import { describe, it, expect, beforeEach } from "vitest";
import { Types } from "mongoose";

import { installAuthMock, setMockSession, clearMockSession } from "../../harness/mock-auth";

installAuthMock();

import { seedOrder } from "../../harness/seed-orders";
import { generateSalesReportCsv, generateSalesReportService } from "@/lib/services/admin-report";

const DAY1 = new Date("2026-04-10T12:00:00.000Z");
const DAY2 = new Date("2026-04-11T15:00:00.000Z");

describe("admin sales reports", () => {
  const userId = new Types.ObjectId();

  beforeEach(async () => {
    const baseItem = {
      productId: new Types.ObjectId(),
      variantId: new Types.ObjectId(),
      name: "Sample",
      sku: "S-01",
      price: 10_000,
      quantity: 1,
    };
    // Day 1: 2 delivered orders totalling 20_000
    await seedOrder({ userId, status: "delivered", placedAt: DAY1, items: [baseItem] });
    await seedOrder({ userId, status: "delivered", placedAt: DAY1, items: [baseItem] });
    // Day 2: 1 delivered order totalling 10_000
    await seedOrder({ userId, status: "delivered", placedAt: DAY2, items: [baseItem] });
    // cancelled — excluded
    await seedOrder({ userId, status: "cancelled", placedAt: DAY2, items: [baseItem] });
  });

  it("groupBy=day returns two buckets with correct counts/revenue", async () => {
    const payload = await generateSalesReportService({
      from: "2026-04-10T00:00:00.000Z",
      to: "2026-04-11T23:59:59.999Z",
      groupBy: "day",
    });
    expect(payload.rows.length).toBe(2);
    const byBucket = new Map(payload.rows.map((r) => [r.bucket, r]));
    expect(byBucket.get("2026-04-10")?.orderCount).toBe(2);
    expect(byBucket.get("2026-04-10")?.revenue).toBe(20_000);
    expect(byBucket.get("2026-04-11")?.orderCount).toBe(1);
    expect(byBucket.get("2026-04-11")?.revenue).toBe(10_000);
    expect(payload.totals).toEqual({ orderCount: 3, revenue: 30_000 });
  });

  it("CSV export: BOM, header, data rows, totals row", async () => {
    const csv = await generateSalesReportCsv({
      from: "2026-04-10T00:00:00.000Z",
      to: "2026-04-11T23:59:59.999Z",
      groupBy: "day",
    });
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv
      .replace(/^\uFEFF/, "")
      .trimEnd()
      .split("\n");
    expect(lines[0]).toBe("bucket,orderCount,revenue_paisa");
    // 2 data rows + total
    expect(lines.length).toBe(1 + 2 + 1);
    expect(lines[lines.length - 1]).toBe("TOTAL,3,30000");
  });

  it("CSV route returns text/csv content-type with attachment disposition", async () => {
    setMockSession({ role: "admin", userId: new Types.ObjectId().toString() });
    const { GET } = await import("@/app/api/admin/reports/sales.csv/route");
    const req = new Request(
      "http://localhost/api/admin/reports/sales.csv?from=2026-04-10T00:00:00.000Z&to=2026-04-11T23:59:59.999Z&groupBy=day",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    clearMockSession();
  });
});
