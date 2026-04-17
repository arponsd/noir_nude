import type { Types } from "mongoose";
import { Category } from "@/lib/db/models/Category";
import { Product } from "@/lib/db/models/Product";
import {
  listProducts,
  type ListProductsOpts,
  type ProductListResult,
} from "@/lib/db/queries/products";

/**
 * Thin search abstraction.
 *
 * MVP uses MongoDB's `$text` index on Product for full `search()` and a regex prefix
 * query for `suggest()` (because `$text` requires whole words and we want prefix
 * matching for autocomplete). Post-MVP we can swap this out for Atlas Search or
 * Meilisearch by providing another implementation of `SearchAdapter`.
 */

export type SearchSuggestion = {
  slug: string;
  name: string;
  brand: string;
  thumb?: string;
  categorySlug?: string;
};

export type SearchFilters = Omit<ListProductsOpts, "q">;

export type SearchAdapter = {
  suggest(q: string, limit: number): Promise<SearchSuggestion[]>;
  search(q: string, filters: SearchFilters): Promise<ProductListResult>;
};

type LeanSuggestDoc = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  images?: Array<{ url: string }>;
  categoryId: Types.ObjectId;
};

type LeanCategoryRef = {
  _id: Types.ObjectId;
  slug: string;
};

/** Escape a string for use inside a RegExp. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampSuggestLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 8;
  return Math.min(Math.floor(limit), 20);
}

const MongoTextSearchAdapter: SearchAdapter = {
  async suggest(q, limit) {
    const query = q.trim();
    if (query.length < 2) return [];
    const capped = clampSuggestLimit(limit);

    // Anchor at word boundary to behave like a prefix search across the product name.
    const pattern = new RegExp(`\\b${escapeRegex(query)}`, "i");

    const docs = await Product.find(
      { name: pattern, isActive: true, deletedAt: null },
      { slug: 1, name: 1, brand: 1, images: { $slice: 1 }, categoryId: 1 },
    )
      .limit(capped)
      .lean<LeanSuggestDoc[]>();

    if (docs.length === 0) return [];

    // Resolve categories in a single follow-up query to attach slugs for routing.
    const catIds = Array.from(new Set(docs.map((d) => d.categoryId.toString())));
    const cats = await Category.find({ _id: { $in: catIds } })
      .select({ slug: 1 })
      .lean<LeanCategoryRef[]>();
    const catSlugById = new Map(cats.map((c) => [c._id.toString(), c.slug]));

    return docs.map((d) => {
      const suggestion: SearchSuggestion = {
        slug: d.slug,
        name: d.name,
        brand: d.brand,
      };
      const thumb = d.images?.[0]?.url;
      if (thumb) suggestion.thumb = thumb;
      const categorySlug = catSlugById.get(d.categoryId.toString());
      if (categorySlug) suggestion.categorySlug = categorySlug;
      return suggestion;
    });
  },

  async search(q, filters) {
    return listProducts({ ...filters, q });
  },
};

export default MongoTextSearchAdapter;
