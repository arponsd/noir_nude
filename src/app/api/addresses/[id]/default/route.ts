// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { setDefaultAddress } from "@/lib/services/address";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const address = await setDefaultAddress(session.user.id, id);
  return NextResponse.json(ok(address));
});
