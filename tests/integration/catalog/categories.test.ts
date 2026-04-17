import { describe, it, expect, beforeEach } from "vitest";
import { seedCatalog } from "../../harness/seed-catalog";
import type { CategoryTree, CategoryWithProducts } from "@/types/api/categories";

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

async function callTree(): Promise<{ status: number; body: ApiResp<CategoryTree[]> }> {
  const { GET } = await import("@/app/api/categories/route");
  // Route handler takes no args — safeRoute wraps a 0-arity handler here.
  const res = await GET();
  return { status: res.status, body: (await res.json()) as ApiResp<CategoryTree[]> };
}

async function callDetail(
  slug: string,
): Promise<{ status: number; body: ApiResp<CategoryWithProducts> }> {
  const { GET } = await import("@/app/api/categories/[slug]/route");
  const req = new Request(`http://localhost/api/categories/${slug}`);
  const res = await GET(req, { params: Promise.resolve({ slug }) });
  return { status: res.status, body: (await res.json()) as ApiResp<CategoryWithProducts> };
}

function assertOk<T>(body: ApiResp<T>): asserts body is ApiOk<T> {
  if (!body.ok) throw new Error(`expected ok, got ${body.error.code}: ${body.error.message}`);
}

describe("GET /api/categories — tree and detail", () => {
  beforeEach(async () => {
    await seedCatalog({
      categories: [
        { name: "Makeup", slug: "makeup", order: 1 },
        { name: "Skincare", slug: "skincare", order: 2 },
        { name: "Lipstick", slug: "lipstick", parentSlug: "makeup", order: 1 },
        { name: "Foundation", slug: "foundation", parentSlug: "makeup", order: 2 },
        { name: "Cleansers", slug: "cleansers", parentSlug: "skincare", order: 1 },
        { name: "Serums", slug: "serums", parentSlug: "skincare", order: 2 },
      ],
      products: [
        {
          name: "Velvet Matte Lipstick",
          slug: "velvet-matte-lipstick",
          categorySlug: "lipstick",
          basePrice: 85000,
        },
        {
          name: "Hydra Glow Lip Tint",
          slug: "hydra-glow-lip-tint",
          categorySlug: "lipstick",
          basePrice: 65000,
        },
        {
          name: "Gentle Cleansing Milk",
          slug: "gentle-cleansing-milk",
          categorySlug: "cleansers",
          basePrice: 55000,
        },
      ],
    });
  });

  it("GET /api/categories returns the root tree with children populated, sorted by order", async () => {
    const { status, body } = await callTree();
    expect(status).toBe(200);
    assertOk(body);
    const roots = body.data;
    expect(roots.length).toBe(2);
    expect(roots.map((r) => r.slug)).toEqual(["makeup", "skincare"]);

    const makeup = roots.find((r) => r.slug === "makeup");
    expect(makeup).toBeDefined();
    expect(makeup!.children.map((c) => c.slug)).toEqual(["lipstick", "foundation"]);

    const skincare = roots.find((r) => r.slug === "skincare");
    expect(skincare).toBeDefined();
    expect(skincare!.children.map((c) => c.slug)).toEqual(["cleansers", "serums"]);
  });

  it("GET /api/categories/[slug] returns category + products list (including productCount-equivalent items)", async () => {
    const { status, body } = await callDetail("lipstick");
    expect(status).toBe(200);
    assertOk(body);
    expect(body.data.slug).toBe("lipstick");
    expect(body.data.name).toBe("Lipstick");
    // products for this category
    expect(body.data.products.length).toBe(2);
    for (const p of body.data.products) {
      expect(["velvet-matte-lipstick", "hydra-glow-lip-tint"]).toContain(p.slug);
    }
  });

  it("GET /api/categories/[slug] returns 404 NOT_FOUND when slug is unknown", async () => {
    const { status, body } = await callDetail("does-not-exist");
    expect(status).toBe(404);
    expect(body.ok).toBe(false);
  });
});
