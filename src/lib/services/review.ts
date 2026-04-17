import { Types } from "mongoose";
import sanitizeHtml from "sanitize-html";

import { connectDb } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/Product";
import { Review, type ReviewDoc } from "@/lib/db/models/Review";
import { Order } from "@/lib/db/models/Order";
import { User } from "@/lib/db/models/User";
import {
  aggregateRatingStats,
  getReviewById,
  listApprovedForProduct,
  listPendingForAdmin,
  type ListApprovedForProductOpts,
  type ListPendingOpts,
  type ListReviewsResult,
  type RatingStats,
} from "@/lib/db/queries/review";
import { approveReviewTransaction } from "@/lib/db/transactions/approve-review";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import { ERROR_CODES, type SkinType } from "@/lib/constants";
import { isObjectId } from "@/lib/utils/object-id";
import type {
  ReviewDTO,
  ReviewHelpfulToggleResult,
  ReviewListPage,
  ReviewSubmitInput,
} from "@/types/api/review";
import logger from "@/lib/utils/logger";

/* ----------------------------------------------------------------------------
 * Review service.
 *
 * Reads shape DB docs into `ReviewDTO`s (joining authorName from User). Submit enforces
 * the verified-buyer invariant at the service layer, HTML-sanitises the body via the
 * `sanitize-html` allowlist from docs/11-security.md, and relies on the unique index
 * `user_product_order_unique` to block duplicate submissions.
 *
 * Moderation delegates to `approveReviewTransaction` (which recomputes Product.rating
 * atomically). Rejections stay in the Review collection with `isApproved: false` so
 * admins can audit the full stream.
 * -------------------------------------------------------------------------- */

export type ReviewSortMode = "recent" | "helpful";

export type ListReviewsForProductOpts = {
  page?: number;
  limit?: number;
  sort?: ReviewSortMode;
  rating?: number;
  skinType?: SkinType;
};

const SANITIZE_ALLOWED_TAGS = ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"] as const;

function sanitizeBody(raw: string): string {
  return sanitizeHtml(raw, {
    allowedTags: [...SANITIZE_ALLOWED_TAGS],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
    allowedSchemes: [],
  }).trim();
}

type LeanProductRef = { _id: Types.ObjectId; slug: string };
type LeanUserRef = { _id: Types.ObjectId; name: string };

async function resolveProductIdOrSlug(slugOrId: string): Promise<LeanProductRef | null> {
  if (isObjectId(slugOrId)) {
    const byId = await Product.findOne({ _id: slugOrId, deletedAt: null })
      .select({ _id: 1, slug: 1 })
      .lean<LeanProductRef | null>();
    if (byId) return byId;
  }
  const bySlug = await Product.findOne({ slug: slugOrId, deletedAt: null })
    .select({ _id: 1, slug: 1 })
    .lean<LeanProductRef | null>();
  return bySlug;
}

