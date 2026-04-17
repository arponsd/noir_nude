"use client";

import * as React from "react";
import FilterBar, { type FilterBarState } from "@/components/shop/FilterBar";
import ImageGallery from "@/components/shop/ImageGallery";
import SearchAutocomplete from "@/components/shop/SearchAutocomplete";
import SortSelect from "@/components/shop/SortSelect";
import VariantSelector, { type VariantOption } from "@/components/shop/VariantSelector";
import VariantSwatches from "@/components/shop/VariantSwatches";

const VARIANT_OPTIONS: VariantOption[] = [
  { id: "v1", name: "30ml", sku: "HS-030", price: 149900, stock: 12, isDefault: true },
  { id: "v2", name: "50ml", sku: "HS-050", price: 229900, stock: 3 },
  { id: "v3", name: "100ml", sku: "HS-100", price: 389900, stock: 0 },
];

const GALLERY_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
    alt: "Serum bottle front",
    order: 1,
  },
  {
    url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80",
    alt: "Serum bottle side",
    order: 2,
  },
  {
    url: "https://images.unsplash.com/photo-1522335789203-aaa741b58c4d?auto=format&fit=crop&w=1200&q=80",
    alt: "Serum in hand",
    order: 3,
  },
];

const SWATCHES = [
  { id: "nude", name: "Nude", hex: "#E5C9B5" },
  { id: "rose", name: "Rose", hex: "#B97A86" },
  { id: "plum", name: "Plum", hex: "#6B1F2E" },
  { id: "berry", name: "Berry", hex: "#7A2438" },
];

const FILTER_OPTIONS = {
  category: [
    { value: "skincare", label: "Skincare" },
    { value: "makeup", label: "Makeup" },
    { value: "fragrance", label: "Fragrance" },
  ],
  brand: [
    { value: "glow-lab", label: "Glow Lab" },
    { value: "rouge-atelier", label: "Rouge Atelier" },
    { value: "bloom", label: "Bloom" },
  ],
  skinType: [
    { value: "dry", label: "Dry" },
    { value: "oily", label: "Oily" },
    { value: "combination", label: "Combination" },
    { value: "sensitive", label: "Sensitive" },
  ],
  badges: [
    { value: "vegan", label: "Vegan" },
    { value: "cruelty-free", label: "Cruelty-free" },
    { value: "paraben-free", label: "Paraben-free" },
  ],
};

export default function DesignPrimitivesClient() {
  const [variant, setVariant] = React.useState("v1");
  const [swatch, setSwatch] = React.useState("rose");
  const [filters, setFilters] = React.useState<FilterBarState>({});

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Search autocomplete
        </p>
        <div className="mt-3 max-w-md">
          <SearchAutocomplete />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Filter bar + sort
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <FilterBar filters={filters} onChange={setFilters} options={FILTER_OPTIONS} />
          <SortSelect />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Interactive swatches
        </p>
        <div className="mt-3">
          <VariantSwatches variants={SWATCHES} selectedId={swatch} onSelect={setSwatch} size={28} />
          <p className="mt-2 text-xs text-[var(--muted)]">Selected: {swatch}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
            Variant selector
          </p>
          <div className="mt-3">
            <VariantSelector
              variants={VARIANT_OPTIONS}
              selectedId={variant}
              onSelect={setVariant}
              basePrice={149900}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
            Image gallery
          </p>
          <div className="mt-3">
            <ImageGallery images={GALLERY_IMAGES} />
          </div>
        </div>
      </div>
    </div>
  );
}
