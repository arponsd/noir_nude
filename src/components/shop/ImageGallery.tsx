"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface GalleryImage {
  url: string;
  alt: string;
  order: number;
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
}

export default function ImageGallery({ images, className }: ImageGalleryProps) {
  const sorted = React.useMemo(() => [...images].sort((a, b) => a.order - b.order), [images]);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (index >= sorted.length) setIndex(0);
  }, [sorted.length, index]);

  const active = sorted[index];

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex((i) => (i + 1) % sorted.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((i) => (i - 1 + sorted.length) % sorted.length);
    }
  };

  if (sorted.length === 0 || !active) {
    return (
      <div
        className={cn(
          "aspect-[4/5] w-full rounded-[var(--radius-md)] bg-[var(--bg-alt)]",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="group"
        aria-label="Product images"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="group relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Image
          src={active.url}
          alt={active.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ink)]/70 px-2.5 py-0.5 text-[10px] font-medium text-white tabular-nums"
          aria-hidden
        >
          {index + 1} / {sorted.length}
        </span>
      </div>

      {sorted.length > 1 ? (
        <div
          className="flex snap-x gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Image thumbnails"
        >
          {sorted.map((img, i) => {
            const isActive = i === index;
            return (
              <button
                key={`${img.url}-${img.order}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative aspect-[4/5] w-16 shrink-0 snap-start overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-alt)] transition-[box-shadow] duration-200 sm:w-20",
                  isActive
                    ? "ring-2 ring-[var(--accent)] ring-offset-2"
                    : "ring-1 ring-[var(--line)] hover:ring-[var(--ink-soft)]",
                  "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
