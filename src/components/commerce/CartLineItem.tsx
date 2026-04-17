"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types/api/cart";
import { cn } from "@/lib/utils/cn";
import PriceBlock from "@/components/shop/PriceBlock";

const MIN_QTY = 1;
const MAX_QTY = 99;

export interface CartLineItemProps {
  item: CartItem;
  onQtyChange: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  variant?: "drawer" | "page";
  className?: string;
}

function clamp(n: number) {
  if (Number.isNaN(n)) return MIN_QTY;
  return Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(n)));
}

export default function CartLineItem({
  item,
  onQtyChange,
  onRemove,
  variant = "page",
  className,
}: CartLineItemProps) {
  const [qty, setQty] = React.useState<number>(item.quantity);
  const [draft, setDraft] = React.useState<string>(String(item.quantity));

  React.useEffect(() => {
    setQty(item.quantity);
    setDraft(String(item.quantity));
  }, [item.quantity]);

  const commit = React.useCallback(
    (next: number) => {
      const safe = clamp(next);
      setQty(safe);
      setDraft(String(safe));
      if (safe !== item.quantity) onQtyChange(item.itemId, safe);
    },
    [item.itemId, item.quantity, onQtyChange],
  );

  const isDrawer = variant === "drawer";

  return (
    <div
      className={cn(
        "flex gap-4 border-b border-[var(--line)] py-4",
        isDrawer ? "items-start" : "items-start sm:items-center",
        className,
      )}
      data-variant={variant}
    >
      <Link
        href={`/products/${item.slug}`}
        className="relative block shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        style={{ width: 80, height: 100 }}
        aria-label={item.name}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={80}
            height={100}
            className="h-full w-full object-cover"
            sizes="80px"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            {item.brand ? (
              <p className="text-xs font-medium tracking-[0.08em] text-[var(--muted)] uppercase">
                {item.brand}
              </p>
            ) : null}
            <Link
              href={`/products/${item.slug}`}
              className="line-clamp-2 text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] focus-visible:text-[var(--accent)] focus-visible:outline-none"
            >
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
              {item.variantName}
              <span className="mx-1 text-[var(--muted)]">·</span>
              <span className="text-[var(--muted)] tabular-nums">SKU {item.sku}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.itemId)}
            aria-label={`Remove ${item.name} from cart`}
            className="inline-flex size-8 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-alt)] hover:text-[var(--danger)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QuantityStepper
              value={qty}
              draft={draft}
              onDraftChange={setDraft}
              onCommit={commit}
              disabledMinus={qty <= MIN_QTY}
              disabledPlus={qty >= MAX_QTY}
              label={`Quantity for ${item.name}`}
            />
          </div>
          <div className="flex items-center gap-2">
            {item.priceChanged ? (
              <span
                className="inline-flex items-center rounded-full border border-[var(--warn)]/30 bg-[var(--warn)]/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.04em] text-[var(--warn)] uppercase"
                title={`Was ${item.priceSnapshot / 100} · Now ${item.currentPrice / 100}`}
              >
                Price changed
              </span>
            ) : null}
            <PriceBlock basePrice={item.lineSubtotal} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  draft,
  onDraftChange,
  onCommit,
  disabledMinus,
  disabledPlus,
  label,
}: {
  value: number;
  draft: string;
  onDraftChange: (v: string) => void;
  onCommit: (next: number) => void;
  disabledMinus: boolean;
  disabledPlus: boolean;
  label: string;
}) {
  return (
    <div
      className="inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface)]"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onCommit(value - 1)}
        disabled={disabledMinus}
        aria-label="Decrease quantity"
        className="inline-flex size-9 items-center justify-center rounded-l-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-3.5" strokeWidth={1.5} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={MIN_QTY}
        max={MAX_QTY}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={() => onCommit(Number(draft))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit(Number(draft));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-full w-10 [appearance:textfield] border-0 bg-transparent text-center text-sm text-[var(--ink)] tabular-nums focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => onCommit(value + 1)}
        disabled={disabledPlus}
        aria-label="Increase quantity"
        className="inline-flex size-9 items-center justify-center rounded-r-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
