import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface PriceBlockProps {
  basePrice: number;
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PriceBlock({
  basePrice,
  comparePrice,
  size = "md",
  className,
}: PriceBlockProps) {
  const hasCompare = typeof comparePrice === "number" && comparePrice > basePrice;
  const percentOff = hasCompare
    ? Math.round(((comparePrice! - basePrice) / comparePrice!) * 100)
    : 0;

  const currentSize =
    size === "lg" ? "text-xl font-semibold" : size === "sm" ? "text-sm" : "text-base font-medium";
  const compareSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("text-[var(--ink)] tabular-nums", currentSize)}>
        {formatBDT(basePrice)}
      </span>
      {hasCompare ? (
        <>
          <span
            className={cn("text-[var(--muted)] tabular-nums line-through", compareSize)}
            aria-label="Original price"
          >
            {formatBDT(comparePrice!)}
          </span>
          <span
            className={cn(
              "rounded-sm bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--accent)] uppercase",
            )}
            aria-label={`${percentOff} percent off`}
          >
            -{percentOff}%
          </span>
        </>
      ) : null}
    </div>
  );
}
