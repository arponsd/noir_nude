import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, safeRoute } from "@/lib/api/response";
import { connectDb } from "@/lib/db/connect";
import { checkLimit, searchLimiter } from "@/lib/rate-limit";
import { suggestSearchService } from "@/lib/services/search";

export const dynamic = "force-dynamic";

const querySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(10).optional(),
  })
  .strict();

function clientIp(req: Request): string {
  const header = req.headers.get("x-forwarded-for");
  return header?.split(",")[0]?.trim() || "unknown";
}

export const GET = safeRoute(async (req: Request) => {
  await checkLimit(searchLimiter, `search:${clientIp(req)}`);

  const url = new URL(req.url);
  const params = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const q = params.q ?? "";
  const limit = Math.min(params.limit ?? 8, 10);

  if (!q.trim()) {
    return NextResponse.json(ok([]));
  }

  await connectDb();
  const results = await suggestSearchService(q, limit);
  return NextResponse.json(ok(results));
});
