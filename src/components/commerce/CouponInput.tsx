"use client";

import * as React from "react";
import { Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { formatBDT } from "@/lib/constants";

export interface CouponInputProps {
  currentCode?: string;
  currentDiscount?: number;
  onApply: (code: string) => Promise<void> | void;
  onRemove: () => Promise<void> | void;
  className?: string;
}

export default function CouponInput({
  currentCode,
  currentDiscount,
  onApply,
  onRemove,
  className,
}: CouponInputProps) {
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a coupon code.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onApply(trimmed);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply that coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove coupon.");
    } finally {
      setRemoving(false);
    }
  };

  if (currentCode) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Label>Coupon</Label>
        <div className="flex items-center justify-between gap-3 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Tag className="size-4 text-[var(--accent)]" strokeWidth={1.5} aria-hidden />
            <span className="truncate text-sm font-medium tracking-[0.04em] text-[var(--accent)]">
              {currentCode}
            </span>
            {typeof currentDiscount === "number" && currentDiscount > 0 ? (
              <span className="shrink-0 text-xs text-[var(--accent)]/80 tabular-nums">
                -{formatBDT(currentDiscount)}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            aria-label={`Remove coupon ${currentCode}`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none disabled:opacity-50"
          >
            {removing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" strokeWidth={1.5} />
            )}
          </button>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          Coupon {currentCode} applied.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-2", className)} noValidate>
      <Label htmlFor="coupon-code">Coupon code</Label>
      <div className="flex items-end gap-2">
        <Input
          id="coupon-code"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="GLOW10"
          disabled={submitting}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          className="uppercase"
        />
        <Button type="submit" size="sm" disabled={submitting || !code.trim()}>
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Applying
            </>
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      <p
        id="coupon-error"
        role="alert"
        aria-live="polite"
        className={cn(
          "min-h-4 text-xs text-[var(--danger)] transition-opacity",
          error ? "opacity-100" : "opacity-0",
        )}
      >
        {error ?? ""}
      </p>
    </form>
  );
}
