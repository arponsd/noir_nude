// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cartLimiter, checkLimit } from "@/lib/rate-limit";
import { itemIdParamSchema } from "@/lib/utils/object-id";
import { removeCartItem, updateCartItem } from "@/lib/services/cart";

type RouteContext = { params: Promise<{ itemId: string }> };

/**
 * PATCH allows qty=0 meaning "remove" — the service layer treats <=0 as a line
 * delete. The public Zod contract in `commerce.ts` enforces min=1, so we use an
 * inline schema here to permit 0 from the route.
 */
const patchBodySchema = z.object({ quantity: z.number().int().min(0).max(99) }).strict();

export const PATCH = safeRoute(async (req: Request, context: RouteContext) => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const { itemId } = await context.params;
  const parsedItemId = itemIdParamSchema.parse(itemId);
  const raw: unknown = await req.json().catch(() => ({}));
  const { quantity } = patchBodySchema.parse(raw);
  const cart = await updateCartItem(session.user.id, parsedItemId, quantity);
  return NextResponse.json(ok(cart));
});

export const DELETE = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const { itemId } = await context.params;
  const parsedItemId = itemIdParamSchema.parse(itemId);
  const cart = await removeCartItem(session.user.id, parsedItemId);
  return NextResponse.json(ok(cart));
});
