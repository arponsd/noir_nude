import { Types, type FilterQuery } from "mongoose";
import { Review, type ReviewDoc } from "@/lib/db/models/Review";

export type ListApprovedForProductOpts = {
  page?: number;
  limit?: number;
  sortByHelpful?: boolean;
  filterByRating?: number;
  filterBySkinType?: string;
};

export type ListReviewsResult = {
  items: ReviewDoc[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RatingStats = {
  avg: number;
  count: number;
  byStar: { 1: number; 2: number; 3: number; 4: number; 5: number };
};

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}

function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 20;
  return Math.min(Math.floor(n), 100);
}

export async function listApprovedForProduct(
  productId: Types.ObjectId | string,
  opts: ListApprovedForProductOpts = {},
): Promise<ListReviewsResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<ReviewDoc> = { productId, isApproved: true };
  if (opts.filterByRating && Number.isInteger(opts.filterByRating)) {
    filter.rating = opts.filterByRating;
  }
  if (opts.filterBySkinType) {
    filter.skinTypeAtReview = opts.filterBySkinType;
  }

  const sort: Record<string, 1 | -1> = opts.sortByHelpful
    ? { helpfulCount: -1, createdAt: -1 }
    : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limit).lean<ReviewDoc[]>(),
    Review.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items, page, limit, total, totalPages };
}

export async function getReviewById(id: Types.ObjectId | string): Promise<ReviewDoc | null> {
  return Review.findOne({ _id: id }).lean<ReviewDoc | null>();
}

export type ListPendingOpts = {
  page?: number;
  limit?: number;
};

export async function listPendingForAdmin(opts: ListPendingOpts = {}): Promise<ListReviewsResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;
  const filter: FilterQuery<ReviewDoc> = { isApproved: false };

  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<ReviewDoc[]>(),
    Review.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items, page, limit, total, totalPages };
}

export async function countReviewsByProduct(
  productId: Types.ObjectId | string,
  onlyApproved = true,
): Promise<number> {
  const filter: FilterQuery<ReviewDoc> = { productId };
  if (onlyApproved) filter.isApproved = true;
  return Review.countDocuments(filter);
}

type AggregateRow = { _id: number; count: number };

/**
 * Aggregate rating stats for a product in a single pipeline. Only counts approved
 * reviews (PDP-visible) — callers that need pending stats can filter themselves.
 */
export async function aggregateRatingStats(
  productId: Types.ObjectId | string,
): Promise<RatingStats> {
  // reason: $match does not auto-cast strings to ObjectId the way find() does,
  // so coerce explicitly before passing to the pipeline.
  const pid = typeof productId === "string" ? new Types.ObjectId(productId) : productId;
  const rows = await Review.aggregate<AggregateRow>([
    { $match: { productId: pid, isApproved: true, deletedAt: null } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const byStar = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingStats["byStar"];
  let total = 0;
  let weighted = 0;
  for (const row of rows) {
    const star = row._id;
    if (star >= 1 && star <= 5) {
      byStar[star as 1 | 2 | 3 | 4 | 5] = row.count;
      total += row.count;
      weighted += star * row.count;
    }
  }
  const avg = total === 0 ? 0 : Math.round((weighted / total) * 100) / 100;
  return { avg, count: total, byStar };
}
