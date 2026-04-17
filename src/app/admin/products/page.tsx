import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/constants";
import { adminListProducts } from "@/lib/services/admin-product";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Products — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const listing = await adminListProducts({
    page,
    limit: 24,
    includeInactive: true,
    includeDeleted: false,
    ...(q ? { q } : {}),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Products</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)] tabular-nums">
            {listing.total.toLocaleString()} total
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            New product
          </Link>
        </Button>
      </header>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--bg-alt)]/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium tracking-[0.02em]">Name</th>
              <th className="px-4 py-3 font-medium tracking-[0.02em]">Brand</th>
              <th className="px-4 py-3 font-medium tracking-[0.02em]">Price</th>
              <th className="px-4 py-3 font-medium tracking-[0.02em]">Active</th>
              <th className="px-4 py-3 font-medium tracking-[0.02em]">Featured</th>
              <th className="px-4 py-3 font-medium tracking-[0.02em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listing.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--ink-soft)]">
                  No products yet.
                </td>
              </tr>
            ) : (
              listing.items.map((p) => (
                <tr key={p.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--ink)]">{p.name}</div>
                    <div className="text-xs text-[var(--muted)] tabular-nums">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{p.brand}</td>
                  <td className="px-4 py-3 tabular-nums">{formatBDT(p.basePrice)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        p.isActive
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : "bg-[var(--muted)]/20 text-[var(--ink-soft)]",
                      )}
                    >
                      {p.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        p.isFeatured
                          ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "bg-[var(--muted)]/20 text-[var(--ink-soft)]",
                      )}
                    >
                      {p.isFeatured ? "Featured" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/products/${p.id}`}>
                          <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
                          Edit
                        </Link>
                      </Button>
                      <DeleteProductButton productId={p.id} productName={p.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {listing.totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="secondary" size="sm" aria-disabled={page <= 1}>
            <Link
              href={`/admin/products?page=${Math.max(1, page - 1)}`}
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
              href={`/admin/products?page=${page + 1}`}
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
