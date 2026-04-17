import type { FilterQuery, PipelineStage, ProjectionType, SortOrder, Types } from "mongoose";
import { Category } from "@/lib/db/models/Category";
import { Product, type ProductDoc } from "@/lib/db/models/Product";

/**
 * DB-side DTOs returned by this module.
 *
 * These are deliberately different from the API DTOs in `src/types/api/*`. The service layer
 * is responsible for mapping these DB shapes (still using integer paisa, ObjectId strings, etc.)
 * to wire shapes. Never import these types directly from frontend code.
 */

export type ProductImageDTO = {
  url: string;
  alt: string;
  order: number;
};

export type ProductVariantCardDTO = {
  id: string;
  name: string;
  image?: string;
};

export type ProductVariantDetailDTO = {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  reservedStock: number;
  image?: string;
  isActive: boolean;
};

export type ProductRatingDTO = {
  avg: number;
  count: number;
};

export type ProductCategoryRefDTO = {
  id: string;
  name: string;
  slug: string;
};

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  basePrice: number;
  comparePrice?: number;
  image?: ProductImageDTO;
  rating: ProductRatingDTO;
  badges: string[];
  variants: ProductVariantCardDTO[];
};

export type ProductDetailDTO = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  shortDescription?: string;
  category: ProductCategoryRefDTO | null;
  images: ProductImageDTO[];
  variants: ProductVariantDetailDTO[];
  basePrice: number;
  comparePrice?: number;
  ingredients: string[];
  allergens: string[];
  skinTypes: string[];
  badges: string[];
  tags: string[];
  rating: ProductRatingDTO;
  totalSold: number;
  isFeatured: boolean;
  isActive: boolean;
  seoMeta: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ProductListResult = {
  items: ProductCardDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListProductsOpts = {
  q?: string;
  category?: string;
  brand?: string;
  skinType?: string;
  minPrice?: number;
  maxPrice?: number;
  badges?: string[];
  page?: number;
  limit?: number;
  sort?: string;
};

/** Raw lean shapes used internally. */
type LeanImage = { url: string; alt?: string; order?: number };
type LeanVariantCard = { _id: Types.ObjectId; name: string; image?: string };
type LeanRating = { avg: number; count: number };

type LeanProductCard = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  basePrice: number;
  comparePrice?: number;
  images?: LeanImage[];
  rating?: LeanRating;
  badges?: string[];
  variants?: LeanVariantCard[];
};

type LeanVariantDetail = {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  reservedStock: number;
  image?: string;
  isActive: boolean;
};

type LeanProductDetail = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  description: string;
  shortDescription?: string;
  categoryId: Types.ObjectId;
  images?: LeanImage[];
  variants?: LeanVariantDetail[];
  basePrice: number;
  comparePrice?: number;
  ingredients?: string[];
  allergens?: string[];
  skinTypes?: string[];
  badges?: string[];
  tags?: string[];
  rating?: LeanRating;
  totalSold?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  seoMeta?: { title?: string; description?: string; ogImage?: string };
  createdAt: Date;
  updatedAt: Date;
};

type LeanCategoryRef = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
};

const CARD_PROJECTION = {
  slug: 1,
  name: 1,
  brand: 1,
  basePrice: 1,
  comparePrice: 1,
  images: { $slice: 1 },
  rating: 1,
  badges: 1,
  variants: { $slice: 5 },
} as const;

const CARD_VARIANT_PICK = { _id: 1, name: 1, image: 1 } as const;

function toImageDTO(img?: LeanImage): ProductImageDTO | undefined {
  if (!img) return undefined;
  return { url: img.url, alt: img.alt ?? "", order: img.order ?? 0 };
}

function toCardVariantDTOs(variants: LeanVariantCard[] | undefined): ProductVariantCardDTO[] {
  if (!variants || variants.length === 0) return [];
  return variants.map((v) => {
    const base: ProductVariantCardDTO = { id: v._id.toString(), name: v.name };
    if (v.image) base.image = v.image;
    return base;
  });
}

