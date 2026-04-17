import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface FreeShippingBarProps {
  subtotal: number;
  threshold: number;
  eligible: boolean;
  className?: string;
}

export default function FreeShippingBar({
  subtotal,
  threshold,
  eligible,
  className,
}: FreeShippingBarProps) {
  const remaining = Math.max(threshold - subtotal, 0);
  const pct = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 0;

  return (
    <div className={cn("flex flex-col gap-2", className)} aria-live="polite">
      <p className="text-xs tracking-[0.02em] text-[var(--ink-soft)]">
        {eligible ? (
          <span className="text-[var(--success)]">You&apos;ve unlocked free shipping</span>
        ) : (
          <>
            Add <span className="text-[var(--ink)] tabular-nums">{formatBDT(remaining)}</span> more
            for free shipping
          </>
        )}
      </p>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--line)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={eligible ? 100 : pct}
      >
        <div
          className={cn(
            "h-full transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
            eligible ? "bg-[var(--success)]" : "bg-[var(--accent)]",
          )}
          style={{ width: `${eligible ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
