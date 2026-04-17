"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterBar, { type FilterBarState, type FilterOption } from "./FilterBar";

export interface ProductsListingControlsProps {
  options: {
    category: FilterOption[];
    brand: FilterOption[];
    skinType: FilterOption[];
    badges: FilterOption[];
  };
  initial: FilterBarState;
}

/**
 * Thin client wrapper that owns URL sync for FilterBar. The listing page is a
 * server component, so filter state lives in the URL.
 */
export default function ProductsListingControls({
  options,
  initial,
}: ProductsListingControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (next: FilterBarState) => {
    const params = new URLSearchParams(searchParams.toString());

    const setMulti = (key: string, values: string[] | undefined) => {
      params.delete(key);
      if (values && values.length > 0) params.set(key, values.join(","));
    };
    setMulti("category", next.category);
    setMulti("brand", next.brand);
    setMulti("skinType", next.skinType);
    setMulti("badges", next.badges);

    params.delete("minPrice");
    if (typeof next.minPrice === "number") params.set("minPrice", String(next.minPrice));
    params.delete("maxPrice");
    if (typeof next.maxPrice === "number") params.set("maxPrice", String(next.maxPrice));

    // Reset to page 1 on filter change.
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return <FilterBar filters={initial} onChange={handleChange} options={options} />;
}
