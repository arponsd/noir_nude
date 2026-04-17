import { format } from "date-fns";
import type { OrderStatusHistoryEntry } from "@/types/api/order";
import type { OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface OrderTimelineProps {
  history: OrderStatusHistoryEntry[];
  currentStatus: OrderStatus;
  className?: string;
}

const LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

function formatWhen(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return iso;
  }
}

export default function OrderTimeline({ history, currentStatus, className }: OrderTimelineProps) {
  // reason: newest last matches "top-to-bottom progress" reading order; backend sends chronological.
  const entries = [...history].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  return (
    <ol className={cn("relative flex flex-col gap-5 pl-6", className)}>
      <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-[var(--line)]" />
      {entries.map((entry, idx) => {
        const isCurrent = entry.status === currentStatus && idx === entries.length - 1;
        const isPast = idx < entries.length - 1;
        return (
          <li
            key={`${entry.status}-${entry.changedAt}-${idx}`}
            aria-current={isCurrent ? "step" : undefined}
            className="relative"
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-1 -left-6 inline-flex size-4 items-center justify-center rounded-full border-2 bg-[var(--surface)]",
                isCurrent
                  ? "border-[var(--accent)]"
                  : isPast
                    ? "border-[var(--ink-soft)]"
                    : "border-[var(--line)]",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isCurrent
                    ? "bg-[var(--accent)]"
                    : isPast
                      ? "bg-[var(--ink-soft)]"
                      : "bg-transparent",
                )}
              />
            </span>
            <div className="flex flex-col gap-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  isCurrent
                    ? "text-[var(--ink)]"
                    : isPast
                      ? "text-[var(--ink-soft)]"
                      : "text-[var(--muted)]",
                )}
              >
                {LABELS[entry.status]}
              </p>
              <p className="text-xs text-[var(--muted)] tabular-nums">
                {formatWhen(entry.changedAt)}
              </p>
              {entry.note ? <p className="text-xs text-[var(--ink-soft)]">{entry.note}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
