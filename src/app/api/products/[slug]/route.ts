import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, safeRoute } from "@/lib/api/response";
import { connectDb } from "@/lib/db/connect";
import { getProductDetailService } from "@/lib/services/product";

const paramsSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

type RouteContext = { params: Promise<{ slug: string }> };

export const GET = safeRoute(async (_req: Request, context: RouteContext) => {
  await connectDb();
  const raw = await context.params;
  const { slug } = paramsSchema.parse(raw);
  const product = await getProductDetailService(slug);
  return NextResponse.json(ok(product));
});
