import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { connectDb } from "@/lib/db/connect";
import { listProductsService } from "@/lib/services/product";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async (req: Request) => {
  await connectDb();
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const result = await listProductsService(params);
  return NextResponse.json(ok(result));
});
