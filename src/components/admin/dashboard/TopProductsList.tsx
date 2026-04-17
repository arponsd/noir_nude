import Link from "next/link";
import Image from "next/image";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface TopProduct {
  id: string;
  slug: string;
  name: string;
  thumbUrl?: string;
  unitsSold: number;
  /** Revenue in paisa. */
  revenue: number;
}

export interface TopProductsListProps {
  products: TopProduct[];
  className?: string;
  /** Heading rendered above the list. */
  title?: string;
}

/**
 * Ranked list of best-selling products. Server component.
 * Each row shows a thumbnail, product name (linked to admin edit), units sold, and revenue.
 */
export default function TopProductsList({
  products,
  className,
  title = "Top products",
}: TopProductsListProps) {
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
        <span className="text-xs text-[var(--muted)] tabular-nums">{products.length} items</span>
      </header>
      {products.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[var(--muted)]">No sales yet.</p>
      ) : (
        <ol className="divide-y divide-[var(--line)]">
          {products.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-5 text-xs text-[var(--muted)] tabular-nums">{i + 1}</span>
              <div className="relative size-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-alt)]">
                {p.thumbUrl ? (
                  <Image src={p.thumbUrl} alt="" fill sizes="40px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/products/${p.slug}`}
                  className="block truncate text-sm text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  {p.name}
                </Link>
                <p className="text-xs text-[var(--muted)] tabular-nums">
                  {p.unitsSold.toLocaleString()} sold
                </p>
              </div>
              <span className="font-display text-sm text-[var(--ink)] tabular-nums">
                {formatBDT(p.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
