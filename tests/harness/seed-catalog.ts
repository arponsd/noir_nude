import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { Category, Product } from "@/lib/db/models";

/**
 * Deterministic minimal-catalog seed for integration tests.
 *
 * Tests that need a *tight* DB state (known counts, known prices, known badges)
 * should call `seedCatalog(...)` inside a `beforeEach`. The per-test DB is
 * already dropped by `tests/integration/setup.ts`, so every call starts from
 * empty.
 *
 * All prices are integer paisa (1 BDT = 100 paisa). Rules enforced by the
 * Product schema: basePrice integer; variants must have integer prices; slug
 * must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
 */

export type SeedCategoryInput = {
  name: string;
  slug: string;
  parentSlug?: string;
  order?: number;
};

export type SeedProductInput = {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categorySlug: string;
  brand?: string;
  basePrice: number;
  comparePrice?: number;
  badges?: string[];
  tags?: string[];
  skinTypes?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  deletedAt?: Date | null;
  totalSold?: number;
  rating?: { avg: number; count: number };
  images?: { url: string; alt?: string; order?: number }[];
  variants?: {
    name: string;
    sku: string;
    price: number;
    stock?: number;
    isActive?: boolean;
  }[];
};

export type SeededCategory = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
};

export type SeededProduct = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  variantIds: string[];
};

export type SeededCatalog = {
  categories: SeededCategory[];
  products: SeededProduct[];
  categoryBySlug: Map<string, SeededCategory>;
  productBySlug: Map<string, SeededProduct>;
};

const DEFAULT_CATEGORIES: SeedCategoryInput[] = [
  { name: "Lipstick", slug: "lipstick", order: 1 },
  { name: "Foundation", slug: "foundation", order: 2 },
  { name: "Skincare", slug: "skincare", order: 3 },
];

const DEFAULT_PRODUCTS: SeedProductInput[] = [
  {
    name: "Velvet Matte Lipstick",
    slug: "velvet-matte-lipstick",
    categorySlug: "lipstick",
    brand: "GlowCart",
    basePrice: 85000,
    comparePrice: 99000,
    badges: ["bestseller"],
    rating: { avg: 4.7, count: 312 },
    totalSold: 2450,
    isFeatured: true,
  },
  {
    name: "Hydra Glow Lip Tint",
    slug: "hydra-glow-lip-tint",
    categorySlug: "lipstick",
    brand: "GlowCart",
    basePrice: 65000,
    badges: ["new"],
    rating: { avg: 4.5, count: 148 },
    totalSold: 1020,
  },
  {
    name: "Velvet Cushion Foundation",
    slug: "velvet-cushion-foundation",
    categorySlug: "foundation",
    brand: "GlowCart",
    basePrice: 125000,
    badges: ["bestseller"],
    rating: { avg: 4.6, count: 210 },
    totalSold: 1600,
  },
  {
    name: "Silk Serum",
    slug: "silk-serum",
    categorySlug: "skincare",
    brand: "AuraSkin",
    basePrice: 180000,
    badges: ["new"],
    rating: { avg: 4.8, count: 88 },
    totalSold: 540,
  },
  {
    name: "Daily Matte Foundation",
    slug: "daily-matte-foundation",
    categorySlug: "foundation",
    brand: "AuraSkin",
    basePrice: 95000,
    rating: { avg: 4.3, count: 77 },
    totalSold: 420,
  },
  {
    name: "Gentle Cleansing Milk",
    slug: "gentle-cleansing-milk",
    categorySlug: "skincare",
    brand: "AuraSkin",
    basePrice: 55000,
    rating: { avg: 4.4, count: 61 },
    totalSold: 390,
  },
];

function makeVariants(p: SeedProductInput): SeedProductInput["variants"] {
  if (p.variants && p.variants.length > 0) return p.variants;
  const skuBase = p.slug.toUpperCase().replace(/-/g, "").slice(0, 8);
  return [{ name: "Default", sku: `${skuBase}-DEF-01`, price: p.basePrice, stock: 100 }];
}

