import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { adminGetReview } from "@/lib/services/review";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import AdminReviewModeration from "./_moderation";

export const metadata = {
  title: "Admin · Review detail",
};

export const dynamic = "force-dynamic";

export default async function AdminReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await adminGetReview(id);
  if (!review) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm" aria-label="Breadcrumb">
        <Link href="/admin/reviews" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
          ← All pending reviews
        </Link>
      </nav>

      <article className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} size="md" />
              <span className="text-sm text-[var(--ink-soft)] tabular-nums">{review.rating}/5</span>
            </div>
            <h1 className="font-display mt-3 text-2xl font-semibold tracking-[-0.01em]">
              {review.title}
            </h1>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              By {review.authorName}
              {review.isVerified ? " · Verified buyer" : ""} · Submitted{" "}
              {new Date(review.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/products/${review.productSlug ?? review.productId}`}>View product</Link>
            </Button>
          </div>
        </header>

        <div className="mt-6 whitespace-pre-wrap text-[var(--ink)]">{review.body}</div>

        {review.images.length > 0 ? (
          <ul className="mt-6 grid grid-cols-3 gap-3">
            {review.images.map((img) => (
              <li
                key={img.url}
                className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)]"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 200px, 33vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <section className="mt-8" aria-labelledby="moderation-heading">
        <h2
          id="moderation-heading"
          className="font-display text-xl font-semibold tracking-[-0.01em]"
        >
          Moderate
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Approving publishes the review on the product page and recomputes the average rating.
        </p>
        <div className="mt-4">
          <AdminReviewModeration reviewId={review.id} />
        </div>
      </section>
    </div>
  );
}
