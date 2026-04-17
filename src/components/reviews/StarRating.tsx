import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type StarRatingSize = "sm" | "md" | "lg";

export interface StarRatingProps {
  /** Rating value from 0 to 5. Half stars allowed (display-only). */
  value: number;
  size?: StarRatingSize;
  /** Accessible label. Defaults to e.g. "Rated 4.5 out of 5". */
  label?: string;
  className?: string;
}

const SIZE_CLASS: Record<StarRatingSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

const GAP_CLASS: Record<StarRatingSize, string> = {
  sm: "gap-0.5",
  md: "gap-0.5",
  lg: "gap-1",
};

/**
 * Non-interactive star rating. Safe to render from Server Components.
 * Supports half-star rendering via CSS clip.
 */
export function StarRating({ value, size = "md", label, className }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const accessible = label ?? `Rated ${clamped.toFixed(1)} out of 5`;
  return (
    <span
      role="img"
      aria-label={accessible}
      className={cn("inline-flex items-center", GAP_CLASS[size], className)}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, clamped - i));
        return <StarGlyph key={i} fill={fill} size={size} />;
      })}
    </span>
  );
}

function StarGlyph({ fill, size }: { fill: number; size: StarRatingSize }) {
  const pct = Math.round(fill * 100);
  return (
    <span className={cn("relative inline-block", SIZE_CLASS[size])} aria-hidden>
      <Star
        className={cn("absolute inset-0 text-[var(--muted)]", SIZE_CLASS[size])}
        strokeWidth={1.5}
      />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <Star
          className={cn("fill-[var(--accent)] text-[var(--accent)]", SIZE_CLASS[size])}
          strokeWidth={1.5}
        />
      </span>
    </span>
  );
}

export default StarRating;
