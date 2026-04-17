// e2e: tag=admin-reviews
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminListPendingReviews } from "@/lib/services/review";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    // reason: `status` is reserved for future extension (approved/rejected views). Only
    // "pending" is served today, so we ignore unknown values rather than reject.
    status: z.enum(["pending"]).optional(),
  })
  .strict();

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const parsed = listQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const opts: Parameters<typeof adminListPendingReviews>[0] = {};
  if (parsed.page !== undefined) opts.page = parsed.page;
  if (parsed.limit !== undefined) opts.limit = parsed.limit;
  const result = await adminListPendingReviews(opts);
  return NextResponse.json(ok(result));
});
