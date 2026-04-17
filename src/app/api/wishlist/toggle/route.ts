// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cartLimiter, checkLimit } from "@/lib/rate-limit";
import { wishlistToggleSchema } from "@/lib/validators/commerce";
import { toggleWishlist } from "@/lib/services/wishlist";

export const POST = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(cartLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = wishlistToggleSchema.parse(raw);
  const result = await toggleWishlist(session.user.id, parsed.productId, parsed.variantId);
  return NextResponse.json(ok(result));
});
