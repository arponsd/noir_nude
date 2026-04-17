import type { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const LABELS: Record<UserRole, string> = {
  customer: "Customer",
  admin: "Admin",
  manager: "Manager",
  support: "Support",
};

// Token-driven palette for role pills — matches status pill visual weight.
const STYLES: Record<UserRole, string> = {
  customer: "bg-[var(--bg-alt)] text-[var(--ink-soft)] border-[var(--line)]",
  admin: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30",
  manager: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
  support: "bg-[var(--warn)]/10 text-[var(--warn)] border-[var(--warn)]/30",
};

/**
 * RBAC role pill. Server component.
 */
export default function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-[0.02em]",
        STYLES[role],
        className,
      )}
      aria-label={`Role: ${LABELS[role]}`}
    >
      {LABELS[role]}
    </span>
  );
}
