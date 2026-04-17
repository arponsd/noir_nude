import Link from "next/link";
import { format } from "date-fns";
import StatusPill from "@/components/commerce/StatusPill";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { OrderSummary } from "@/types/api/order";

// TODO(backend): move to `@/types/api/order` once admin listing DTO is published.
export interface AdminOrderRow extends OrderSummary {
  customerName: string;
  customerEmail: string;
}

export interface AdminOrdersTableProps {
  orders: AdminOrderRow[];
  className?: string;
}

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy · HH:mm");
  } catch {
    return iso;
  }
}

/**
 * Admin orders table. Server component.
 * Dense row layout with order#, customer, placed-at, status pill, total, and detail link.
 * Empty state rendered when `orders` is empty.
 */
export default function AdminOrdersTable({ orders, className }: AdminOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-[var(--muted)]">No orders match the current filters.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[var(--bg-alt)]/60 text-left text-xs tracking-[0.08em] text-[var(--ink-soft)] uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Order
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Customer
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Placed
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Total
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-[var(--bg-alt)]/30">
                <td className="px-4 py-3 font-mono text-[var(--ink)] tabular-nums">
                  #{o.orderNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-[var(--ink)]">{o.customerName}</span>
                    <span className="text-xs text-[var(--muted)]">{o.customerEmail}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)] tabular-nums">
                  {formatDate(o.placedAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={o.orderStatus} />
                </td>
                <td className="font-display px-4 py-3 text-right text-[var(--ink)] tabular-nums">
                  {formatBDT(o.total)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-xs text-[var(--accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
                    aria-label={`View order ${o.orderNumber}`}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
