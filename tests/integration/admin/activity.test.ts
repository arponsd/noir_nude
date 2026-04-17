import { describe, it, expect, beforeEach } from "vitest";
import { Types } from "mongoose";

import { seedActivity } from "../../harness/seed-activity";
import { connectDb } from "@/lib/db/connect";
import { createActivityLog } from "@/lib/db/models/ActivityLog";
import { listActivityService } from "@/lib/services/admin-activity";

describe("admin activity service", () => {
  // reason: ActivityLog has a 365-day TTL index that Mongoose re-creates on
  // the first use after the per-test dropDatabase. Give the hook headroom so
  // index build doesn't race the test timeout on slower replica sets.
  beforeEach(async () => {
    await connectDb();
    const actor = new Types.ObjectId();
    await createActivityLog({
      actorId: actor,
      actorRole: "admin",
      event: "order.status_update",
      entity: "order",
      entityId: new Types.ObjectId(),
      summary: "changed to shipped",
    });
    await createActivityLog({
      actorId: actor,
      actorRole: "admin",
      event: "product.stock_adjust",
      entity: "product",
      entityId: new Types.ObjectId(),
      summary: "stock +5",
    });
    await seedActivity(3, [
      { entity: "coupon", event: "coupon.create" },
      { entity: "coupon", event: "coupon.update" },
      { entity: "banner", event: "banner.create" },
    ]);
  }, 30_000);

  it("lists entries paginated (newest first)", async () => {
    const page1 = await listActivityService({ page: 1, limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.page).toBe(1);
    expect(page1.limit).toBe(2);
    expect(page1.total).toBe(5);
    expect(page1.totalPages).toBe(3);

    const page2 = await listActivityService({ page: 2, limit: 2 });
    expect(page2.items.length).toBe(2);
    const page3 = await listActivityService({ page: 3, limit: 2 });
    expect(page3.items.length).toBe(1);
  });

  it("filters by entity", async () => {
    const page = await listActivityService({ entity: "coupon" });
    expect(page.total).toBe(2);
    for (const entry of page.items) {
      expect(entry.entity).toBe("coupon");
    }
  });

  it("returns empty page for entities with no matches", async () => {
    const page = await listActivityService({ entity: "user" });
    expect(page.total).toBe(0);
    expect(page.items).toEqual([]);
  });
});
