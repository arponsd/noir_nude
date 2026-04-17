import mongoose from "mongoose";
import type { ClientSession, Types } from "mongoose";
import { NotFoundError } from "@/lib/api/response";
import { Product } from "@/lib/db/models/Product";
import { Review, type ReviewDoc } from "@/lib/db/models/Review";
import { aggregateRatingStats } from "@/lib/db/queries/review";
import logger from "@/lib/utils/logger";

function isTransactionUnsupported(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = (err as { message?: string }).message ?? "";
  return (
    message.includes("Transaction numbers") ||
    message.includes("replica set") ||
    message.includes("sharded cluster")
  );
}

async function doApprove(
  reviewId: Types.ObjectId | string,
  adminId: Types.ObjectId | string,
  session: ClientSession | null,
): Promise<ReviewDoc> {
  const reviewQuery = Review.findOne({ _id: reviewId });
  if (session) reviewQuery.session(session);
  const review = await reviewQuery.exec();
  if (!review) {
    throw new NotFoundError("Review not found");
  }
  if (review.isApproved) {
    throw new NotFoundError("Review is already approved");
  }

  review.isApproved = true;
  await review.save(session ? { session } : undefined);

  const stats = await aggregateRatingStats(review.productId);

  await Product.updateOne(
    { _id: review.productId },
    { $set: { rating: { avg: stats.avg, count: stats.count } } },
    session ? { session } : undefined,
  );

  logger.info(
    {
      kind: "activity",
      event: "review.approved",
      reviewId: review._id.toString(),
      productId: review.productId.toString(),
      adminId: adminId.toString(),
      ratingAvg: stats.avg,
      ratingCount: stats.count,
    },
    "review approved",
  );

  return review.toObject() as ReviewDoc;
}

/**
 * Approve a pending review and recompute the owning product's rating snapshot
 * inside a transaction. Falls back to sequential writes on standalone Mongo where
 * transactions are unsupported.
 */
export async function approveReviewTransaction(
  reviewId: Types.ObjectId | string,
  adminId: Types.ObjectId | string,
): Promise<ReviewDoc> {
  const session = await mongoose.startSession();
  try {
    let result: ReviewDoc | undefined;
    await session.withTransaction(async () => {
      result = await doApprove(reviewId, adminId, session);
    });
    // reason: withTransaction resolves only once the callback commits; result is set.
    return result as ReviewDoc;
  } catch (err) {
    if (isTransactionUnsupported(err)) {
      return doApprove(reviewId, adminId, null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
