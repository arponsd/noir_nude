"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export interface SortSelectProps {
  paramKey?: string;
  defaultValue?: SortKey;
  className?: string;
}

export default function SortSelect({
  paramKey = "sort",
  defaultValue = "featured",
  className,
}: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = (searchParams.get(paramKey) as SortKey | null) ?? defaultValue;

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className={className}>
      <label className="sr-only" htmlFor="sort-select">
        Sort products
      </label>
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger
          id="sort-select"
          className="h-9 w-[180px] rounded-full border border-b-0 border-[var(--line)] bg-[var(--surface)] px-3.5"
        >
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
