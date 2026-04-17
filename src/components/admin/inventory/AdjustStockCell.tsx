"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/cn";

// TODO(backend): replace with real server action import from `@/lib/actions/admin`.
// import { adjustInventoryAction } from "@/lib/actions/admin";
type AdjustInventoryInput = {
  variantId: string;
  delta: number;
  reason: string;
};
type AdjustInventoryResult =
  | { ok: true; data: { variantId: string; stock: number } }
  | { ok: false; error: { code: string; message: string } };

async function adjustInventoryAction(input: AdjustInventoryInput): Promise<AdjustInventoryResult> {
  const res = await fetch(`/api/admin/inventory/${input.variantId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta: input.delta, reason: input.reason }),
    credentials: "same-origin",
  });
  return (await res.json()) as AdjustInventoryResult;
}

export interface AdjustStockCellProps {
  variantId: string;
  currentStock: number;
  className?: string;
}

/**
 * Inline popover for adjusting stock on a single variant. Pure CSS popover via
 * `details`/`summary` to keep it zero-JS-dependency until opened; submits via the
 * placeholder `adjustInventoryAction`.
 */
export default function AdjustStockCell({
  variantId,
  currentStock,
  className,
}: AdjustStockCellProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [delta, setDelta] = React.useState<number>(0);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const detailsRef = React.useRef<HTMLDetailsElement | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delta || !reason.trim()) return;
    setSubmitting(true);
    try {
      const result = await adjustInventoryAction({
        variantId,
        delta,
        reason: reason.trim(),
      });
      if (!result.ok) {
        toast({
          title: "Adjustment failed",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Stock updated",
        description: `New stock: ${result.data.stock}`,
      });
      setDelta(0);
      setReason("");
      detailsRef.current?.removeAttribute("open");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <details ref={detailsRef} className={cn("relative inline-block", className)}>
      <summary
        className="inline-flex h-8 cursor-pointer list-none items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none [&::-webkit-details-marker]:hidden"
        aria-label={`Adjust stock (current ${currentStock})`}
      >
        <span className="tabular-nums">Adjust</span>
      </summary>
      <form
        onSubmit={submit}
        className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-md)]"
        aria-live="polite"
      >
        <div>
          <Label htmlFor={`delta-${variantId}`}>Delta</Label>
          <div className="mt-1 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDelta((d) => d - 1)}
              aria-label="Decrease by 1"
            >
              <Minus className="size-4" strokeWidth={1.5} aria-hidden />
            </Button>
            <Input
              id={`delta-${variantId}`}
              type="number"
              inputMode="numeric"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value) || 0)}
              className="h-9 text-center tabular-nums"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDelta((d) => d + 1)}
              aria-label="Increase by 1"
            >
              <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)] tabular-nums">
            {currentStock} → {currentStock + delta}
          </p>
        </div>
        <div>
          <Label htmlFor={`reason-${variantId}`}>Reason</Label>
          <Input
            id={`reason-${variantId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="restock / damaged / audit"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => detailsRef.current?.removeAttribute("open")}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !delta || !reason.trim()}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
            ) : null}
            Apply
          </Button>
        </div>
      </form>
    </details>
  );
}
