import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, safeRoute } from "@/lib/api/response";
import { connectDb } from "@/lib/db/connect";
import { getCategoryWithProductsService } from "@/lib/services/category";

const paramsSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const querySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(48).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ slug: string }> };

export const GET = safeRoute(async (req: Request, context: RouteContext) => {
  await connectDb();
  const raw = await context.params;
  const { slug } = paramsSchema.parse(raw);
  const url = new URL(req.url);
  const { limit } = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const data = await getCategoryWithProductsService(slug, limit ?? 24);
  return NextResponse.json(ok(data));
});
