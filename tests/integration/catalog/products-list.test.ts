import { describe, it, expect, beforeEach } from "vitest";
import { seedCatalog, type SeedProductInput } from "../../harness/seed-catalog";
import type { ProductListPage } from "@/types/api/products";

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

async function callList(
  search: string,
): Promise<{ status: number; body: ApiResp<ProductListPage> }> {
  const { GET } = await import("@/app/api/products/route");
  const req = new Request(`http://localhost/api/products${search}`);
  const res = await GET(req);
  return { status: res.status, body: (await res.json()) as ApiResp<ProductListPage> };
}

function assertOk<T>(body: ApiResp<T>): asserts body is ApiOk<T> {
  if (!body.ok) throw new Error(`expected ok, got ${body.error.code}: ${body.error.message}`);
}

describe("GET /api/products — listing", () => {
  beforeEach(async () => {
    const products: SeedProductInput[] = [
      {
        name: "Velvet Matte Lipstick",
        slug: "velvet-matte-lipstick",
        categorySlug: "lipstick",
        brand: "GlowCart",
        basePrice: 85000,
        comparePrice: 99000,
        badges: ["bestseller"],
        rating: { avg: 4.7, count: 312 },
      },
      {
        name: "Hydra Glow Lip Tint",
        slug: "hydra-glow-lip-tint",
        categorySlug: "lipstick",
        brand: "GlowCart",
        basePrice: 65000,
        badges: ["new"],
      },
      {
        name: "Velvet Cushion Foundation",
        slug: "velvet-cushion-foundation",
        categorySlug: "foundation",
        brand: "GlowCart",
        basePrice: 125000,
        badges: ["bestseller"],
      },
      {
        name: "Silk Serum",
        slug: "silk-serum",
        categorySlug: "skincare",
        brand: "AuraSkin",
        basePrice: 180000,
      },
      {
        name: "Daily Matte Foundation",
        slug: "daily-matte-foundation",
        categorySlug: "foundation",
        brand: "AuraSkin",
        basePrice: 95000,
      },
      {
        name: "Gentle Cleansing Milk",
        slug: "gentle-cleansing-milk",
        categorySlug: "skincare",
        brand: "AuraSkin",
        basePrice: 55000,
      },
      // Soft-deleted — must be excluded from listing.
      {
        name: "Retired Lip Balm",
        slug: "retired-lip-balm",
        categorySlug: "lipstick",
        brand: "GlowCart",
        basePrice: 30000,
        deletedAt: new Date(),
      },
      // Inactive — must be excluded.
      {
        name: "Draft Skincare Oil",
        slug: "draft-skincare-oil",
        categorySlug: "skincare",
        brand: "AuraSkin",
        basePrice: 40000,
        isActive: false,
      },
    ];
    await seedCatalog({ products });
  });

  it("envelope: returns { ok, data: { items, page, limit, total, totalPages } } for default listing", async () => {
    const { status, body } = await callList("");
    expect(status).toBe(200);
    assertOk(body);
    expect(body.data.items.length).toBe(6);
    expect(body.data.total).toBe(6);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(24);
    expect(body.data.totalPages).toBe(1);
  });

  it("filter by category → only matching returned", async () => {
    const { body } = await callList("?category=lipstick");
    assertOk(body);
    expect(body.data.total).toBe(2);
    for (const item of body.data.items) {
      expect(["velvet-matte-lipstick", "hydra-glow-lip-tint"]).toContain(item.slug);
    }
  });

  it("filter by brand → only matching returned", async () => {
    const { body } = await callList("?brand=AuraSkin");
    assertOk(body);
    expect(body.data.total).toBe(3);
    for (const item of body.data.items) {
      expect(item.brand).toBe("AuraSkin");
    }
  });

  it("filter by minPrice / maxPrice → in-range only", async () => {
    const { body } = await callList("?minPrice=60000&maxPrice=100000");
    assertOk(body);
    for (const item of body.data.items) {
      expect(item.basePrice).toBeGreaterThanOrEqual(60000);
      expect(item.basePrice).toBeLessThanOrEqual(100000);
    }
    // Matches: Velvet Matte Lipstick (85000), Hydra Glow (65000), Daily Matte Foundation (95000)
    expect(body.data.total).toBe(3);
  });

  it("filter by badges=bestseller → only badge matches", async () => {
    const { body } = await callList("?badges=bestseller");
    assertOk(body);
    expect(body.data.total).toBe(2);
    for (const item of body.data.items) {
      expect(item.badges).toContain("bestseller");
    }
  });

  it("sort basePrice:asc → ascending basePrice order", async () => {
    const { body } = await callList("?sort=basePrice:asc");
    assertOk(body);
    const prices = body.data.items.map((i) => i.basePrice);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
    expect(prices[0]).toBe(55000);
  });

  it("pagination page=2&limit=2 returns correct slice", async () => {
    const { body: page1 } = await callList("?sort=basePrice:asc&page=1&limit=2");
    assertOk(page1);
    const { body: page2 } = await callList("?sort=basePrice:asc&page=2&limit=2");
    assertOk(page2);

    expect(page1.data.items.length).toBe(2);
    expect(page2.data.items.length).toBe(2);
    expect(page2.data.page).toBe(2);
    expect(page2.data.limit).toBe(2);
    expect(page2.data.totalPages).toBe(3);

    // Disjoint slices.
    const slugs1 = new Set(page1.data.items.map((i) => i.slug));
    for (const item of page2.data.items) {
      expect(slugs1.has(item.slug)).toBe(false);
    }
  });

  it("inactive and soft-deleted products are excluded", async () => {
    const { body } = await callList("");
    assertOk(body);
    const slugs = body.data.items.map((i) => i.slug);
    expect(slugs).not.toContain("retired-lip-balm");
    expect(slugs).not.toContain("draft-skincare-oil");
  });
});
