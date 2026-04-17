"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface VariantSwatch {
  id: string;
  name: string;
  image?: string | null;
  hex?: string | null;
}

export interface VariantSwatchesProps {
  variants: VariantSwatch[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  max?: number;
  size?: number;
  className?: string;
  label?: string;
}

export default function VariantSwatches({
  variants,
  selectedId,
  onSelect,
  max = 5,
  size = 24,
  className,
  label = "Color options",
}: VariantSwatchesProps) {
  if (variants.length === 0) return null;

  const visible = variants.slice(0, max);
  const overflow = Math.max(0, variants.length - max);
  const interactive = typeof onSelect === "function";

  return (
    <div role="group" aria-label={label} className={cn("flex items-center gap-1.5", className)}>
      {visible.map((v) => {
        const isSelected = selectedId === v.id;
        const commonClass = cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--bg-alt)] transition-[box-shadow,transform] duration-200",
          isSelected && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]",
          interactive &&
            "hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
        );
        const style: React.CSSProperties = {
          width: size,
          height: size,
          backgroundColor: v.hex ?? undefined,
        };

        const inner = v.image ? (
          <Image
            src={v.image}
            alt=""
            width={size}
            height={size}
            className="size-full object-cover"
          />
        ) : null;

        if (interactive) {
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect?.(v.id)}
              aria-label={v.name}
              aria-pressed={isSelected}
              className={commonClass}
              style={style}
            >
              {inner}
              <span className="sr-only">{v.name}</span>
            </button>
          );
        }

        return (
          <span key={v.id} className={commonClass} style={style} aria-label={v.name} title={v.name}>
            {inner}
          </span>
        );
      })}
      {overflow > 0 ? (
        <span
          className="inline-flex h-6 items-center justify-center rounded-full bg-[var(--bg-alt)] px-2 text-[10px] font-medium text-[var(--ink-soft)] tabular-nums"
          aria-label={`${overflow} more colors`}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
