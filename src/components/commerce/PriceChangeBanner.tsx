import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PriceChangeBannerProps {
  /** Anchor id for the "Review changes" link target. Defaults to "cart-items". */
  anchorId?: string;
  className?: string;
}

export default function PriceChangeBanner({
  anchorId = "cart-items",
  className,
}: PriceChangeBannerProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--warn)]/30 bg-[var(--warn)]/10 px-4 py-3 text-sm text-[var(--warn)]",
        className,
      )}
    >
      <AlertTriangle className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <p className="flex-1 text-[var(--ink)]">
        <span className="font-medium">Some item prices changed</span> since you added them — review
        before checkout.
      </p>
      <a
        href={`#${anchorId}`}
        className="font-medium text-[var(--warn)] underline-offset-4 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
      >
        Review changes
      </a>
    </div>
  );
}
