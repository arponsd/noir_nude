import Link from "next/link";
import AdjustStockCell from "./AdjustStockCell";
import { cn } from "@/lib/utils/cn";

export interface InventoryRow {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  stock: number;
  reservedStock: number;
  /** Optional per-variant low-stock threshold. Defaults to 5. */
  threshold?: number;
}

export interface InventoryTableProps {
  rows: InventoryRow[];
  className?: string;
}

/**
 * Flat inventory table — one row per variant. Server component.
 * Inline `AdjustStockCell` popover handles the write path.
 */
export default function InventoryTable({ rows, className }: InventoryTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-[var(--muted)]">No low-stock variants right now.</p>
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
                Product
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Variant
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                SKU
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Stock
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Reserved
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Adjust</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((r) => {
              const threshold = r.threshold ?? 5;
              const out = r.stock === 0;
              const low = !out && r.stock <= threshold;
              return (
                <tr key={r.variantId} className="hover:bg-[var(--bg-alt)]/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${r.productSlug}`}
                      className="text-[var(--ink)] hover:text-[var(--accent)]"
                    >
                      {r.productName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{r.variantName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)] tabular-nums">
                    {r.sku}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
                        out &&
                          "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
                        low && "border-[var(--warn)]/30 bg-[var(--warn)]/10 text-[var(--warn)]",
                        !out && !low && "border-[var(--line)] text-[var(--ink-soft)]",
                      )}
                    >
                      {r.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--ink-soft)] tabular-nums">
                    {r.reservedStock}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AdjustStockCell
                      productId={r.productId}
                      variantId={r.variantId}
                      currentStock={r.stock}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
