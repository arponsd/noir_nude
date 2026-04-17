// e2e: tag=reviews
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { toggleReviewHelpful } from "@/lib/services/review";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const result = await toggleReviewHelpful(session.user.id, id);
  return NextResponse.json(ok(result));
});
