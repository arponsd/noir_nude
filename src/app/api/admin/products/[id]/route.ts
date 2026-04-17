import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { connectDb } from "@/lib/db/connect";
import { adminProductIdParamSchema, updateProductSchema } from "@/lib/validators/admin-products";
import { adminGetProduct, softDeleteProduct, updateProduct } from "@/lib/services/admin-product";

const ADMIN_ROLES = ["admin", "manager"] as const;

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
  return NextResponse.json(ok(result));
});

export const DELETE = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireRole(ADMIN_ROLES);
  await connectDb();
  const { id } = adminProductIdParamSchema.parse(await context.params);
  const result = await softDeleteProduct(id, session.user.id);
  return NextResponse.json(ok(result));
});
