"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./ReviewCard";
import type { ReviewDTO } from "./types";

export interface ReviewListProps {
  reviews: ReviewDTO[];
  total: number;
  page: number;
  limit: number;
  onPageChange?: (page: number) => void;
  onHelpful?: (reviewId: string) => void | Promise<void>;
  emptyLabel?: string;
  className?: string;
}

export function ReviewList({
  reviews,
  total,
  page,
  limit,
  onPageChange,
  onHelpful,
  emptyLabel = "No reviews yet. Be the first to share your thoughts.",
  className,
}: ReviewListProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (reviews.length === 0) {
    return (
      <p className={cn("py-8 text-center text-sm text-[var(--muted)]", className)}>{emptyLabel}</p>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <ul className="flex flex-col">
        {reviews.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} onHelpful={onHelpful} />
          </li>
        ))}
      </ul>

      {totalPages > 1 ? (
        <nav
          aria-label="Review pagination"
          className="mt-6 flex items-center justify-between gap-3"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasPrev}
            onClick={() => onPageChange?.(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden />
            Previous
          </Button>
          <p className="text-xs text-[var(--muted)] tabular-nums">
            Page {page} of {totalPages}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasNext}
            onClick={() => onPageChange?.(page + 1)}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

export default ReviewList;
