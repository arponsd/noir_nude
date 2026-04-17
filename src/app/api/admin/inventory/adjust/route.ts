import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminInventoryAdjustSchema } from "@/lib/validators/admin";
import { adjustInventoryService } from "@/lib/services/admin-inventory";

const ADMIN_ROLES = ["admin", "manager"] as const;

export const PATCH = safeRoute(async (req: Request) => {
  const session = await requireRole(ADMIN_ROLES);
  const input = adminInventoryAdjustSchema.parse(await req.json());
  const result = await adjustInventoryService(input, {
    id: session.user.id,
    role: session.user.role,
  });
  return NextResponse.json(ok(result));
});