async function authorNameMap(ids: Types.ObjectId[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const users = await User.find({ _id: { $in: ids } }, { name: 1 })
    .setOptions({ withDeleted: true })
    .lean<LeanUserRef[]>();
  const map = new Map<string, string>();
  for (const u of users) {
    map.set(u._id.toString(), u.name);
  }
  return map;
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Customer";
  return trimmed.split(/\s+/)[0] ?? "Customer";
}

function reviewDocToDTO(
  doc: ReviewDoc,
  authorName: string,
  productSlug: string | undefined,
): ReviewDTO {
  const dto: ReviewDTO = {
    id: doc._id.toString(),
    productId: doc.productId.toString(),
    rating: doc.rating,
    title: doc.title,
    body: doc.body,
    images: (doc.images ?? []).map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    helpfulCount: doc.helpfulCount ?? 0,
    isVerified: doc.isVerified ?? false,
    authorName,
    createdAt: (doc as ReviewDoc & { createdAt: Date }).createdAt.toISOString(),
  };
  if (productSlug) dto.productSlug = productSlug;
  if (doc.skinTypeAtReview) dto.skinTypeAtReview = doc.skinTypeAtReview as SkinType;
  if (doc.adminReply && doc.adminReply.body) {
    dto.adminReply = {
      body: doc.adminReply.body,
      repliedAt: (doc.adminReply.repliedAt ?? new Date(0)).toISOString(),
    };
  }
  return dto;
}

async function shapeReviewList(
  docs: ReviewDoc[],
  productSlug: string | undefined,
): Promise<ReviewDTO[]> {
  const authorIds = docs.map((d) => d.userId);
  const names = await authorNameMap(authorIds);
  return docs.map((d) => {
    const rawName = names.get(d.userId.toString()) ?? "Customer";
    return reviewDocToDTO(d, firstName(rawName), productSlug);
  });
}

export async function listReviewsForProduct(
  slugOrId: string,
  opts: ListReviewsForProductOpts = {},
): Promise<ReviewListPage & { ratingStats: RatingStats }> {
  await connectDb();
  const product = await resolveProductIdOrSlug(slugOrId);
  if (!product) throw new NotFoundError("Product not found");

  const dbOpts: ListApprovedForProductOpts = {};
  if (opts.page !== undefined) dbOpts.page = opts.page;
  if (opts.limit !== undefined) dbOpts.limit = opts.limit;
  if (opts.sort === "helpful") dbOpts.sortByHelpful = true;
  if (opts.rating !== undefined) dbOpts.filterByRating = opts.rating;
  if (opts.skinType !== undefined) dbOpts.filterBySkinType = opts.skinType;

  const [page, ratingStats] = await Promise.all([
    listApprovedForProduct(product._id, dbOpts),
    aggregateRatingStats(product._id),
  ]);
  const items = await shapeReviewList(page.items, product.slug);
  return {
    items,
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: page.totalPages,
    ratingStats,
  };
}

/* ---------- Submission ---------- */

export async function submitReview(userId: string, input: ReviewSubmitInput): Promise<ReviewDTO> {
  await connectDb();

  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");
  if (!Types.ObjectId.isValid(input.productId)) {
    throw new ValidationError("Invalid product id", ERROR_CODES.VALIDATION_FAILED);
  }
  if (!Types.ObjectId.isValid(input.orderId)) {
    throw new ValidationError("Invalid order id", ERROR_CODES.VALIDATION_FAILED);
  }

  // Verified-buyer check: the order must belong to this user, be delivered, and contain the product.
  const order = await Order.findOne({ _id: input.orderId, userId }).lean();
  if (!order) {
    throw new ValidationError("You have not purchased this product.", "REVIEW_NOT_VERIFIED");
  }
  if (order.orderStatus !== "delivered") {
    throw new ValidationError(
      "Reviews can only be left after the order is delivered.",
      "REVIEW_NOT_VERIFIED",
    );
  }
  const hasItem = order.items.some((it) => it.productId.toString() === input.productId);
  if (!hasItem) {
    throw new ValidationError(
      "This order does not include the product being reviewed.",
      "REVIEW_NOT_VERIFIED",
    );
  }

  // Auto-populate skin type from the user profile if the caller did not specify one.
  let skinType: SkinType | null = null;
  if (input.skinTypeAtReview === undefined) {
    const user = await User.findById(userId).select({ skinType: 1 }).lean<{
      skinType?: string;
    } | null>();
    if (user?.skinType) skinType = user.skinType as SkinType;
  } else {
    skinType = input.skinTypeAtReview ?? null;
  }

  const sanitizedBody = sanitizeBody(input.body);
  if (sanitizedBody.length < 10) {
    throw new ValidationError(
      "Review body is too short after sanitisation.",
      ERROR_CODES.VALIDATION_FAILED,
    );
  }

  const images = (input.images ?? []).map((url) => ({ url, alt: "" }));

  try {
    const created = await Review.create({
      productId: new Types.ObjectId(input.productId),
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(input.orderId),
      rating: input.rating,
      title: input.title.trim(),
      body: sanitizedBody,
      images,
      skinTypeAtReview: skinType,
      isVerified: true,
      isApproved: false,
      helpfulCount: 0,
      helpfulVoters: [],
    });

    logger.info(
      {
        kind: "activity",
        event: "review.submitted",
        reviewId: created._id.toString(),
        productId: input.productId,
        orderId: input.orderId,
        userId,
      },
      "review submitted (pending moderation)",
    );

    const doc = created.toObject() as ReviewDoc;
    const userDoc = await User.findById(userId).select({ name: 1 }).lean<LeanUserRef | null>();
    const authorName = userDoc ? firstName(userDoc.name) : "Customer";
    return reviewDocToDTO(doc, authorName, undefined);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ValidationError(
        "You have already reviewed this product for this order.",
        "ALREADY_REVIEWED",
      );
    }
    throw err;
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { code?: number }).code === 11000;
}

/* ---------- Helpful toggle ---------- */

