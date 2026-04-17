import Link from "next/link";
import AdminOrdersTable from "@/components/admin/orders/AdminOrdersTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { listAdminOrdersService } from "@/lib/services/admin-order";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Orders — Admin" };
export const dynamic = "force-dynamic";

const STATUS_CHIPS: readonly (OrderStatus | "all")[] = ["all", ...ORDER_STATUSES] as const;

const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function parseStatus(sp: SearchParams): OrderStatus | undefined {
  const raw = typeof sp.status === "string" ? sp.status : undefined;
  if (!raw) return undefined;
  return (ORDER_STATUSES as readonly string[]).includes(raw) ? (raw as OrderStatus) : undefined;
}

function buildHref(base: string, params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === null) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = parseStatus(sp);
  const q = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined;
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const listing = await listAdminOrdersService({
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const rows = listing.items.map((o) => ({
    ...o,
    customerName: o.customerName ?? (o.isGuest ? "Guest" : (o.customerEmail.split("@")[0] ?? "")),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Orders</h1>
        <p className="text-sm text-[var(--ink-soft)] tabular-nums">
          {listing.total.toLocaleString()} total
        </p>
      </header>

      <nav aria-label="Filter by status" className="flex flex-wrap items-center gap-2">
        {STATUS_CHIPS.map((s) => {
          const active = (s === "all" && !status) || s === status;
          const href = buildHref("/admin/orders", {
            ...(s !== "all" ? { status: s } : {}),
            ...(q ? { q } : {}),
          });
          return (
            <Link
              key={s}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs tracking-[0.02em] capitalize transition-colors",
                active
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
              )}
            >
              {s}
            </Link>
          );
        })}
      </nav>

      <form action="/admin/orders" method="get" className="flex items-center gap-2" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search order number or customer email…"
          className="max-w-md"
          aria-label="Search orders"
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      <AdminOrdersTable orders={rows} />

      {listing.totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="secondary" size="sm" aria-disabled={page <= 1}>
            <Link
              href={buildHref("/admin/orders", {
                ...(status ? { status } : {}),
                ...(q ? { q } : {}),
                page: Math.max(1, page - 1),
              })}
              className={page <= 1 ? "pointer-events-none opacity-40" : undefined}
            >
              ← Previous
            </Link>
          </Button>
          <span className="text-sm text-[var(--ink-soft)] tabular-nums">
            Page {page} of {listing.totalPages}
          </span>
          <Button asChild variant="secondary" size="sm" aria-disabled={page >= listing.totalPages}>
            <Link
              href={buildHref("/admin/orders", {
                ...(status ? { status } : {}),
                ...(q ? { q } : {}),
                page: page + 1,
              })}
              className={page >= listing.totalPages ? "pointer-events-none opacity-40" : undefined}
            >
              Next →
            </Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
