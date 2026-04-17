import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils/cn";

// TODO(backend): unify with `ActivityLogEntry` from `@/types/api/activity` when published.
export interface ActivityRowData {
  id: string;
  /** e.g. "order.status_changed", "coupon.created", "banner.reordered". */
  event: string;
  /** Human-readable summary — backend-formatted. */
  summary: string;
  actorName: string;
  actorRole?: string;
  entityLabel?: string;
  /** Optional internal admin deep-link. */
  entityHref?: string;
  entityType?: string;
  createdAt: string;
}

export interface ActivityRowProps {
  item: ActivityRowData;
  className?: string;
}

function formatRelative(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

/**
 * Single row in the admin activity feed. Server component.
 */
export default function ActivityRow({ item, className }: ActivityRowProps) {
  return (
    <li className={cn("flex flex-wrap items-start justify-between gap-3 px-5 py-3", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--ink)]">
          <span className="font-medium">{item.actorName}</span>
          <span className="mx-1.5 text-[var(--muted)]">·</span>
          <span className="font-mono text-xs text-[var(--accent)]">{item.event}</span>
        </p>
        <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{item.summary}</p>
        {item.entityLabel ? (
          item.entityHref ? (
            <Link
              href={item.entityHref}
              className="mt-0.5 inline-block text-xs text-[var(--accent)] hover:underline"
            >
              {item.entityLabel} →
            </Link>
          ) : (
            <span className="mt-0.5 inline-block text-xs text-[var(--muted)]">
              {item.entityLabel}
            </span>
          )
        ) : null}
      </div>
      <time dateTime={item.createdAt} className="shrink-0 text-xs text-[var(--muted)] tabular-nums">
        {formatRelative(item.createdAt)}
      </time>
    </li>
  );
}
