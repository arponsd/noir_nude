import Link from "next/link";
import CustomersTable from "@/components/admin/customers/CustomersTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listCustomersService } from "@/lib/services/admin-customer";

export const metadata = { title: "Customers — Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined;
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const listing = await listCustomersService({
    ...(q ? { q } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const rows = listing.items.map((c) => {
    const row: {
      id: string;
      name: string;
      email: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderAt?: string;
    } = {
      id: c.id,
      name: c.name,
      email: c.email,
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
    };
    if (c.lastOrderAt) row.lastOrderAt = c.lastOrderAt;
    return row;
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Customers</h1>
        <p className="text-sm text-[var(--ink-soft)] tabular-nums">
          {listing.total.toLocaleString()} total
        </p>
      </header>

      <form
        action="/admin/customers"
        method="get"
        className="flex items-center gap-2"
        role="search"
      >
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or email…"
          className="max-w-md"
          aria-label="Search customers"
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      <CustomersTable customers={rows} />

      {listing.totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="secondary" size="sm" aria-disabled={page <= 1}>
            <Link
              href={`/admin/customers?${new URLSearchParams({
                ...(q ? { q } : {}),
                page: String(Math.max(1, page - 1)),
              }).toString()}`}
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
              href={`/admin/customers?${new URLSearchParams({
                ...(q ? { q } : {}),
                page: String(page + 1),
              }).toString()}`}
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
