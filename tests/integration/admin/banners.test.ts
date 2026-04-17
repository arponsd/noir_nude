import { describe, it, expect, beforeEach } from "vitest";
import { Types } from "mongoose";

import { seedBanners } from "../../harness/seed-banners";
import {
  createBannerService,
  deleteBannerService,
  listBannersAdminService,
  reorderBannersService,
  updateBannerService,
} from "@/lib/services/admin-banner";
import { listActiveBanners } from "@/lib/db/queries/banner";
import type { UserRole } from "@/lib/constants";

const ADMIN = { id: new Types.ObjectId().toString(), role: "admin" as UserRole };

describe("admin banners service", () => {
  beforeEach(async () => {
    // no shared seed — each test seeds exactly what it needs
  });

  it("create + list returns the new banner", async () => {
    const created = await createBannerService(
      {
        title: "Autumn Sale",
        imageUrl: "https://cdn.example.com/a.jpg",
        order: 5,
        isActive: true,
      },
      ADMIN,
    );
    expect(created.title).toBe("Autumn Sale");

    const listed = await listBannersAdminService();
    expect(listed.items.map((b) => b.id)).toContain(created.id);
  });

  it("update mutates fields", async () => {
    const [seeded] = await seedBanners(1, [{ title: "Orig", order: 0 }]);
    const updated = await updateBannerService(seeded!.id, { title: "Patched", order: 9 }, ADMIN);
    expect(updated.title).toBe("Patched");
    expect(updated.order).toBe(9);
  });

  it("reorder swaps order values on two banners", async () => {
    const seeded = await seedBanners(2, [
      { title: "First", order: 0 },
      { title: "Second", order: 1 },
    ]);
    const [a, b] = seeded;

    const result = await reorderBannersService(
      {
        items: [
          { id: a!.id, order: 10 },
          { id: b!.id, order: 5 },
        ],
      },
      ADMIN,
    );
    expect(result.updated).toBe(2);

    const listed = await listBannersAdminService();
    const byId = new Map(listed.items.map((x) => [x.id, x]));
    expect(byId.get(a!.id)?.order).toBe(10);
    expect(byId.get(b!.id)?.order).toBe(5);
  });

  it("soft delete hides the banner from listActiveBanners", async () => {
    const created = await createBannerService(
      {
        title: "Delete Me",
        imageUrl: "https://cdn.example.com/d.jpg",
        order: 0,
        isActive: true,
        publishFrom: "2020-01-01T00:00:00.000Z",
      },
      ADMIN,
    );
    // visible before delete
    const before = await listActiveBanners();
    expect(before.map((b) => b.id)).toContain(created.id);

    await deleteBannerService(created.id, ADMIN);

    const after = await listActiveBanners();
    expect(after.map((b) => b.id)).not.toContain(created.id);
  });
});
