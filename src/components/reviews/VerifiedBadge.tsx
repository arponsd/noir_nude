import * as React from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface VerifiedBadgeProps {
  className?: string;
  label?: string;
}

/**
 * Small inline chip used in review cards to mark a verified-buyer review.
 * Server-safe.
 */
export function VerifiedBadge({ className, label = "Verified buyer" }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-[11px] font-medium tracking-[0.02em] text-[var(--success)]",
        className,
      )}
    >
      <BadgeCheck className="size-3.5" strokeWidth={1.5} aria-hidden />
      {label}
    </span>
  );
}

export default VerifiedBadge;
