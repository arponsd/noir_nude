import Link from "next/link";
import { format } from "date-fns";
import MaskedEmail from "./MaskedEmail";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

// TODO(backend): move to `@/types/api/user` as AdminCustomerRow once the DTO ships.
export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  /** Lifetime spend in paisa. */
  totalSpent: number;
  lastOrderAt?: string;
}

export interface CustomersTableProps {
  customers: AdminCustomerRow[];
  className?: string;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

/**
 * Customers table. Server component (except for the MaskedEmail cell, which is a leaf client).
 */
export default function CustomersTable({ customers, className }: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-[var(--muted)]">No customers match this filter.</p>
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
                Name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Orders
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Spent
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Last order
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Detail</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-[var(--bg-alt)]/30">
                <td className="px-4 py-3 text-[var(--ink)]">{c.name}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">
                  <MaskedEmail email={c.email} />
                </td>
                <td className="px-4 py-3 text-right text-[var(--ink-soft)] tabular-nums">
                  {c.totalOrders}
                </td>
                <td className="font-display px-4 py-3 text-right text-[var(--ink)] tabular-nums">
                  {formatBDT(c.totalSpent)}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] tabular-nums">
                  {formatDate(c.lastOrderAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="text-xs text-[var(--accent)] hover:underline"
                    aria-label={`View customer ${c.name}`}
                  >
                    Detail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
