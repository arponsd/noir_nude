import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { connectDb } from "@/lib/db/connect";
import { listCategoryTreeService } from "@/lib/services/category";

export const GET = safeRoute(async () => {
  await connectDb();
  const tree = await listCategoryTreeService();
  return NextResponse.json(ok(tree));
});