export async function toggleReviewHelpful(
  userId: string,
  reviewId: string,
): Promise<ReviewHelpfulToggleResult> {
  await connectDb();
  if (!Types.ObjectId.isValid(reviewId)) throw new NotFoundError("Review not found");
  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");

  const uid = new Types.ObjectId(userId);
  const rid = new Types.ObjectId(reviewId);

  const existing = await Review.findOne({ _id: rid, isApproved: true })
    .select({ helpfulVoters: 1 })
    .lean<{ helpfulVoters?: Types.ObjectId[] } | null>();
  if (!existing) throw new NotFoundError("Review not found");

  const hasVoted = (existing.helpfulVoters ?? []).some((v) => v.toString() === userId);

  const update = hasVoted
    ? { $pull: { helpfulVoters: uid }, $inc: { helpfulCount: -1 } }
    : { $addToSet: { helpfulVoters: uid }, $inc: { helpfulCount: 1 } };

  const updated = await Review.findOneAndUpdate({ _id: rid }, update, {
    new: true,
  })
    .select({ helpfulCount: 1, helpfulVoters: 1 })
    .lean<{ helpfulCount: number; helpfulVoters: Types.ObjectId[] } | null>();

  if (!updated) throw new NotFoundError("Review not found");
  // Clamp against negative drift — unlikely, but protects the response shape.
  const helpfulCount = Math.max(0, updated.helpfulCount ?? 0);
  const userVoted = (updated.helpfulVoters ?? []).some((v) => v.toString() === userId);
  return { helpfulCount, userVoted };
}

/* ---------- Admin ---------- */

export async function adminListPendingReviews(
  opts: { page?: number; limit?: number } = {},
): Promise<ReviewListPage> {
  await connectDb();
  const dbOpts: ListPendingOpts = {};
  if (opts.page !== undefined) dbOpts.page = opts.page;
  if (opts.limit !== undefined) dbOpts.limit = opts.limit;
  const page: ListReviewsResult = await listPendingForAdmin(dbOpts);
  const items = await shapeReviewList(page.items, undefined);
  return {
    items,
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: page.totalPages,
  };
}

export async function adminModerateReview(
  reviewId: string,
  adminId: string,
  input: { isApproved: boolean; adminReply?: string },
): Promise<ReviewDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(reviewId)) throw new NotFoundError("Review not found");
  if (!Types.ObjectId.isValid(adminId)) throw new NotFoundError("Admin not found");

  const replyBody = input.adminReply ? sanitizeBody(input.adminReply) : undefined;

  if (input.isApproved) {
    await approveReviewTransaction(reviewId, adminId);
  } else {
    // Rejected path — leave approval flag false (default). Still record moderation event.
    const existing = await getReviewById(reviewId);
    if (!existing) throw new NotFoundError("Review not found");
    await Review.updateOne({ _id: reviewId }, { $set: { isApproved: false } });
    logger.info(
      {
        kind: "activity",
        event: "review.rejected",
        reviewId,
        adminId,
      },
      "review rejected by admin",
    );
  }

  if (replyBody) {
    await Review.updateOne(
      { _id: reviewId },
      {
        $set: {
          adminReply: {
            body: replyBody,
            authorId: new Types.ObjectId(adminId),
            repliedAt: new Date(),
          },
        },
      },
    );
  }

  const doc = await getReviewById(reviewId);
  if (!doc) throw new NotFoundError("Review not found");
  const userDoc = await User.findById(doc.userId).select({ name: 1 }).lean<LeanUserRef | null>();
  const authorName = userDoc ? firstName(userDoc.name) : "Customer";
  return reviewDocToDTO(doc, authorName, undefined);
}

export async function adminGetReview(reviewId: string): Promise<ReviewDTO | null> {
  await connectDb();
  if (!Types.ObjectId.isValid(reviewId)) return null;
  const doc = await getReviewById(reviewId);
  if (!doc) return null;
  const userDoc = await User.findById(doc.userId).select({ name: 1 }).lean<LeanUserRef | null>();
  const authorName = userDoc ? firstName(userDoc.name) : "Customer";
  return reviewDocToDTO(doc, authorName, undefined);
}

export async function adminReplyReview(
  reviewId: string,
  adminId: string,
  body: string,
): Promise<ReviewDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(reviewId)) throw new NotFoundError("Review not found");
  if (!Types.ObjectId.isValid(adminId)) throw new NotFoundError("Admin not found");

  const sanitised = sanitizeBody(body);
  if (sanitised.length === 0) {
    throw new ValidationError("Reply body is empty.", ERROR_CODES.VALIDATION_FAILED);
  }

  await Review.updateOne(
    { _id: reviewId },
    {
      $set: {
        adminReply: {
          body: sanitised,
          authorId: new Types.ObjectId(adminId),
          repliedAt: new Date(),
        },
      },
    },
  );

  const doc = await getReviewById(reviewId);
  if (!doc) throw new NotFoundError("Review not found");
  const userDoc = await User.findById(doc.userId).select({ name: 1 }).lean<LeanUserRef | null>();
  const authorName = userDoc ? firstName(userDoc.name) : "Customer";
  return reviewDocToDTO(doc, authorName, undefined);
}
