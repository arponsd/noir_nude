// e2e: tag=commerce
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { getCartForUser } from "@/lib/services/cart";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async () => {
  const session = await requireAuth();
  const cart = await getCartForUser(session.user.id);
  return NextResponse.json(ok(cart));
});
