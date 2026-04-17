// e2e: tag=reviews
import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, safeRoute } from "@/lib/api/response";
import { SKIN_TYPES, type SkinType } from "@/lib/constants";
import { listReviewsForProduct } from "@/lib/services/review";

export const dynamic = "force-dynamic";

const slugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Invalid slug" }),
});

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.enum(["recent", "helpful"]).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    skinType: z.enum(SKIN_TYPES).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ slug: string }> };

export const GET = safeRoute(async (req: Request, context: RouteContext) => {
  const { slug } = slugParamsSchema.parse(await context.params);
  const url = new URL(req.url);
  const parsed = listQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

  const opts: Parameters<typeof listReviewsForProduct>[1] = {};
  if (parsed.page !== undefined) opts.page = parsed.page;
  if (parsed.limit !== undefined) opts.limit = parsed.limit;
  if (parsed.sort !== undefined) opts.sort = parsed.sort;
  if (parsed.rating !== undefined) opts.rating = parsed.rating;
  if (parsed.skinType !== undefined) opts.skinType = parsed.skinType as SkinType;

  const result = await listReviewsForProduct(slug, opts);
  return NextResponse.json(ok(result));
});
