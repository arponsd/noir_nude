import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminBannerReorderSchema } from "@/lib/validators/admin";
import { reorderBannersService } from "@/lib/services/admin-banner";

const WRITE_ROLES = ["admin", "manager"] as const;

export const POST = safeRoute(async (req: Request) => {
  const session = await requireRole(WRITE_ROLES);
  const input = adminBannerReorderSchema.parse(await req.json());
  const result = await reorderBannersService(input, {
    id: session.user.id,
    role: session.user.role,
  });
  return NextResponse.json(ok(result));
});
