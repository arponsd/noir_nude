import { z } from "zod";
import {
  getFeaturedProducts as dbGetFeaturedProducts,
  getProductBySlug as dbGetProductBySlug,
  getRelatedProducts as dbGetRelatedProducts,
  listProducts as dbListProducts,
  type ProductCardDTO,
  type ProductDetailDTO,
  type ProductListResult,
} from "@/lib/db/queries/products";
import { NotFoundError } from "@/lib/api/response";
import type { ProductCard, ProductDetail, ProductListPage } from "@/types/api/products";

const listQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    brand: z.string().trim().min(1).max(120).optional(),
    skinType: z.string().trim().min(1).max(40).optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    badges: z
      .union([z.string(), z.array(z.string())])
      .transform((v) =>
        Array.isArray(v)
          ? v
          : v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
      )
      .pipe(z.array(z.string().min(1).max(40)).max(8))
      .optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().trim().min(1).max(60).optional(),
  })
  .strict();

export type ListProductsQuery = z.infer<typeof listQuerySchema>;

function cardFromDTO(src: ProductCardDTO): ProductCard {
  const card: ProductCard = {
    id: src.id,
    slug: src.slug,
    name: src.name,
    brand: src.brand,
    basePrice: src.basePrice,
    rating: { avg: src.rating.avg, count: src.rating.count },
    badges: src.badges,
    variants: src.variants.map((v) => {
      const out: ProductCard["variants"][number] = { id: v.id, name: v.name };
      if (v.image) out.image = v.image;
      return out;
    }),
  };
  if (src.comparePrice !== undefined) card.comparePrice = src.comparePrice;
  if (src.image?.url) card.thumbUrl = src.image.url;
  return card;
}

function detailFromDTO(src: ProductDetailDTO): ProductDetail {
  const card = cardFromDTO({
    id: src.id,
    slug: src.slug,
    name: src.name,
    brand: src.brand,
    basePrice: src.basePrice,
    ...(src.comparePrice !== undefined ? { comparePrice: src.comparePrice } : {}),
    ...(src.images[0] ? { image: src.images[0] } : {}),
    rating: src.rating,
    badges: src.badges,
    variants: src.variants.map((v) => {
      const out: ProductCardDTO["variants"][number] = { id: v.id, name: v.name };
      if (v.image) out.image = v.image;
      return out;
    }),
  });

  const detail: ProductDetail = {
    ...card,
    description: src.description,
    images: src.images.map((i) => ({ url: i.url, alt: i.alt, order: i.order })),
    fullVariants: src.variants.map((v) => {
      const out: ProductDetail["fullVariants"][number] = {
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        reservedStock: v.reservedStock,
        isActive: v.isActive,
      };
      if (v.comparePrice !== undefined) out.comparePrice = v.comparePrice;
      if (v.image) out.image = v.image;
      return out;
    }),
    ingredients: src.ingredients,
    allergens: src.allergens,
    skinTypes: src.skinTypes,
    tags: src.tags,
    category: src.category ? { slug: src.category.slug, name: src.category.name } : null,
    seoMeta: { ...src.seoMeta },
    totalSold: src.totalSold,
    isFeatured: src.isFeatured,
    createdAt: src.createdAt,
    updatedAt: src.updatedAt,
  };
  if (src.shortDescription !== undefined) detail.shortDescription = src.shortDescription;
  return detail;
}

function pageFromDTO(src: ProductListResult): ProductListPage {
  return {
    items: src.items.map(cardFromDTO),
    page: src.page,
    limit: src.limit,
    total: src.total,
    totalPages: src.totalPages,
  };
}

export async function listProductsService(raw: unknown): Promise<ProductListPage> {
  const parsed = listQuerySchema.parse(raw);
  const opts: Parameters<typeof dbListProducts>[0] = {};
  if (parsed.q !== undefined) opts.q = parsed.q;
  if (parsed.category !== undefined) opts.category = parsed.category;
  if (parsed.brand !== undefined) opts.brand = parsed.brand;
  if (parsed.skinType !== undefined) opts.skinType = parsed.skinType;
  if (parsed.minPrice !== undefined) opts.minPrice = parsed.minPrice;
  if (parsed.maxPrice !== undefined) opts.maxPrice = parsed.maxPrice;
  if (parsed.badges !== undefined) opts.badges = parsed.badges;
  if (parsed.page !== undefined) opts.page = parsed.page;
  if (parsed.limit !== undefined) opts.limit = parsed.limit;
  if (parsed.sort !== undefined) opts.sort = parsed.sort;
  const result = await dbListProducts(opts);
  return pageFromDTO(result);
}

export async function getProductDetailService(slug: string): Promise<ProductDetail> {
  const doc = await dbGetProductBySlug(slug);
  if (!doc) throw new NotFoundError("Product not found");
  return detailFromDTO(doc);
}

export async function getRelatedProductsService(slug: string, limit = 8): Promise<ProductCard[]> {
  const docs = await dbGetRelatedProducts(slug, limit);
  return docs.map(cardFromDTO);
}

export async function getFeaturedProductsService(limit = 8): Promise<ProductCard[]> {
  const docs = await dbGetFeaturedProducts(limit);
  return docs.map(cardFromDTO);
}
