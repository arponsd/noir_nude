import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface LowStockRow {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  stock: number;
  /** Threshold for low-stock flag (used to render amber vs red). Defaults to 5. */
  threshold?: number;
}

export interface LowStockListProps {
  items: LowStockRow[];
  className?: string;
  title?: string;
}

/**
 * Low-stock variants list. Server component.
 * Variants at 0 stock get a red badge; anything else at/below threshold gets amber.
 */
export default function LowStockList({ items, className, title = "Low stock" }: LowStockListProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
      aria-label={title}
    >
      <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
        <h3 className="font-display text-base tracking-[-0.01em] text-[var(--ink)]">{title}</h3>
        <Link href="/admin/inventory" className="text-xs text-[var(--accent)] hover:underline">
          View all
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[var(--muted)]">
          Everything is well stocked.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {items.map((row) => {
            const out = row.stock === 0;
            return (
              <li
                key={`${row.productId}-${row.variantId}`}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${row.productSlug}`}
                    className="block truncate text-sm text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    {row.productName}
                  </Link>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {row.variantName}
                    <span className="mx-1.5 opacity-60">·</span>
                    <span className="font-mono tabular-nums">{row.sku}</span>
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
                    out
                      ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
                      : "border-[var(--warn)]/30 bg-[var(--warn)]/10 text-[var(--warn)]",
                  )}
                >
                  {out ? "Out" : `${row.stock} left`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
