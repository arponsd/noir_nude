import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import OrderCard from "@/components/commerce/OrderCard";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listUserOrders } from "@/lib/services/order";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Orders" };
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

interface SearchParamsShape {
  status?: string;
}

function parseStatus(raw: string | undefined): OrderStatus | undefined {
  if (!raw) return undefined;
  return (ORDER_STATUSES as readonly string[]).includes(raw) ? (raw as OrderStatus) : undefined;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account/orders");

  const sp = await searchParams;
  const status = parseStatus(sp.status);

  const page = await listUserOrders(session.user.id, { ...(status ? { status } : {}) });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Orders</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          {page.total === 0
            ? "No orders yet."
            : `${page.total} ${page.total === 1 ? "order" : "orders"} so far.`}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="All" href="/account/orders" active={!status} />
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABELS[s]}
            href={`/account/orders?status=${s}`}
            active={status === s}
          />
        ))}
      </div>

      {page.items.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center"
        >
          <p className="font-display text-xl text-[var(--ink)]">No orders to show</p>
          <p className="max-w-sm text-sm text-[var(--ink-soft)]">
            When you place an order, it&apos;ll appear here. Ready to pick something out?
          </p>
          <Button asChild size="sm">
            <Link href="/shop">Browse products</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {page.items.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em] transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--ink)] hover:text-[var(--ink)]",
      )}
    >
      {label}
    </Link>
  );
}
