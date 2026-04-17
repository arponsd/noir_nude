"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { StarRating } from "./StarRating";
import { VerifiedBadge } from "./VerifiedBadge";
import { HelpfulVote } from "./HelpfulVote";
import { ReviewImageLightbox } from "./ReviewImageLightbox";
import type { ReviewDTO } from "./types";

export interface ReviewCardProps {
  review: ReviewDTO;
  onHelpful?: (reviewId: string) => void | Promise<void>;
  userVoted?: boolean;
  className?: string;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ReviewCard({ review, onHelpful, userVoted, className }: ReviewCardProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const voted = userVoted ?? review.userVoted ?? false;

  const handleHelpful = React.useCallback(async () => {
    if (!onHelpful) return;
    await onHelpful(review.id);
  }, [onHelpful, review.id]);

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const images = review.images ?? [];

  return (
    <article
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--line)] py-6 last:border-b-0",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <StarRating value={review.rating} size="sm" />
            <h3 className="font-display text-lg leading-tight tracking-[-0.01em] text-[var(--ink)]">
              {review.title}
            </h3>
          </div>
          <p className="text-xs text-[var(--muted)]">
            <span className="font-medium text-[var(--ink-soft)]">{review.author.name}</span>
            <span aria-hidden> · </span>
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
            {review.verified ? (
              <>
                <span aria-hidden> · </span>
                <VerifiedBadge className="align-middle" />
              </>
            ) : null}
          </p>
        </div>
      </header>

      {review.body ? (
        <p className="prose prose-sm max-w-none text-sm leading-[1.7] whitespace-pre-wrap text-[var(--ink-soft)]">
          {review.body}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <li key={`${img.url}-${idx}`}>
              <button
                type="button"
                onClick={() => openLightbox(idx)}
                aria-label={`Open image ${idx + 1} of ${images.length}`}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg-alt)]",
                  "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `Review image ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {review.adminReply ? (
        <div className="ml-4 border-l-2 border-[var(--accent-soft)] bg-[var(--bg-alt)]/60 p-3 text-sm text-[var(--ink-soft)]">
          <p className="text-xs font-medium tracking-[0.08em] text-[var(--accent)] uppercase">
            Response from {review.adminReply.author ?? "GlowCart"}
          </p>
          <p className="mt-1.5 leading-[1.7] whitespace-pre-wrap">{review.adminReply.body}</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            <time dateTime={review.adminReply.repliedAt}>
              {formatDate(review.adminReply.repliedAt)}
            </time>
          </p>
        </div>
      ) : null}

      <footer>
        <HelpfulVote count={review.helpfulCount} voted={voted} onToggle={handleHelpful} />
      </footer>

      {images.length > 0 ? (
        <ReviewImageLightbox
          images={images}
          startIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      ) : null}
    </article>
  );
}

export default ReviewCard;
