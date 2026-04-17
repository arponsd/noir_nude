import {
  getCategoryBySlug as dbGetCategoryBySlug,
  getCategoryTree as dbGetCategoryTree,
  type CategoryDetailDTO,
  type CategoryDTO,
  type CategoryTreeNode,
} from "@/lib/db/queries/categories";
import { listProducts } from "@/lib/db/queries/products";
import { NotFoundError } from "@/lib/api/response";
import type { ProductCardDTO } from "@/lib/db/queries/products";
import type { Category, CategoryTree, CategoryWithProducts } from "@/types/api/categories";
import type { ProductCard } from "@/types/api/products";

function categoryFromDTO(src: CategoryDTO): Category {
  const out: Category = {
    id: src.id,
    slug: src.slug,
    name: src.name,
    parentId: src.parentId,
    order: src.order,
    isActive: src.isActive,
  };
  if (src.description !== undefined) out.description = src.description;
  if (src.image !== undefined) out.image = src.image;
  if (src.seoMeta) out.seoMeta = { ...src.seoMeta };
  return out;
}

function treeFromNode(src: CategoryTreeNode): CategoryTree {
  return {
    ...categoryFromDTO(src),
    children: src.children.map(treeFromNode),
  };
}

function cardFromProductDTO(src: ProductCardDTO): ProductCard {
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

export async function listCategoryTreeService(): Promise<CategoryTree[]> {
  const nodes = await dbGetCategoryTree();
  return nodes.map(treeFromNode);
}

export async function getCategoryWithProductsService(
  slug: string,
  productLimit = 24,
): Promise<CategoryWithProducts> {
  const cat = await dbGetCategoryBySlug(slug);
  if (!cat) throw new NotFoundError("Category not found");
  const listing = await listProducts({
    category: cat.slug,
    page: 1,
    limit: productLimit,
    sort: "newest",
  });
  const detail: CategoryWithProducts = {
    ...categoryFromDTO(cat satisfies CategoryDetailDTO),
    products: listing.items.map(cardFromProductDTO),
  };
  return detail;
}
