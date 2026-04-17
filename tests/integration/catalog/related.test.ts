import { describe, it, expect, beforeEach } from "vitest";
import { seedCatalog, type SeedProductInput } from "../../harness/seed-catalog";
import type { ProductCard } from "@/types/api/products";

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

async function callRelated(
  slug: string,
  query = "",
): Promise<{ status: number; body: ApiResp<ProductCard[]> }> {
  const { GET } = await import("@/app/api/products/[slug]/related/route");
  const req = new Request(`http://localhost/api/products/${slug}/related${query}`);
  const res = await GET(req, { params: Promise.resolve({ slug }) });
  return { status: res.status, body: (await res.json()) as ApiResp<ProductCard[]> };
}

function assertOk<T>(body: ApiResp<T>): asserts body is ApiOk<T> {
  if (!body.ok) throw new Error(`expected ok, got ${body.error.code}: ${body.error.message}`);
}

describe("GET /api/products/[slug]/related", () => {
  beforeEach(async () => {
    const lipsticks: SeedProductInput[] = Array.from({ length: 5 }, (_, i) => ({
      name: `Lipstick ${i + 1}`,
      slug: `lipstick-related-${i + 1}`,
      categorySlug: "lipstick",
      brand: "GlowCart",
      basePrice: 50000 + i * 5000,
      rating: { avg: 4 + i * 0.1, count: 100 + i * 10 },
      totalSold: 500 + i * 50,
    }));
    const others: SeedProductInput[] = [
      {
        name: "Silk Serum",
        slug: "silk-serum",
        categorySlug: "skincare",
        basePrice: 180000,
      },
      {
        name: "Gentle Cleansing Milk",
        slug: "gentle-cleansing-milk",
        categorySlug: "skincare",
        basePrice: 55000,
      },
    ];
    await seedCatalog({ products: [...lipsticks, ...others] });
  });

  it("returns up to 8, same category, excludes the anchor product", async () => {
    const { status, body } = await callRelated("lipstick-related-1");
    expect(status).toBe(200);
    assertOk(body);

    const items = body.data;
    expect(items.length).toBeLessThanOrEqual(8);
    expect(items.length).toBe(4); // 5 lipsticks minus anchor
    for (const item of items) {
      expect(item.slug.startsWith("lipstick-related-")).toBe(true);
      expect(item.slug).not.toBe("lipstick-related-1");
    }
  });

  it("returns empty array when anchor slug does not exist", async () => {
    const { status, body } = await callRelated("does-not-exist");
    expect(status).toBe(200);
    assertOk(body);
    expect(body.data).toEqual([]);
  });
});
