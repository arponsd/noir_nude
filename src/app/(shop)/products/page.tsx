import Link from "next/link";
import { z } from "zod";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductsListingControls from "@/components/shop/ProductsListingControls";
import SortSelect from "@/components/shop/SortSelect";
import { toCardDTOs } from "@/components/shop/adapters";
import { Button } from "@/components/ui/button";
import { BADGES, SKIN_TYPES } from "@/lib/constants";
import { listProductsService } from "@/lib/services/product";
import { listCategoryTreeService } from "@/lib/services/category";
import type { FilterBarState, FilterOption } from "@/components/shop/FilterBar";

export const metadata = {
  title: "Shop all — GlowCart",
  description: "Browse the full GlowCart catalog of skincare, makeup, and fragrance.",
};

// Hard-coded brands until we derive dynamically from seed data.
const BRANDS = ["GlowCart", "Lumen", "Saffron & Rose", "Kohl", "Aurum"] as const;

const listingParamsSchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    brand: z.string().trim().min(1).max(120).optional(),
    skinType: z.string().trim().min(1).max(40).optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    badges: z.string().trim().min(1).max(200).optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    sort: z.string().trim().min(1).max(60).optional(),
  })
  .catchall(z.string().optional());

type Listing = Awaited<ReturnType<typeof listProductsService>>;

function coerceMulti(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildQuery(sp: Record<string, string | string[] | undefined>) {
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v.length > 0) base[k] = v;
  }
  return base;
}

export default async function ProductsListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawParams)) {
    if (typeof v === "string") flat[k] = v;
    else if (Array.isArray(v) && v.length > 0) flat[k] = v.join(",");
  }
  const parsed = listingParamsSchema.parse(flat);

  const categoryList = coerceMulti(parsed.category);
  const brandList = coerceMulti(parsed.brand);
  const skinTypeList = coerceMulti(parsed.skinType);
  const badgesList = coerceMulti(parsed.badges);

  // The underlying service only accepts single-value category/brand/skinType for now,
  // so we pick the first in each list for the query while preserving the full selection
  // for the FilterBar UI.
  const serviceInput: Parameters<typeof listProductsService>[0] = {};
  if (parsed.q) (serviceInput as Record<string, unknown>).q = parsed.q;
  if (categoryList?.[0]) (serviceInput as Record<string, unknown>).category = categoryList[0];
  if (brandList?.[0]) (serviceInput as Record<string, unknown>).brand = brandList[0];
  if (skinTypeList?.[0]) (serviceInput as Record<string, unknown>).skinType = skinTypeList[0];
  if (parsed.minPrice !== undefined)
    (serviceInput as Record<string, unknown>).minPrice = parsed.minPrice;
  if (parsed.maxPrice !== undefined)
    (serviceInput as Record<string, unknown>).maxPrice = parsed.maxPrice;
  if (badgesList && badgesList.length > 0)
    (serviceInput as Record<string, unknown>).badges = badgesList;
  if (parsed.page !== undefined) (serviceInput as Record<string, unknown>).page = parsed.page;
  if (parsed.sort !== undefined) (serviceInput as Record<string, unknown>).sort = parsed.sort;

  const [listing, categoryTree]: [Listing, Awaited<ReturnType<typeof listCategoryTreeService>>] =
    await Promise.all([listProductsService(serviceInput), listCategoryTreeService()]);

  const page = listing.page;
  const totalPages = listing.totalPages;

  const categoryOptions: FilterOption[] = [];
  for (const root of categoryTree) {
    categoryOptions.push({ value: root.slug, label: root.name });
    for (const child of root.children) {
      categoryOptions.push({ value: child.slug, label: `${root.name} — ${child.name}` });
    }
  }

  const brandOptions: FilterOption[] = BRANDS.map((b) => ({ value: b, label: b }));
  const skinTypeOptions: FilterOption[] = SKIN_TYPES.map((s) => ({
    value: s,
    label: s.replace("-", " "),
  }));
  const badgeOptions: FilterOption[] = BADGES.map((b) => ({
    value: b,
    label: b.replace("-", " "),
  }));

  const initialFilterState: FilterBarState = {};
  if (categoryList) initialFilterState.category = categoryList;
  if (brandList) initialFilterState.brand = brandList;
  if (skinTypeList) initialFilterState.skinType = skinTypeList;
  if (badgesList) initialFilterState.badges = badgesList;
  if (parsed.minPrice !== undefined) initialFilterState.minPrice = parsed.minPrice;
  if (parsed.maxPrice !== undefined) initialFilterState.maxPrice = parsed.maxPrice;

  const products = toCardDTOs(listing.items);
  const hasResults = products.length > 0;
  const hasFilters = Object.keys(flat).length > 0;

  const prevParams = buildQuery({ ...rawParams, page: page > 2 ? String(page - 1) : undefined });
  const nextParams = buildQuery({ ...rawParams, page: String(page + 1) });

  const prevHref =
    "/products" +
    (Object.keys(prevParams).length > 0 ? `?${new URLSearchParams(prevParams).toString()}` : "");
  const nextHref = `/products?${new URLSearchParams(nextParams).toString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products" }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
            Shop all
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)] tabular-nums">
            {listing.total.toLocaleString()} products
          </p>
        </div>
        <SortSelect />
      </header>

      <div className="mt-6">
        <ProductsListingControls
          options={{
            category: categoryOptions,
            brand: brandOptions,
            skinType: skinTypeOptions,
            badges: badgeOptions,
          }}
          initial={initialFilterState}
        />
      </div>

      <div className="mt-10">
        {hasResults ? (
          <ProductGrid products={products} columns={4} />
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
            <p className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
              No products match your filters.
            </p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Try loosening a filter or exploring a different category.
            </p>
            {hasFilters ? (
              <div className="mt-6">
                <Button asChild variant="secondary">
                  <Link href="/products">Clear filters</Link>
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-12 flex items-center justify-center gap-3 border-t border-[var(--line)] pt-6"
        >
          <Button asChild variant="secondary" size="sm" aria-disabled={page <= 1}>
            <Link
              href={prevHref}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-40" : undefined}
            >
              ← Previous
            </Link>
          </Button>
          <span className="text-sm text-[var(--ink-soft)] tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button asChild variant="secondary" size="sm" aria-disabled={page >= totalPages}>
            <Link
              href={nextHref}
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-40" : undefined}
            >
              Next →
            </Link>
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

// reason: read-only catalog surface — ISR 60s keeps navigation snappy.
export const revalidate = 60;
