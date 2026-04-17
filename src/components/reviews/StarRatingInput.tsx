"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { StarRatingSize } from "./StarRating";

export interface StarRatingInputProps {
  value: number;
  onChange: (next: number) => void;
  size?: StarRatingSize;
  readOnly?: boolean;
  /** Min is 1 when used for submission. Defaults to 1. */
  min?: 0 | 1;
  name?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

const SIZE_CLASS: Record<StarRatingSize, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-7",
};

/**
 * Interactive star rating input. Keyboard accessible:
 * - Left/Right arrows decrement/increment
 * - Home/End jump to min/max
 * - Space/Enter set the value of the focused star
 *
 * Implements the WAI-ARIA radiogroup pattern.
 */
export function StarRatingInput({
  value,
  onChange,
  size = "md",
  readOnly,
  min = 1,
  name,
  id,
  className,
  ...ariaProps
}: StarRatingInputProps) {
  const clamped = Math.round(Math.max(0, Math.min(5, value)));
  const [focused, setFocused] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const set = (next: number) => {
    if (readOnly) return;
    const bounded = Math.max(min, Math.min(5, next));
    onChange(bounded);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        set((clamped || min) - 1);
        break;
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        set((clamped || min - 1) + 1);
        break;
      case "Home":
        e.preventDefault();
        set(min);
        break;
      case "End":
        e.preventDefault();
        set(5);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      id={id}
      role="radiogroup"
      aria-label="Rating"
      onKeyDown={handleKeyDown}
      className={cn("inline-flex items-center gap-1", className)}
      {...ariaProps}
    >
      {name ? <input type="hidden" name={name} value={clamped} /> : null}
      {[1, 2, 3, 4, 5].map((n) => {
        const active = focused !== null ? n <= focused : n <= clamped;
        const isChecked = n === clamped;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={isChecked}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            tabIndex={isChecked || (!clamped && n === min) ? 0 : -1}
            disabled={readOnly}
            onClick={() => set(n)}
            onMouseEnter={() => setFocused(n)}
            onMouseLeave={() => setFocused(null)}
            onFocus={() => setFocused(n)}
            onBlur={() => setFocused(null)}
            className={cn(
              "rounded-sm p-0.5 text-[var(--muted)] transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
              "motion-reduce:transition-none",
              active && "text-[var(--accent)]",
              readOnly && "cursor-default opacity-70",
            )}
          >
            <Star
              className={cn(SIZE_CLASS[size], active && "fill-[var(--accent)]")}
              strokeWidth={1.5}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

export default StarRatingInput;
