"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ActivityRow, { type ActivityRowData } from "./ActivityRow";
import { cn } from "@/lib/utils/cn";

export interface ActivityFeedProps {
  items: ActivityRowData[];
  /** Unique entity types available as filter chips. */
  entityTypes?: string[];
  className?: string;
}

/**
 * Chronological admin activity feed with entity-type filter chips.
 * The filter chip selection writes to `?entity=` so server lists are the source of truth;
 * the client component only handles the URL mutation (no client-side filtering fallback,
 * to avoid confusion between filtered-server and filtered-client states).
 */
export default function ActivityFeed({ items, entityTypes = [], className }: ActivityFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams?.get("entity") ?? null;

  const setEntity = (value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value === null) params.delete("entity");
    else params.set("entity", value);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  };

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
      aria-label="Activity feed"
    >
      {entityTypes.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-5 py-3"
          role="group"
          aria-label="Filter by entity"
        >
          <button
            type="button"
            onClick={() => setEntity(null)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              active === null
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
            )}
            aria-pressed={active === null}
          >
            All
          </button>
          {entityTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEntity(t)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                active === t
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
              )}
              aria-pressed={active === t}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
          No activity recorded yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {items.map((i) => (
            <ActivityRow key={i.id} item={i} />
          ))}
        </ul>
      )}
    </section>
  );
}
