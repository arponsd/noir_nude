import type { Types } from "mongoose";
import { Category } from "@/lib/db/models/Category";
import { Product } from "@/lib/db/models/Product";

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId: string | null;
  order: number;
  isActive: boolean;
  seoMeta: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CategoryTreeNode = CategoryDTO & {
  children: CategoryTreeNode[];
};

export type CategoryDetailDTO = CategoryDTO & {
  children?: CategoryDTO[];
  productCount: number;
};

type LeanCategory = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId: Types.ObjectId | null;
  order?: number;
  isActive?: boolean;
  seoMeta?: { title?: string; description?: string; ogImage?: string };
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(c: LeanCategory): CategoryDTO {
  const dto: CategoryDTO = {
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    parentId: c.parentId ? c.parentId.toString() : null,
    order: c.order ?? 0,
    isActive: c.isActive ?? true,
    seoMeta: {
      ...(c.seoMeta?.title !== undefined ? { title: c.seoMeta.title } : {}),
      ...(c.seoMeta?.description !== undefined ? { description: c.seoMeta.description } : {}),
      ...(c.seoMeta?.ogImage !== undefined ? { ogImage: c.seoMeta.ogImage } : {}),
    },
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
  if (c.description !== undefined) dto.description = c.description;
  if (c.image !== undefined) dto.image = c.image;
  return dto;
}

/**
 * Build the full category tree in two queries:
 *   1. Find root categories (parentId: null).
 *   2. Find all children in one go.
 * Assemble in-memory.
 *
 * The schema caps depth at 2 (root -> child) so no recursion is needed.
 */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const roots = await Category.find({ parentId: null, isActive: true, deletedAt: null })
    .sort({ order: 1, name: 1 })
    .lean<LeanCategory[]>();

  if (roots.length === 0) return [];

  const rootIds = roots.map((r) => r._id);
  const children = await Category.find({
    parentId: { $in: rootIds },
    isActive: true,
    deletedAt: null,
  })
    .sort({ order: 1, name: 1 })
    .lean<LeanCategory[]>();

  const byParent = new Map<string, CategoryTreeNode[]>();
  for (const child of children) {
    const key = child.parentId ? child.parentId.toString() : "";
    if (!key) continue;
    const bucket = byParent.get(key) ?? [];
    bucket.push({ ...toDTO(child), children: [] });
    byParent.set(key, bucket);
  }

  return roots.map((r) => ({
    ...toDTO(r),
    children: byParent.get(r._id.toString()) ?? [],
  }));
}

/**
 * Fetch a category with its direct children and an accurate product count.
 * Returns null when the slug is not found or is soft-deleted.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryDetailDTO | null> {
  const cat = await Category.findOne({
    slug,
    isActive: true,
    deletedAt: null,
  }).lean<LeanCategory | null>();
  if (!cat) return null;

  const [children, productCount] = await Promise.all([
    Category.find({ parentId: cat._id, isActive: true, deletedAt: null })
      .sort({ order: 1, name: 1 })
      .lean<LeanCategory[]>(),
    Product.countDocuments({ categoryId: cat._id, isActive: true, deletedAt: null }),
  ]);

  const base = toDTO(cat);
  const detail: CategoryDetailDTO = { ...base, productCount };
  if (children.length > 0) {
    detail.children = children.map(toDTO);
  }
  return detail;
}
