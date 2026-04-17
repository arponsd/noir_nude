"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarState {
  category?: string[];
  brand?: string[];
  skinType?: string[];
  badges?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface FilterBarProps {
  filters: FilterBarState;
  onChange: (next: FilterBarState) => void;
  options?: {
    category?: FilterOption[];
    brand?: FilterOption[];
    skinType?: FilterOption[];
    badges?: FilterOption[];
  };
  className?: string;
}

function PopoverTrigger({ label, count }: { label: string; count: number }) {
  return (
    <Popover.Trigger
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-sm text-[var(--ink)] transition-colors duration-200",
        "hover:border-[var(--ink-soft)]",
        "data-[state=open]:border-[var(--accent)] data-[state=open]:bg-[var(--accent)]/5",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
      )}
    >
      <span>{label}</span>
      {count > 0 ? (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-medium text-white tabular-nums">
          {count}
        </span>
      ) : null}
      <ChevronDown className="size-3.5 opacity-70" strokeWidth={1.5} aria-hidden />
    </Popover.Trigger>
  );
}

function PopoverPanel({ children }: { children: React.ReactNode }) {
  return (
    <Popover.Portal>
      <Popover.Content
        sideOffset={8}
        align="start"
        className="z-40 w-64 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow-md)]"
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}

function CheckboxList({
  name,
  options,
  selected,
  onToggle,
}: {
  name: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) {
    return <p className="py-2 text-xs text-[var(--muted)]">No options available.</p>;
  }
  return (
    <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
      {options.map((opt) => {
        const id = `${name}-${opt.value}`;
        const checked = selected.includes(opt.value);
        return (
          <li key={opt.value}>
            <label
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--bg-alt)]"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(opt.value)}
                className="size-4 accent-[var(--accent)]"
              />
              <span>{opt.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export default function FilterBar({ filters, onChange, options, className }: FilterBarProps) {
  const {
    category = [],
    brand = [],
    skinType = [],
    badges = [],
    minPrice = null,
    maxPrice = null,
  } = filters;

  const toggleIn =
    (key: keyof Pick<FilterBarState, "category" | "brand" | "skinType" | "badges">) =>
    (value: string) => {
      const current = filters[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange({ ...filters, [key]: next });
    };

  const totalActive =
    category.length +
    brand.length +
    skinType.length +
    badges.length +
    (typeof minPrice === "number" ? 1 : 0) +
    (typeof maxPrice === "number" ? 1 : 0);

  const clearAll = () => onChange({});

  const priceLabel =
    typeof minPrice === "number" || typeof maxPrice === "number"
      ? `${typeof minPrice === "number" ? formatBDT(minPrice) : "Min"} – ${typeof maxPrice === "number" ? formatBDT(maxPrice) : "Max"}`
      : "Price";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="toolbar"
      aria-label="Filters"
    >
      <Popover.Root>
        <PopoverTrigger label="Category" count={category.length} />
        <PopoverPanel>
          <CheckboxList
            name="category"
            options={options?.category ?? []}
            selected={category}
            onToggle={toggleIn("category")}
          />
        </PopoverPanel>
      </Popover.Root>

      <Popover.Root>
        <PopoverTrigger label="Brand" count={brand.length} />
        <PopoverPanel>
          <CheckboxList
            name="brand"
            options={options?.brand ?? []}
            selected={brand}
            onToggle={toggleIn("brand")}
          />
        </PopoverPanel>
      </Popover.Root>

      <Popover.Root>
        <PopoverTrigger label="Skin type" count={skinType.length} />
        <PopoverPanel>
          <CheckboxList
            name="skinType"
            options={options?.skinType ?? []}
            selected={skinType}
            onToggle={toggleIn("skinType")}
          />
        </PopoverPanel>
      </Popover.Root>

      <Popover.Root>
        <PopoverTrigger label="Badges" count={badges.length} />
        <PopoverPanel>
          <CheckboxList
            name="badges"
            options={options?.badges ?? []}
            selected={badges}
            onToggle={toggleIn("badges")}
          />
        </PopoverPanel>
      </Popover.Root>

      <Popover.Root>
        <PopoverTrigger
          label={priceLabel}
          count={(typeof minPrice === "number" ? 1 : 0) + (typeof maxPrice === "number" ? 1 : 0)}
        />
        <PopoverPanel>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">Price range in BDT</legend>
            <label className="flex flex-col gap-1 text-xs text-[var(--ink-soft)]">
              <span>Min (৳)</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={typeof minPrice === "number" ? minPrice / 100 : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({
                    ...filters,
                    minPrice: v === "" ? null : Math.max(0, Number(v)) * 100,
                  });
                }}
                className="h-9 rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-2 text-sm text-[var(--ink)] tabular-nums focus-visible:border-[var(--accent)] focus-visible:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--ink-soft)]">
              <span>Max (৳)</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={typeof maxPrice === "number" ? maxPrice / 100 : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({
                    ...filters,
                    maxPrice: v === "" ? null : Math.max(0, Number(v)) * 100,
                  });
                }}
                className="h-9 rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-2 text-sm text-[var(--ink)] tabular-nums focus-visible:border-[var(--accent)] focus-visible:outline-none"
              />
            </label>
          </fieldset>
        </PopoverPanel>
      </Popover.Root>

      {totalActive > 0 ? (
        <button
          type="button"
          onClick={clearAll}
          className="ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <X className="size-3" strokeWidth={1.5} aria-hidden />
          Clear all
        </button>
      ) : null}
    </div>
  );
}
