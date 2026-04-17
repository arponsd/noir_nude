import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminBannerCreateSchema } from "@/lib/validators/admin";
import { createBannerService, listBannersAdminService } from "@/lib/services/admin-banner";

const READ_ROLES = ["admin", "manager", "support"] as const;
const WRITE_ROLES = ["admin", "manager"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(READ_ROLES);
  const url = new URL(req.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20;
  const result = await listBannersAdminService({ page, limit });
  return NextResponse.json(ok(result));
});

export const POST = safeRoute(async (req: Request) => {
  const session = await requireRole(WRITE_ROLES);
  const input = adminBannerCreateSchema.parse(await req.json());
  const detail = await createBannerService(input, {
    id: session.user.id,
    role: session.user.role,
  });
  return NextResponse.json(ok(detail), { status: 201 });
});
