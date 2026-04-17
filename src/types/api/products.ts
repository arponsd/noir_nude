import type { Badge, SkinType } from "@/lib/constants";

export type ProductImageDTO = {
  url: string;
  alt: string;
  order: number;
};

export type ProductRating = {
  avg: number;
  count: number;
};

export type ProductCardVariant = {
  id: string;
  name: string;
  image?: string;
};

export type ProductVariantFull = {
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

export type ProductCategoryRef = {
  slug: string;
  name: string;
};

export type ProductSeoMeta = {
  title?: string;
  description?: string;
  ogImage?: string;
};

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  basePrice: number;
  comparePrice?: number;
  thumbUrl?: string;
  rating: ProductRating;
  badges: Badge[] | string[];
  variants: ProductCardVariant[];
};

export type ProductDetail = ProductCard & {
  description: string;
  shortDescription?: string;
  images: ProductImageDTO[];
  fullVariants: ProductVariantFull[];
  ingredients: string[];
  allergens: string[];
  skinTypes: SkinType[] | string[];
  tags: string[];
  category: ProductCategoryRef | null;
  seoMeta: ProductSeoMeta;
  totalSold: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductListPage = {
  items: ProductCard[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminProductRow = ProductCard & {
  isActive: boolean;
  isFeatured: boolean;
  deletedAt: string | null;
  updatedAt: string;
};

export type AdminProductListPage = {
  items: AdminProductRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
