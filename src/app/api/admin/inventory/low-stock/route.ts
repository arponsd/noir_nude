import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { listLowStockService } from "@/lib/services/admin-inventory";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await requireRole(ADMIN_ROLES);
  const url = new URL(req.url);
  const thresholdRaw = url.searchParams.get("threshold");
  const limitRaw = url.searchParams.get("limit");
  const threshold = thresholdRaw
    ? Math.max(1, Math.min(Number.parseInt(thresholdRaw, 10) || 5, 1000))
    : 5;
  const limit = limitRaw ? Math.max(1, Math.min(Number.parseInt(limitRaw, 10) || 50, 200)) : 50;
  const rows = await listLowStockService(threshold, limit);
  return NextResponse.json(ok({ items: rows, threshold, limit }));
});
