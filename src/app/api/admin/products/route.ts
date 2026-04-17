import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { connectDb } from "@/lib/db/connect";
import { adminListProductsQuerySchema, createProductSchema } from "@/lib/validators/admin-products";
import { adminListProducts, createProduct } from "@/lib/services/admin-product";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["admin", "manager"] as const;

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  await connectDb();
  const url = new URL(req.url);
  const params = adminListProductsQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const result = await adminListProducts(params);
  return NextResponse.json(ok(result));
});

export const POST = safeRoute(async (req: Request) => {
  const session = await requireRole(ADMIN_ROLES);
  await connectDb();
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = createProductSchema.parse(raw);
  const result = await createProduct(parsed, session.user.id);
  return NextResponse.json(ok(result), { status: 201 });
});
