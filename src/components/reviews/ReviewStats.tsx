import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { StarRating } from "./StarRating";

export interface ReviewStatsProps {
  avg: number;
  count: number;
  byStar: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
  className?: string;
}

const STARS = [5, 4, 3, 2, 1] as const;

export function ReviewStats({ avg, count, byStar, className }: ReviewStatsProps) {
  const max = Math.max(1, ...STARS.map((s) => byStar[s] ?? 0));

  return (
    <section
      aria-label="Rating summary"
      className={cn(
        "grid gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6 sm:grid-cols-[auto_1fr]",
        className,
      )}
    >
      <div className="flex flex-col items-start gap-2">
        <p className="font-display text-5xl leading-none font-semibold tracking-[-0.02em] text-[var(--ink)] tabular-nums">
          {avg.toFixed(1)}
        </p>
        <StarRating value={avg} size="md" />
        <p className="text-xs text-[var(--muted)] tabular-nums">
          {count} {count === 1 ? "review" : "reviews"}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5" aria-label="Rating breakdown">
        {STARS.map((star) => {
          const value = byStar[star] ?? 0;
          const pct = count === 0 ? 0 : Math.round((value / max) * 100);
          return (
            <li key={star} className="flex items-center gap-3 text-xs">
              <span className="w-6 text-[var(--ink-soft)] tabular-nums">{star}★</span>
              <span
                className="relative block h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-alt)]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={count}
                aria-valuenow={value}
                aria-label={`${value} ${star}-star reviews`}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-8 text-right text-[var(--muted)] tabular-nums">{value}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ReviewStats;
