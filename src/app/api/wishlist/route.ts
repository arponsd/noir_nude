// e2e: tag=commerce
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { getWishlist } from "@/lib/services/wishlist";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async () => {
  const session = await requireAuth();
  const wishlist = await getWishlist(session.user.id);
  return NextResponse.json(ok(wishlist));
});
