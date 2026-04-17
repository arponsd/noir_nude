import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps {
  /** Uppercase tracked label displayed at the top of the card. */
  label: string;
  /** Primary value (pre-formatted — use formatBDT for money). */
  value: string;
  /** Optional delta percentage. Positive → green up arrow, negative → red down arrow. */
  delta?: number;
  /** Optional footnote shown under the value (e.g. "vs. last week"). */
  footnote?: string;
  className?: string;
}

/**
 * Dashboard stat card. Server component.
 * Displays an UPPERCASE label, a large display value, an optional delta with directional
 * arrow, and an optional footnote. Uses `tabular-nums` on numeric chrome.
 */
export default function StatCard({ label, value, delta, footnote, className }: StatCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const isUp = hasDelta && delta! >= 0;
  const deltaLabel = hasDelta ? `${isUp ? "+" : ""}${delta!.toFixed(1)}%` : null;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">{label}</p>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-3xl tracking-[-0.02em] text-[var(--ink)] tabular-nums">
          {value}
        </p>
        {deltaLabel ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
              isUp
                ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
            )}
            aria-label={`${isUp ? "Up" : "Down"} ${Math.abs(delta!).toFixed(1)} percent`}
          >
            {isUp ? (
              <ArrowUpRight className="size-3" strokeWidth={1.8} aria-hidden />
            ) : (
              <ArrowDownRight className="size-3" strokeWidth={1.8} aria-hidden />
            )}
            {deltaLabel}
          </span>
        ) : null}
      </div>
      {footnote ? <p className="text-xs text-[var(--ink-soft)]">{footnote}</p> : null}
    </article>
  );
}
