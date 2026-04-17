// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { addressUpdateSchema } from "@/lib/validators/commerce";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { deleteAddress, getAddress, updateAddress } from "@/lib/services/address";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const address = await getAddress(session.user.id, id);
  return NextResponse.json(ok(address));
});

export const PATCH = safeRoute(async (req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = addressUpdateSchema.parse(raw);
  const address = await updateAddress(session.user.id, id, parsed);
  return NextResponse.json(ok(address));
});

export const DELETE = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const result = await deleteAddress(session.user.id, id);
  return NextResponse.json(ok(result));
});
