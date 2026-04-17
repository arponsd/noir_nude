import Link from "next/link";
import { Plus } from "lucide-react";
import CouponsTable, { type AdminCouponRow } from "@/components/admin/coupons/CouponsTable";
import { Button } from "@/components/ui/button";
import { listCouponsService } from "@/lib/services/admin-coupon";
import { cn } from "@/lib/utils/cn";
import type { CouponSummary } from "@/types/api/admin-coupons";

export const metadata = { title: "Coupons — Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function toRow(c: CouponSummary): AdminCouponRow {
  // Service uses {percentage, fixed, free_shipping}; table expects {percent, flat, free_shipping}.
  const type: AdminCouponRow["type"] =
    c.type === "percentage" ? "percent" : c.type === "fixed" ? "flat" : "free_shipping";
  const row: AdminCouponRow = {
    id: c.id,
    code: c.code,
    type,
    value: c.value,
    usageCount: c.usedCount,
    validFrom: c.validFrom,
    validUntil: c.validUntil,
    isActive: c.isActive,
  };
  if (c.usageLimit !== undefined) row.usageLimit = c.usageLimit;
  return row;
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const activeOnly = sp.activeOnly !== "0";

  const listing = await listCouponsService({
    page,
    limit: PAGE_SIZE,
    includeInactive: !activeOnly,
  });

  const rows = listing.items.map(toRow);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Coupons</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)] tabular-nums">
            {listing.total.toLocaleString()} total
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/coupons/new">
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            New coupon
          </Link>
        </Button>
      </header>

      <nav aria-label="Filter" className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/coupons"
          aria-current={activeOnly ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            activeOnly
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
          )}
        >
          Active only
        </Link>
        <Link
          href="/admin/coupons?activeOnly=0"
          aria-current={!activeOnly ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            !activeOnly
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
          )}
        >
          Include inactive
        </Link>
      </nav>

      <CouponsTable coupons={rows} />

      {listing.totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="secondary" size="sm" aria-disabled={page <= 1}>
            <Link
              href={`/admin/coupons?page=${Math.max(1, page - 1)}${activeOnly ? "" : "&activeOnly=0"}`}
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
              href={`/admin/coupons?page=${page + 1}${activeOnly ? "" : "&activeOnly=0"}`}
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
