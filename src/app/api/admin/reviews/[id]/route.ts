// e2e: tag=admin-reviews
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminReviewModerationSchema } from "@/lib/validators/user";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { adminModerateReview } from "@/lib/services/review";

const ADMIN_ROLES = ["admin", "manager"] as const;

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = safeRoute(async (req: Request, context: RouteContext) => {
  const session = await requireRole(ADMIN_ROLES);
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = adminReviewModerationSchema.parse(raw);
  const result = await adminModerateReview(id, session.user.id, parsed);
  return NextResponse.json(ok(result));
});
