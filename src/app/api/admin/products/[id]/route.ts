import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { connectDb } from "@/lib/db/connect";
import { adminProductIdParamSchema, updateProductSchema } from "@/lib/validators/admin-products";
import { adminGetProduct, softDeleteProduct, updateProduct } from "@/lib/services/admin-product";

const ADMIN_ROLES = ["admin", "manager"] as const;

function revalidatePublicCatalog(slug?: string): void {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/categories");
  if (slug) revalidatePath(`/products/${slug}`);
}

type RouteContext = { params: Promise<{ id: string }> };

export const GET = safeRoute(async (_req: Request, context: RouteContext) => {
  await requireRole(ADMIN_ROLES);
  await connectDb();
  const { id } = adminProductIdParamSchema.parse(await context.params);
  const product = await adminGetProduct(id);
  return NextResponse.json(ok(product));
});

export const PATCH = safeRoute(async (req: Request, context: RouteContext) => {
  const session = await requireRole(ADMIN_ROLES);
  await connectDb();
  const { id } = adminProductIdParamSchema.parse(await context.params);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = updateProductSchema.parse(raw);
  const result = await updateProduct(id, parsed, session.user.id);
  revalidatePublicCatalog(result.slug);
  return NextResponse.json(ok(result));
});

export const DELETE = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireRole(ADMIN_ROLES);
  await connectDb();
  const { id } = adminProductIdParamSchema.parse(await context.params);
  const result = await softDeleteProduct(id, session.user.id);
  // reason: slug not returned on delete; top-level catalog paths cover it.
  revalidatePublicCatalog();
  return NextResponse.json(ok(result));
});
