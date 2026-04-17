import Link from "next/link";
import { format } from "date-fns";
import type { OrderSummary } from "@/types/api/order";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import StatusPill from "./StatusPill";

export interface OrderCardProps {
  order: OrderSummary;
  className?: string;
}

function formatPlacedAt(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export default function OrderCard({ order, className }: OrderCardProps) {
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className={cn(
        "group flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-md)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none",
        className,
      )}
      aria-label={`Order ${order.orderNumber} placed ${formatPlacedAt(order.placedAt)}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-mono text-sm text-[var(--ink)] tabular-nums">#{order.orderNumber}</p>
        <p className="text-xs text-[var(--muted)]">Placed {formatPlacedAt(order.placedAt)}</p>
      </div>

      <div className="flex items-center gap-2">
        <StatusPill status={order.orderStatus} />
      </div>

      <div className="flex items-center gap-6 text-sm">
        <span className="text-[var(--ink-soft)] tabular-nums">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </span>
        <span className="font-display text-lg text-[var(--ink)] tabular-nums">
          {formatBDT(order.total)}
        </span>
      </div>
    </Link>
  );
}
