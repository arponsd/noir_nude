import Link from "next/link";
import ActivityFeed from "@/components/admin/activity/ActivityFeed";
import type { ActivityRowData } from "@/components/admin/activity/ActivityRow";
import { Button } from "@/components/ui/button";
import { listActivityService } from "@/lib/services/admin-activity";
import type { ActivityLogEntry } from "@/types/api/activity-log";

export const metadata = { title: "Activity — Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const ENTITY_TYPES = ["order", "product", "coupon", "banner", "review", "user"] as const;

function hrefForEntity(entity: string, entityId: string): string | undefined {
  // Deep-link into the admin UI when we have a known entity type.
  if (entity === "order") return `/admin/orders/${entityId}`;
  if (entity === "product") return `/admin/products/${entityId}`;
  if (entity === "coupon") return `/admin/coupons/${entityId}`;
  if (entity === "user") return `/admin/customers/${entityId}`;
  return undefined;
}

function toRow(e: ActivityLogEntry): ActivityRowData {
  const row: ActivityRowData = {
    id: e.id,
    event: e.event,
    summary: e.summary,
    // Service doesn't resolve actor names yet — fall back to a short actorId slug.
    actorName: `${e.actorRole} · ${e.actorId.slice(-6)}`,
    actorRole: e.actorRole,
    entityType: e.entity,
    entityLabel: e.entityId ? `${e.entity} ${e.entityId.slice(-6)}` : undefined,
    entityHref: hrefForEntity(e.entity, e.entityId),
    createdAt: e.createdAt,
  };
  return row;
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const entity =
    typeof sp.entity === "string" && (ENTITY_TYPES as readonly string[]).includes(sp.entity)
      ? sp.entity
      : undefined;
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const listing = await listActivityService({
    ...(entity ? { entity } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const rows = listing.items.map(toRow);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Activity</h1>
        <p className="text-sm text-[var(--ink-soft)] tabular-nums">
          {listing.total.toLocaleString()} events
        </p>
      </header>

      <ActivityFeed items={rows} entityTypes={[...ENTITY_TYPES]} />

      {listing.totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="secondary" size="sm" aria-disabled={page <= 1}>
            <Link
              href={`/admin/activity?${new URLSearchParams({
                ...(entity ? { entity } : {}),
                page: String(Math.max(1, page - 1)),
              }).toString()}`}
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
              href={`/admin/activity?${new URLSearchParams({
                ...(entity ? { entity } : {}),
                page: String(page + 1),
              }).toString()}`}
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
