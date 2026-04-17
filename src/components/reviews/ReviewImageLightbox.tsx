"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import type { ReviewImage } from "./types";

export interface ReviewImageLightboxProps {
  images: ReviewImage[];
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewImageLightbox({
  images,
  startIndex,
  open,
  onOpenChange,
}: ReviewImageLightboxProps) {
  const [index, setIndex] = React.useState(startIndex);

  React.useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const prev = React.useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = React.useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  const current = images[index];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-4" onKeyDown={handleKeyDown}>
        <DialogTitle className="sr-only">
          Review image {index + 1} of {images.length}
        </DialogTitle>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-alt)]">
          <Image
            src={current.url}
            alt={current.alt || `Review image ${index + 1}`}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-contain"
          />
        </div>
        {images.length > 1 ? (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
                "hover:bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
            <p className="text-xs text-[var(--muted)] tabular-nums">
              {index + 1} / {images.length}
            </p>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
                "hover:bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            >
              <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default ReviewImageLightbox;
