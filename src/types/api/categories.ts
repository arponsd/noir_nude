import type { ProductCard } from "./products";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  parentId: string | null;
  order: number;
  isActive: boolean;
  seoMeta?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
};

export type CategoryTree = Category & {
  children: CategoryTree[];
};

export type CategoryWithProducts = Category & {
  products: ProductCard[];
};
