import Link from "next/link";
import { auth } from "@/lib/auth";
import { listReviewsForProduct } from "@/lib/services/review";
import { Order } from "@/lib/db/models";
import { connectDb } from "@/lib/db/connect";
import { StarRating } from "@/components/reviews/StarRating";
import { VerifiedBadge } from "@/components/reviews/VerifiedBadge";
import { ReviewList } from "@/components/reviews/ReviewList";
import type { ReviewDTO as PresentationalReview } from "@/components/reviews/types";
import { Button } from "@/components/ui/button";
import WriteReviewDialog from "./WriteReviewDialog";
import type { ReviewDTO } from "@/types/api/review";

type Props = {
  productId: string;
  slug: string;
};

async function findEligibleOrderId(userId: string, productId: string): Promise<string | null> {
  await connectDb();
  const order = await Order.findOne({
    userId,
    orderStatus: "delivered",
    "items.productId": productId,
    deletedAt: null,
  })
    .select({ _id: 1 })
    .sort({ deliveredAt: -1, placedAt: -1 })
    .lean<{ _id: { toString(): string } } | null>();
  return order ? order._id.toString() : null;
}

function toPresentational(r: ReviewDTO): PresentationalReview {
  const out: PresentationalReview = {
    id: r.id,
    productId: r.productId,
    rating: r.rating,
    title: r.title,
    body: r.body,
    author: { name: r.authorName },
    verified: r.isVerified,
    createdAt: r.createdAt,
    helpfulCount: r.helpfulCount,
    images: r.images,
  };
  if (r.skinTypeAtReview) out.skinTypeAtReview = r.skinTypeAtReview;
  if (r.adminReply) out.adminReply = { body: r.adminReply.body, repliedAt: r.adminReply.repliedAt };
  return out;
}

function computeHistogram(items: ReviewDTO[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const bucket: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of items) {
    const key = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    bucket[key] += 1;
  }
  return bucket;
}

export default async function ProductReviews({ productId, slug }: Props) {
  const session = await auth();
  const listing = await listReviewsForProduct(slug, { page: 1, limit: 10 });

  let canReview = false;
  let orderId: string | null = null;
  if (session) {
    orderId = await findEligibleOrderId(session.user.id, productId);
    canReview = Boolean(orderId);
  }

  const avg =
    listing.items.length === 0
      ? 0
      : listing.items.reduce((sum, r) => sum + r.rating, 0) / listing.items.length;
  const histogram = computeHistogram(listing.items);

  return (
    <section id="reviews" className="mt-16 border-t border-[var(--line)] pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Reviews
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <StarRating value={avg} size="md" />
            <span className="text-sm text-[var(--ink-soft)] tabular-nums">
              {listing.total > 0
                ? `${avg.toFixed(1)} · ${listing.total} review${listing.total === 1 ? "" : "s"}`
                : "No reviews yet"}
            </span>
          </div>
        </div>

        {session ? (
          canReview && orderId ? (
            <WriteReviewDialog productId={productId} orderId={orderId} />
          ) : (
            <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <VerifiedBadge />
              <span>Only verified buyers can review.</span>
            </div>
          )
        ) : (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/login?next=/products/${slug}`}>Sign in to review</Link>
          </Button>
        )}
      </div>

      {listing.items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--ink-soft)]">
          No reviews yet. Once a verified buyer writes the first one, it shows up here after
          moderation.
        </p>
      ) : (
        <>
          <ul className="mt-6 grid gap-1 text-xs text-[var(--ink-soft)] sm:grid-cols-5">
            {[5, 4, 3, 2, 1].map((star) => (
              <li
                key={star}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] px-3 py-2"
              >
                <span className="tabular-nums">{star}★</span>
                <span className="text-[var(--ink)]">{histogram[star as 1 | 2 | 3 | 4 | 5]}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <ReviewList
              reviews={listing.items.map(toPresentational)}
              total={listing.total}
              page={listing.page}
              limit={listing.limit}
            />
          </div>
        </>
      )}
    </section>
  );
}
