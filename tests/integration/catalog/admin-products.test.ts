import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { installAuthMock, setMockSession, clearMockSession } from "../../harness/mock-auth";
import { seedCatalog, type SeededCatalog } from "../../harness/seed-catalog";
import { ERROR_CODES } from "@/lib/constants";

// IMPORTANT: call BEFORE any import that transitively loads @/lib/auth. Vitest
// hoists vi.mock inside `installAuthMock` so the mock factory wins resolution.
installAuthMock();

import logger from "@/lib/utils/logger";
import { Product } from "@/lib/db/models";

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

type CreateOk = { id: string; slug: string };
type UpdateOk = { id: string; slug: string };
type DeleteOk = { id: string; deletedAt: string };

function assertOk<T>(body: ApiResp<T>): asserts body is ApiOk<T> {
  if (!body.ok) throw new Error(`expected ok, got ${body.error.code}: ${body.error.message}`);
}
function assertFail<T>(body: ApiResp<T>): asserts body is ApiFail {
  if (body.ok) throw new Error("expected failure");
}

async function callCreate(payload: unknown): Promise<{ status: number; body: ApiResp<CreateOk> }> {
  const { POST } = await import("@/app/api/admin/products/route");
  const req = new Request("http://localhost/api/admin/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const res = await POST(req);
  return { status: res.status, body: (await res.json()) as ApiResp<CreateOk> };
}

async function callPatch(
  id: string,
  payload: unknown,
): Promise<{ status: number; body: ApiResp<UpdateOk> }> {
  const { PATCH } = await import("@/app/api/admin/products/[id]/route");
  const req = new Request(`http://localhost/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const res = await PATCH(req, { params: Promise.resolve({ id }) });
  return { status: res.status, body: (await res.json()) as ApiResp<UpdateOk> };
}

async function callDelete(id: string): Promise<{ status: number; body: ApiResp<DeleteOk> }> {
  const { DELETE } = await import("@/app/api/admin/products/[id]/route");
  const req = new Request(`http://localhost/api/admin/products/${id}`, { method: "DELETE" });
  const res = await DELETE(req, { params: Promise.resolve({ id }) });
  return { status: res.status, body: (await res.json()) as ApiResp<DeleteOk> };
}

function buildCreatePayload(
  categoryId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    name: "Matte Moment Lipstick",
    slug: "matte-moment-lipstick",
    description: "A rich matte finish that lasts all day long.",
    categoryId,
    brand: "GlowCart",
    basePrice: 75000,
    images: [
      { url: "https://res.cloudinary.com/demo/image/upload/test-1.jpg", alt: "front", order: 0 },
    ],
    variants: [
      { name: "Classic Red", sku: "MML-RED-01", price: 75000, stock: 100, isActive: true },
    ],
    ...overrides,
  };
}

describe("admin products routes", () => {
  let seeded: SeededCatalog;

  beforeEach(async () => {
    seeded = await seedCatalog({
      categories: [{ name: "Lipstick", slug: "lipstick", order: 1 }],
      products: [],
    });
  });

  afterEach(() => {
    clearMockSession();
    vi.restoreAllMocks();
  });

  it("POST create: admin session → 201, product persisted, activity log emitted", async () => {
    setMockSession({ role: "admin", userId: "507f1f77bcf86cd799439001" });
    const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);

    const categoryId = seeded.categoryBySlug.get("lipstick")?.id;
    expect(categoryId).toBeDefined();

    const { status, body } = await callCreate(buildCreatePayload(categoryId!));
    expect(status).toBe(201);
    assertOk(body);
    expect(body.data.slug).toBe("matte-moment-lipstick");

    const persisted = await Product.findById(body.data.id).lean();
    expect(persisted).not.toBeNull();
    expect(persisted!.name).toBe("Matte Moment Lipstick");

    // logger.info({actorId, action: "create", entity: "product", entityId},  "admin_product_action")
    const logged = infoSpy.mock.calls.find(
      (args) =>
        typeof args[1] === "string" &&
        args[1] === "admin_product_action" &&
        typeof args[0] === "object" &&
        (args[0] as Record<string, unknown>).action === "create",
    );
    expect(logged, "expected admin_product_action create log").toBeDefined();
  });

  it("POST create: unauthenticated → 401 UNAUTHORIZED", async () => {
    clearMockSession();
    const categoryId = seeded.categoryBySlug.get("lipstick")?.id;
    const { status, body } = await callCreate(buildCreatePayload(categoryId!));
    expect(status).toBe(401);
    assertFail(body);
    expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("POST create: customer session → 403 FORBIDDEN", async () => {
    setMockSession({ role: "customer" });
    const categoryId = seeded.categoryBySlug.get("lipstick")?.id;
    const { status, body } = await callCreate(buildCreatePayload(categoryId!));
    expect(status).toBe(403);
    assertFail(body);
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("POST create: missing required field → 400 VALIDATION_FAILED", async () => {
    setMockSession({ role: "admin" });
    const categoryId = seeded.categoryBySlug.get("lipstick")?.id;
    const payload = buildCreatePayload(categoryId!);
    delete payload.description; // required
    const { status, body } = await callCreate(payload);
    expect(status).toBe(400);
    assertFail(body);
    expect(body.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
  });

  it("PATCH update: admin session → changes land", async () => {
    setMockSession({ role: "admin", userId: "507f1f77bcf86cd799439001" });

    const categoryId = seeded.categoryBySlug.get("lipstick")?.id;
    const created = await callCreate(buildCreatePayload(categoryId!));
    assertOk(created.body);
    const productId = created.body.data.id;

    const { status, body } = await callPatch(productId, { basePrice: 88000, brand: "NewBrand" });
    expect(status).toBe(200);
    assertOk(body);
    expect(body.data.id).toBe(productId);

    const reloaded = await Product.findById(productId).lean();
    expect(reloaded?.basePrice).toBe(88000);
    expect(reloaded?.brand).toBe("NewBrand");
  });

  it("DELETE: admin session → soft-deletes (deletedAt set, retrievable with withDeleted)", async () => {
    setMockSession({ role: "admin", userId: "507f1f77bcf86cd799439001" });

    const categoryId = seeded.categoryBySlug.get("lipstick")?.id;
    const created = await callCreate(buildCreatePayload(categoryId!));
    assertOk(created.body);
    const productId = created.body.data.id;

    const { status, body } = await callDelete(productId);
    expect(status).toBe(200);
    assertOk(body);
    expect(typeof body.data.deletedAt).toBe("string");

    // Default find() excludes soft-deleted docs.
    const defaultFind = await Product.findById(productId).lean();
    expect(defaultFind).toBeNull();

    // With `withDeleted: true` the doc is still in the collection.
    const withDeleted = await Product.findById(productId).setOptions({ withDeleted: true }).lean();
    expect(withDeleted).not.toBeNull();
    expect(withDeleted!.deletedAt).not.toBeNull();
    expect(withDeleted!.isActive).toBe(false);
  });
});
