import { format } from "date-fns";
import StatusPill from "@/components/commerce/StatusPill";
import MaskedEmail from "./MaskedEmail";
import RoleBadge from "@/components/admin/roles/RoleBadge";
import { formatBDT } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import type { OrderSummary } from "@/types/api/order";
import Link from "next/link";

// TODO(backend): replace with `AdminCustomerProfile` export from `@/types/api/user`.
export interface AdminCustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  loyaltyPoints: number;
  tier: string;
  totalOrders: number;
  /** Lifetime spend in paisa. */
  totalSpent: number;
  createdAt: string;
}

export interface CustomerDetailViewProps {
  customer: AdminCustomerProfile;
  recentOrders: OrderSummary[];
}

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

/**
 * Admin customer detail — profile header, stat cards, recent orders list.
 * Server component.
 */
export default function CustomerDetailView({ customer, recentOrders }: CustomerDetailViewProps) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl tracking-[-0.02em] text-[var(--ink)]">
              {customer.name}
            </h1>
            <RoleBadge role={customer.role} />
          </div>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            <MaskedEmail email={customer.email} />
          </p>
          {customer.phone ? (
            <p className="mt-0.5 text-sm text-[var(--ink-soft)] tabular-nums">{customer.phone}</p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--muted)]">
            Joined {formatDate(customer.createdAt)}
            {customer.emailVerified ? " · Email verified" : " · Email unverified"}
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
            Orders
          </p>
          <p className="font-display mt-2 text-2xl tracking-[-0.02em] tabular-nums">
            {customer.totalOrders}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
            Lifetime spend
          </p>
          <p className="font-display mt-2 text-2xl tracking-[-0.02em] tabular-nums">
            {formatBDT(customer.totalSpent)}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
            Loyalty
          </p>
          <p className="font-display mt-2 text-2xl tracking-[-0.02em] tabular-nums">
            {customer.loyaltyPoints.toLocaleString()} pts
          </p>
          <p className="mt-1 text-xs text-[var(--ink-soft)] capitalize">{customer.tier} tier</p>
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
          <h2 className="font-display text-base tracking-[-0.01em]">Recent orders</h2>
          <span className="text-xs text-[var(--muted)] tabular-nums">{recentOrders.length}</span>
        </header>
        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--muted)]">
            No orders from this customer yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-mono text-sm text-[var(--ink)] tabular-nums hover:text-[var(--accent)]"
                >
                  #{o.orderNumber}
                </Link>
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {formatDate(o.placedAt)}
                </span>
                <StatusPill status={o.orderStatus} />
                <span className="font-display text-sm text-[var(--ink)] tabular-nums">
                  {formatBDT(o.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
