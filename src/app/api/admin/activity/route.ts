import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminActivityQuerySchema } from "@/lib/validators/admin";
import { listActivityService } from "@/lib/services/admin-activity";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const params = adminActivityQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const result = await listActivityService(params);
  return NextResponse.json(ok(result));
});
