import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminCustomersQuerySchema } from "@/lib/validators/admin";
import { listCustomersService } from "@/lib/services/admin-customer";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const params = adminCustomersQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const page = await listCustomersService(params);
  return NextResponse.json(ok(page));
});
