import type { OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface StatusPillProps {
  status: OrderStatus;
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

// reason: token-driven pill backgrounds — stays in sync with design-system palette.
const STYLES: Record<OrderStatus, string> = {
  placed: "bg-[var(--bg-alt)] text-[var(--ink-soft)] border-[var(--line)]",
  confirmed: "bg-[var(--ink)]/5 text-[var(--ink)] border-[var(--ink)]/10",
  packed: "bg-[var(--warn)]/10 text-[var(--warn)] border-[var(--warn)]/30",
  shipped: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30",
  delivered: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
  cancelled: "bg-[var(--bg-alt)] text-[var(--muted)] border-[var(--line)]",
  returned: "bg-[var(--warn)]/10 text-[var(--warn)] border-[var(--warn)]/30",
};

export default function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-[0.02em]",
        STYLES[status],
        className,
      )}
      aria-label={`Order status: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
