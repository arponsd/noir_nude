// e2e: tag=reviews
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { checkLimit, reviewLimiter } from "@/lib/rate-limit";
import { reviewSubmitSchema } from "@/lib/validators/user";
import { submitReview } from "@/lib/services/review";

export const POST = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(reviewLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = reviewSubmitSchema.parse(raw);
  const review = await submitReview(session.user.id, parsed);
  return NextResponse.json(ok(review), { status: 201 });
});
