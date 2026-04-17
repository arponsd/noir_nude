"use client";

import * as React from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

// TODO replace with import when backend types land: `import type { Variant } from "@/types/api/products";`
export interface VariantOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isDefault?: boolean;
}

export interface VariantSelectorProps {
  variants: VariantOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  basePrice: number;
  name?: string;
  className?: string;
}

const LOW_STOCK_THRESHOLD = 5;

export default function VariantSelector({
  variants,
  selectedId,
  onSelect,
  basePrice,
  name = "variant",
  className,
}: VariantSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="sr-only">Choose a variant</legend>
      {variants.map((v) => {
        const isOutOfStock = v.stock <= 0;
        const isLowStock = !isOutOfStock && v.stock < LOW_STOCK_THRESHOLD;
        const hasPriceDiff = v.price !== basePrice;
        const isSelected = selectedId === v.id;

        return (
          <label
            key={v.id}
            className={cn(
              "group relative flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-4 transition-colors duration-200",
              isSelected
                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink-soft)]",
              isOutOfStock && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={v.id}
              checked={isSelected}
              disabled={isOutOfStock}
              onChange={() => onSelect(v.id)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                isSelected ? "border-[var(--accent)]" : "border-[var(--muted)]",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2",
              )}
            >
              <span
                className={cn(
                  "size-2.5 rounded-full transition-transform",
                  isSelected ? "scale-100 bg-[var(--accent)]" : "scale-0 bg-transparent",
                )}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium text-[var(--ink)]">{v.name}</span>
                {hasPriceDiff ? (
                  <span className="text-sm font-medium text-[var(--ink)] tabular-nums">
                    {formatBDT(v.price)}
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted)] tabular-nums">
                SKU {v.sku}
              </span>
              {isLowStock ? (
                <span className="mt-1 inline-block text-xs font-medium text-[var(--warn)]">
                  Low stock: {v.stock} left
                </span>
              ) : null}
              {isOutOfStock ? (
                <span className="mt-1 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <span className="font-medium text-[var(--danger)]">Out of stock</span>
                  <Link
                    href={`/account/notify?sku=${encodeURIComponent(v.sku)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="underline underline-offset-4 hover:text-[var(--accent)]"
                  >
                    Notify me
                  </Link>
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
