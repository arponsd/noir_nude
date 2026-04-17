"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { adminReorderBannersAction } from "@/lib/actions/admin-banner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/cn";

// TODO(backend): surface from `@/types/api/banner` once the DTO ships.
export interface AdminBannerRow {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href?: string;
  cta?: string;
  order: number;
  publishFrom?: string;
  publishUntil?: string;
  isActive: boolean;
}

export interface BannersGridProps {
  banners: AdminBannerRow[];
  /** Invoked when the user clicks the Edit affordance on a card. */
  onEdit?: (banner: AdminBannerRow) => void;
  className?: string;
}

function now() {
  return Date.now();
}

function publishState(b: AdminBannerRow): { label: string; tone: "ok" | "muted" | "warn" | "bad" } {
  if (!b.isActive) return { label: "Draft", tone: "muted" };
  const t = now();
  if (b.publishFrom && new Date(b.publishFrom).getTime() > t)
    return { label: "Scheduled", tone: "warn" };
  if (b.publishUntil && new Date(b.publishUntil).getTime() < t)
    return { label: "Expired", tone: "bad" };
  return { label: "Live", tone: "ok" };
}

/**
 * Grid of banner cards with up/down reorder controls. Client (needs routing + toasts),
 * but each card is static aside from the two arrow buttons. Reordering sends the full
 * ordered id list to the backend so the server stores absolute positions.
 */
export default function BannersGrid({ banners, onEdit, className }: BannersGridProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<string | null>(null);
  const sorted = React.useMemo(() => [...banners].sort((a, b) => a.order - b.order), [banners]);

  const move = async (id: string, direction: -1 | 1) => {
    const idx = sorted.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = idx + direction;
    if (next < 0 || next >= sorted.length) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(idx, 1);
    reordered.splice(next, 0, item!);
    setBusy(id);
    try {
      // Submit absolute positions — server trusts the payload order.
      const items = reordered.map((b, i) => ({ id: b.id, order: i }));
      const result = await adminReorderBannersAction({ items });
      if (!result.ok) {
        toast({
          title: "Reorder failed",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  if (sorted.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-[var(--muted)]">No banners yet — create your first one.</p>
      </div>
    );
  }

  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} aria-live="polite">
      {sorted.map((b, i) => {
        const st = publishState(b);
        const toneClass: Record<typeof st.tone, string> = {
          ok: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
          muted: "border-[var(--line)] text-[var(--muted)]",
          warn: "border-[var(--warn)]/30 bg-[var(--warn)]/10 text-[var(--warn)]",
          bad: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
        };
        return (
          <li
            key={b.id}
            className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]"
          >
            <div
              className="aspect-[16/9] w-full bg-[var(--bg-alt)] bg-cover bg-center"
              style={{ backgroundImage: `url(${b.imageUrl})` }}
              role="img"
              aria-label={b.title}
            />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base tracking-[-0.01em] text-[var(--ink)]">
                  {b.title}
                </h3>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                    toneClass[st.tone],
                  )}
                >
                  {st.label}
                </span>
              </div>
              {b.subtitle ? <p className="text-xs text-[var(--ink-soft)]">{b.subtitle}</p> : null}
              <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(b.id, -1)}
                    disabled={i === 0 || busy === b.id}
                    aria-label={`Move ${b.title} up`}
                  >
                    <ArrowUp className="size-4" strokeWidth={1.5} aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(b.id, 1)}
                    disabled={i === sorted.length - 1 || busy === b.id}
                    aria-label={`Move ${b.title} down`}
                  >
                    <ArrowDown className="size-4" strokeWidth={1.5} aria-hidden />
                  </Button>
                </div>
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(b)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden />
                    Edit
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
