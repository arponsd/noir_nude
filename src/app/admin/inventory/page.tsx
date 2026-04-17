import Link from "next/link";
import InventoryTable from "@/components/admin/inventory/InventoryTable";
import { cn } from "@/lib/utils/cn";
import { listLowStockService } from "@/lib/services/admin-inventory";

export const metadata = { title: "Inventory — Admin" };
export const dynamic = "force-dynamic";

const PRESET_THRESHOLDS = [5, 10, 25, 50] as const;

function parseThreshold(raw: unknown): number {
  const n = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 0) return 5;
  return Math.min(Math.floor(n), 10_000);
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const threshold = parseThreshold(sp.threshold);

  const rows = await listLowStockService(threshold, 100);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Inventory</h1>
        <p className="text-sm text-[var(--ink-soft)] tabular-nums">
          {rows.length.toLocaleString()} variant{rows.length === 1 ? "" : "s"} at or below{" "}
          {threshold} units
        </p>
      </header>

      <nav aria-label="Low-stock threshold" className="flex flex-wrap items-center gap-2">
        <span className="text-xs tracking-[0.08em] text-[var(--muted)] uppercase">Threshold</span>
        {PRESET_THRESHOLDS.map((t) => {
          const active = t === threshold;
          return (
            <Link
              key={t}
              href={`/admin/inventory?threshold=${t}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs tabular-nums transition-colors",
                active
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
              )}
            >
              ≤ {t}
            </Link>
          );
        })}
      </nav>

      <InventoryTable
        rows={rows.map((r) => ({
          productId: r.productId,
          productSlug: r.productSlug,
          productName: r.productName,
          variantId: r.variantId,
          variantName: r.variantName,
          sku: "",
          stock: r.stock,
          reservedStock: r.reservedStock,
          threshold,
        }))}
      />
    </div>
  );
}
