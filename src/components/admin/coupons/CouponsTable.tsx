import Link from "next/link";
import { format } from "date-fns";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

// TODO(backend): expose AdminCouponRow from `@/types/api/coupon` once admin DTO lands.
export interface AdminCouponRow {
  id: string;
  code: string;
  type: "percent" | "flat" | "free_shipping";
  /** For percent: basis-points-ish 0–100; for flat: paisa; for free_shipping: ignored. */
  value: number;
  usageCount: number;
  usageLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CouponsTableProps {
  coupons: AdminCouponRow[];
  className?: string;
}

function formatValue(c: AdminCouponRow) {
  if (c.type === "percent") return `${c.value}%`;
  if (c.type === "flat") return formatBDT(c.value);
  return "Free shipping";
}

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

function statusOf(c: AdminCouponRow): { label: string; tone: "ok" | "muted" | "warn" | "bad" } {
  const now = Date.now();
  if (!c.isActive) return { label: "Disabled", tone: "muted" };
  if (new Date(c.validFrom).getTime() > now) return { label: "Scheduled", tone: "warn" };
  if (new Date(c.validUntil).getTime() < now) return { label: "Expired", tone: "bad" };
  if (c.usageLimit !== undefined && c.usageCount >= c.usageLimit)
    return { label: "Exhausted", tone: "bad" };
  return { label: "Active", tone: "ok" };
}

/**
 * Admin coupons table. Server component.
 * Columns: code, type, value, usage (n / limit), status pill, validity window, edit link.
 */
export default function CouponsTable({ coupons, className }: CouponsTableProps) {
  if (coupons.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-[var(--muted)]">No coupons yet.</p>
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
                Code
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Value
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Usage
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Window
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {coupons.map((c) => {
              const s = statusOf(c);
              const toneClass: Record<typeof s.tone, string> = {
                ok: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
                muted: "border-[var(--line)] text-[var(--muted)]",
                warn: "border-[var(--warn)]/30 bg-[var(--warn)]/10 text-[var(--warn)]",
                bad: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
              };
              return (
                <tr key={c.id} className="hover:bg-[var(--bg-alt)]/30">
                  <td className="px-4 py-3 font-mono text-[var(--ink)] tabular-nums">{c.code}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)] capitalize">
                    {c.type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--ink)] tabular-nums">
                    {formatValue(c)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--ink-soft)] tabular-nums">
                    {c.usageCount}
                    {c.usageLimit !== undefined ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)] tabular-nums">
                    {formatDate(c.validFrom)} – {formatDate(c.validUntil)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        toneClass[s.tone],
                      )}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/coupons/${c.id}`}
                      className="text-xs text-[var(--accent)] hover:underline"
                      aria-label={`Edit coupon ${c.code}`}
                    >
                      Edit →
                    </Link>
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
