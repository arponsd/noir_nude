// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cartLimiter, checkLimit } from "@/lib/rate-limit";
import { addCartItemSchema } from "@/lib/validators/commerce";
import { addCartItem } from "@/lib/services/cart";

export const POST = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = addCartItemSchema.parse(raw);
  const cart = await addCartItem(session.user.id, parsed);
  return NextResponse.json(ok(cart), { status: 201 });
});