function toCardDTO(p: LeanProductCard): ProductCardDTO {
  const image = toImageDTO(p.images?.[0]);
  const dto: ProductCardDTO = {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    basePrice: p.basePrice,
    rating: { avg: p.rating?.avg ?? 0, count: p.rating?.count ?? 0 },
    badges: p.badges ?? [],
    variants: toCardVariantDTOs(p.variants),
  };
  if (p.comparePrice !== undefined) dto.comparePrice = p.comparePrice;
  if (image) dto.image = image;
  return dto;
}

function toDetailVariantDTO(v: LeanVariantDetail): ProductVariantDetailDTO {
  const dto: ProductVariantDetailDTO = {
    id: v._id.toString(),
    name: v.name,
    sku: v.sku,
    price: v.price,
    stock: v.stock,
    reservedStock: v.reservedStock,
    isActive: v.isActive,
  };
  if (v.comparePrice !== undefined) dto.comparePrice = v.comparePrice;
  if (v.image) dto.image = v.image;
  return dto;
}

/**
 * Parse a sort string like "createdAt:desc" or "price:asc" into a Mongo sort spec.
 * Defaults to createdAt desc when empty or unrecognized.
 */
function parseSort(sort: string | undefined): Record<string, SortOrder> {
  if (!sort) return { createdAt: -1 };
  const [fieldRaw, dirRaw] = sort.split(":");
  const field = (fieldRaw ?? "").trim();
  const dir: SortOrder = (dirRaw ?? "desc").toLowerCase() === "asc" ? 1 : -1;
  const allowed = new Set(["createdAt", "basePrice", "rating.avg", "totalSold", "name"]);
  if (!allowed.has(field)) return { createdAt: -1 };
  return { [field]: dir };
}

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}

function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 24;
  return Math.min(Math.floor(n), 100);
}

/**
 * Paginated product listing with optional text search and filters.
 *
 * When `q` is provided, uses Mongo `$text` with weighted projection + sort by textScore.
 * Otherwise sorts by the requested sort string (default createdAt desc).
 *
 * Always restricts to `isActive: true` and non-soft-deleted (deletedAt: null).
 */
export async function listProducts(opts: ListProductsOpts): Promise<ProductListResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<unknown> = { isActive: true, deletedAt: null };

  if (opts.brand) filter.brand = opts.brand;
  if (opts.skinType) filter.skinTypes = opts.skinType;
  if (opts.badges && opts.badges.length > 0) filter.badges = { $all: opts.badges };

  if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
    const range: { $gte?: number; $lte?: number } = {};
    if (opts.minPrice !== undefined) range.$gte = opts.minPrice;
    if (opts.maxPrice !== undefined) range.$lte = opts.maxPrice;
    filter.basePrice = range;
  }

  if (opts.category) {
    const cat = await Category.findOne({ slug: opts.category })
      .select({ _id: 1 })
      .lean<{ _id: Types.ObjectId } | null>();
    if (!cat) {
      return { items: [], page, limit, total: 0, totalPages: 0 };
    }
    filter.categoryId = cat._id;
  }

  const q = opts.q?.trim();
  if (q) filter.$text = { $search: q };

  const projection: ProjectionType<ProductDoc> = {
    ...CARD_PROJECTION,
  } as ProjectionType<ProductDoc>;
  let sort: Record<string, SortOrder | { $meta: "textScore" }>;
  if (q) {
    (projection as Record<string, unknown>).score = { $meta: "textScore" };
    sort = { score: { $meta: "textScore" } };
  } else {
    sort = parseSort(opts.sort);
  }

  const [rawItems, total] = await Promise.all([
    Product.find(filter, projection).sort(sort).skip(skip).limit(limit).lean<LeanProductCard[]>(),
    Product.countDocuments(filter),
  ]);

  // Re-shape variants to just the fields we advertise in CARD_VARIANT_PICK.
  const items = rawItems.map((p) => {
    const trimmed: LeanProductCard = {
      ...p,
      variants: (p.variants ?? []).map((v) => {
        const out: LeanVariantCard = { _id: v._id, name: v.name };
        // reason: runtime pick mirrors CARD_VARIANT_PICK for defensive safety
        void CARD_VARIANT_PICK;
        if (v.image) out.image = v.image;
        return out;
      }),
    };
    return toCardDTO(trimmed);
  });

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return { items, page, limit, total, totalPages };
}

