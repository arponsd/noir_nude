import { describe, it, expect, beforeEach } from "vitest";
import { seedCatalog, type SeededCatalog } from "../../harness/seed-catalog";
import { ERROR_CODES } from "@/lib/constants";
import type { ProductDetail } from "@/types/api/products";

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

async function callDetail(slug: string): Promise<{ status: number; body: ApiResp<ProductDetail> }> {
  const { GET } = await import("@/app/api/products/[slug]/route");
  const req = new Request(`http://localhost/api/products/${slug}`);
  const res = await GET(req, { params: Promise.resolve({ slug }) });
  return { status: res.status, body: (await res.json()) as ApiResp<ProductDetail> };
}

function assertOk<T>(body: ApiResp<T>): asserts body is ApiOk<T> {
  if (!body.ok) throw new Error(`expected ok, got ${body.error.code}: ${body.error.message}`);
}
function assertFail<T>(body: ApiResp<T>): asserts body is ApiFail {
  if (body.ok) throw new Error("expected failure");
}

describe("GET /api/products/[slug] — detail", () => {
  let seeded: SeededCatalog;

  beforeEach(async () => {
    seeded = await seedCatalog({
      categories: [{ name: "Lipstick", slug: "lipstick", order: 1 }],
      products: [
        {
          name: "Velvet Matte Lipstick",
          slug: "velvet-matte-lipstick",
          description: "A weightless, long-wearing matte lipstick.",
          shortDescription: "Long-wearing matte lipstick",
          categorySlug: "lipstick",
          brand: "GlowCart",
          basePrice: 85000,
          comparePrice: 99000,
          badges: ["bestseller"],
          skinTypes: ["normal"],
        },
        // Soft-deleted entry.
        {
          name: "Retired Lip Balm",
          slug: "retired-lip-balm",
          categorySlug: "lipstick",
          basePrice: 30000,
          deletedAt: new Date(),
        },
      ],
    });
  });

  it("returns the ProductDetail with category resolved when the slug exists", async () => {
    const { status, body } = await callDetail("velvet-matte-lipstick");
    expect(status).toBe(200);
    assertOk(body);
    const detail = body.data;
    expect(detail.slug).toBe("velvet-matte-lipstick");
    expect(detail.name).toBe("Velvet Matte Lipstick");
    expect(detail.basePrice).toBe(85000);
    expect(detail.comparePrice).toBe(99000);
    expect(detail.badges).toContain("bestseller");
    expect(detail.category).not.toBeNull();
    expect(detail.category?.slug).toBe("lipstick");
    expect(detail.fullVariants.length).toBeGreaterThanOrEqual(1);
    // sanity: seeded data round-trip
    const seededProd = seeded.productBySlug.get("velvet-matte-lipstick");
    expect(detail.id).toBe(seededProd?.id);
  });

  it("non-existent slug → 404 NOT_FOUND", async () => {
    const { status, body } = await callDetail("does-not-exist");
    expect(status).toBe(404);
    assertFail(body);
    expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("soft-deleted slug → 404 NOT_FOUND", async () => {
    const { status, body } = await callDetail("retired-lip-balm");
    expect(status).toBe(404);
    assertFail(body);
    expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });
});