function makeImages(p: SeedProductInput): { url: string; alt: string; order: number }[] {
  if (p.images && p.images.length > 0) {
    return p.images.map((img, i) => ({
      url: img.url,
      alt: img.alt ?? p.name,
      order: img.order ?? i,
    }));
  }
  return [
    {
      url: `https://res.cloudinary.com/demo/image/upload/${p.slug}-1.jpg`,
      alt: p.name,
      order: 0,
    },
  ];
}

export async function seedCatalog(
  input: { categories?: SeedCategoryInput[]; products?: SeedProductInput[] } = {},
): Promise<SeededCatalog> {
  await connectDb();

  const categoriesInput = input.categories ?? DEFAULT_CATEGORIES;
  const productsInput = input.products ?? DEFAULT_PRODUCTS;

  // Two-pass: roots first so children can resolve their parentId.
  const createdCats = new Map<string, SeededCategory>();
  const roots = categoriesInput.filter((c) => !c.parentSlug);
  const children = categoriesInput.filter((c) => c.parentSlug);

  for (const c of roots) {
    const doc = await Category.create({
      name: c.name,
      slug: c.slug,
      parentId: null,
      order: c.order ?? 0,
      isActive: true,
    });
    createdCats.set(c.slug, {
      id: doc._id.toString(),
      slug: doc.slug,
      name: doc.name,
      parentId: null,
    });
  }

  for (const c of children) {
    const parent = c.parentSlug ? createdCats.get(c.parentSlug) : undefined;
    if (!parent) {
      throw new Error(`seedCatalog: parent category '${c.parentSlug}' not found for '${c.slug}'`);
    }
    const doc = await Category.create({
      name: c.name,
      slug: c.slug,
      parentId: new Types.ObjectId(parent.id),
      order: c.order ?? 0,
      isActive: true,
    });
    createdCats.set(c.slug, {
      id: doc._id.toString(),
      slug: doc.slug,
      name: doc.name,
      parentId: parent.id,
    });
  }

  const createdProducts = new Map<string, SeededProduct>();
  for (const p of productsInput) {
    const cat = createdCats.get(p.categorySlug);
    if (!cat) {
      throw new Error(
        `seedCatalog: category '${p.categorySlug}' not found for product '${p.slug}'`,
      );
    }
    const doc = await Product.create({
      name: p.name,
      slug: p.slug,
      description: p.description ?? `Long-form description for ${p.name}.`,
      ...(p.shortDescription ? { shortDescription: p.shortDescription } : {}),
      categoryId: new Types.ObjectId(cat.id),
      brand: p.brand ?? "GlowCart",
      basePrice: p.basePrice,
      ...(p.comparePrice !== undefined ? { comparePrice: p.comparePrice } : {}),
      badges: p.badges ?? [],
      tags: p.tags ?? [],
      skinTypes: p.skinTypes ?? [],
      images: makeImages(p),
      variants: makeVariants(p),
      rating: p.rating ?? { avg: 0, count: 0 },
      totalSold: p.totalSold ?? 0,
      isActive: p.isActive ?? true,
      isFeatured: p.isFeatured ?? false,
      deletedAt: p.deletedAt ?? null,
    });
    const variantIds: string[] = [];
    const rawVariants = (doc as unknown as { variants?: Array<{ _id: Types.ObjectId }> }).variants;
    if (rawVariants) {
      for (const v of rawVariants) variantIds.push(v._id.toString());
    }
    createdProducts.set(p.slug, {
      id: doc._id.toString(),
      slug: doc.slug,
      name: doc.name,
      categoryId: cat.id,
      variantIds,
    });
  }

  const categories = Array.from(createdCats.values());
  const products = Array.from(createdProducts.values());
  return {
    categories,
    products,
    categoryBySlug: createdCats,
    productBySlug: createdProducts,
  };
}