/**
 * Full product detail by slug. Resolves category in a second query rather than $lookup
 * because the shape is small enough and keeps the primary read cheap + cacheable.
 */
export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  const doc = await Product.findOne({
    slug,
    isActive: true,
    deletedAt: null,
  }).lean<LeanProductDetail | null>();
  if (!doc) return null;

  const cat = await Category.findById(doc.categoryId)
    .select({ name: 1, slug: 1 })
    .lean<LeanCategoryRef | null>();

  const category: ProductCategoryRefDTO | null = cat
    ? { id: cat._id.toString(), name: cat.name, slug: cat.slug }
    : null;

  const detail: ProductDetailDTO = {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    brand: doc.brand,
    description: doc.description,
    category,
    images: (doc.images ?? []).map((i) => ({
      url: i.url,
      alt: i.alt ?? "",
      order: i.order ?? 0,
    })),
    variants: (doc.variants ?? []).map(toDetailVariantDTO),
    basePrice: doc.basePrice,
    ingredients: doc.ingredients ?? [],
    allergens: doc.allergens ?? [],
    skinTypes: doc.skinTypes ?? [],
    badges: doc.badges ?? [],
    tags: doc.tags ?? [],
    rating: { avg: doc.rating?.avg ?? 0, count: doc.rating?.count ?? 0 },
    totalSold: doc.totalSold ?? 0,
    isFeatured: doc.isFeatured ?? false,
    isActive: doc.isActive ?? true,
    seoMeta: {
      ...(doc.seoMeta?.title !== undefined ? { title: doc.seoMeta.title } : {}),
      ...(doc.seoMeta?.description !== undefined ? { description: doc.seoMeta.description } : {}),
      ...(doc.seoMeta?.ogImage !== undefined ? { ogImage: doc.seoMeta.ogImage } : {}),
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };

  if (doc.comparePrice !== undefined) detail.comparePrice = doc.comparePrice;
  if (doc.shortDescription !== undefined) detail.shortDescription = doc.shortDescription;

  return detail;
}

/**
 * Related products in the same category, excluding the given slug.
 * Ordered by rating.avg desc then totalSold desc.
 */
export async function getRelatedProducts(slug: string, limit = 8): Promise<ProductCardDTO[]> {
  const anchor = await Product.findOne({ slug, isActive: true, deletedAt: null })
    .select({ categoryId: 1, _id: 1 })
    .lean<{ _id: Types.ObjectId; categoryId: Types.ObjectId } | null>();
  if (!anchor) return [];

  const docs = await Product.find(
    {
      categoryId: anchor.categoryId,
      _id: { $ne: anchor._id },
      isActive: true,
      deletedAt: null,
    },
    CARD_PROJECTION,
  )
    .sort({ "rating.avg": -1, totalSold: -1 })
    .limit(Math.max(1, Math.min(limit, 24)))
    .lean<LeanProductCard[]>();

  return docs.map(toCardDTO);
}

/** Featured products sorted by createdAt desc. */
export async function getFeaturedProducts(limit = 8): Promise<ProductCardDTO[]> {
  const docs = await Product.find(
    { isFeatured: true, isActive: true, deletedAt: null },
    CARD_PROJECTION,
  )
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 24)))
    .lean<LeanProductCard[]>();

  return docs.map(toCardDTO);
}

// Internal helpers exported for tests.
export const __internal: {
  parseSort: typeof parseSort;
  toCardDTO: typeof toCardDTO;
} = {
  parseSort,
  toCardDTO,
};

// Unused placeholder to keep PipelineStage import honest for future aggregations.
// reason: placeholder used by forthcoming aggregation queries (faceted filter counts)
export type __PipelineStageAlias = PipelineStage;
