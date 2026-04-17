import { Types } from "mongoose";
import { Product, toProductSlug } from "@/lib/db/models/Product";
import { connectDb } from "@/lib/db/connect";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/constants";
import logger from "@/lib/utils/logger";
import type {
  CreateProductInput,
  UpdateProductInput,
  AdminListProductsQuery,
} from "@/lib/validators/admin-products";
import type { AdminProductListPage, AdminProductRow, ProductDetail } from "@/types/api/products";
import { getProductDetailService } from "./product";

type AdminLeanProduct = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  basePrice: number;
  comparePrice?: number;
  images?: { url: string; alt?: string; order?: number }[];
  rating?: { avg: number; count: number };
  badges?: string[];
  variants?: { _id: Types.ObjectId; name: string; image?: string }[];
  isActive: boolean;
  isFeatured: boolean;
  deletedAt: Date | null;
  updatedAt: Date;
};

function rowFromLean(p: AdminLeanProduct): AdminProductRow {
  const thumb = p.images?.[0]?.url;
  const row: AdminProductRow = {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    basePrice: p.basePrice,
    rating: { avg: p.rating?.avg ?? 0, count: p.rating?.count ?? 0 },
    badges: p.badges ?? [],
    variants: (p.variants ?? []).map((v) => {
      const out: AdminProductRow["variants"][number] = { id: v._id.toString(), name: v.name };
      if (v.image) out.image = v.image;
      return out;
    }),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    updatedAt: p.updatedAt.toISOString(),
  };
  if (p.comparePrice !== undefined) row.comparePrice = p.comparePrice;
  if (thumb) row.thumbUrl = thumb;
  return row;
}

export async function adminListProducts(
  query: AdminListProductsQuery,
): Promise<AdminProductListPage> {
  await connectDb();

  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 24, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (!query.includeDeleted) filter.deletedAt = null;
  if (!query.includeInactive) filter.isActive = true;
  if (query.brand) filter.brand = query.brand;
  if (query.q) filter.$text = { $search: query.q };

  const sort: Record<string, 1 | -1> = query.sort ? parseSort(query.sort) : { updatedAt: -1 };

  const mongoQuery = Product.find(filter).setOptions({
    withDeleted: Boolean(query.includeDeleted),
  });

  const [rawItems, total] = await Promise.all([
    mongoQuery.sort(sort).skip(skip).limit(limit).lean<AdminLeanProduct[]>(),
    Product.countDocuments(filter).setOptions({
      withDeleted: Boolean(query.includeDeleted),
    }),
  ]);

  const items = rawItems.map(rowFromLean);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items, page, limit, total, totalPages };
}

function parseSort(sort: string): Record<string, 1 | -1> {
  const [field, dir] = sort.split(":");
  const f = (field ?? "").trim();
  const d: 1 | -1 = (dir ?? "desc").toLowerCase() === "asc" ? 1 : -1;
  const allowed = new Set(["createdAt", "updatedAt", "basePrice", "name", "totalSold"]);
  if (!allowed.has(f)) return { updatedAt: -1 };
  return { [f]: d };
}

export async function adminGetProduct(id: string): Promise<ProductDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Product not found");
  const doc = await Product.findById(id)
    .setOptions({ withDeleted: true })
    .select({ slug: 1 })
    .lean<{ _id: Types.ObjectId; slug: string } | null>();
  if (!doc) throw new NotFoundError("Product not found");
  return getProductDetailService(doc.slug);
}

export async function createProduct(
  input: CreateProductInput,
  actorId: string,
): Promise<{ id: string; slug: string }> {
  await connectDb();

  const slug = (input.slug ?? toProductSlug(input.name)).trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ValidationError("Invalid slug", ERROR_CODES.VALIDATION_FAILED);
  }

  const clash = await Product.findOne({ slug })
    .setOptions({ withDeleted: true })
    .select({ _id: 1 })
    .lean();
  if (clash) throw new ValidationError("Slug already in use", ERROR_CODES.VALIDATION_FAILED);

  const created = await Product.create({
    name: input.name,
    slug,
    description: input.description,
    ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
    categoryId: new Types.ObjectId(input.categoryId),
    brand: input.brand,
    basePrice: input.basePrice,
    ...(input.comparePrice !== undefined ? { comparePrice: input.comparePrice } : {}),
    ingredients: input.ingredients ?? [],
    allergens: input.allergens ?? [],
    skinTypes: input.skinTypes ?? [],
    badges: input.badges ?? [],
    tags: input.tags ?? [],
    images: input.images,
    variants: input.variants,
    isFeatured: input.isFeatured ?? false,
    isActive: input.isActive ?? true,
    ...(input.seoMeta ? { seoMeta: input.seoMeta } : {}),
  });

  logger.info(
    { actorId, action: "create", entity: "product", entityId: created._id.toString() },
    "admin_product_action",
  );

  return { id: created._id.toString(), slug: created.slug };
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  actorId: string,
): Promise<{ id: string; slug: string }> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Product not found");

  const patch: Record<string, unknown> = { ...input };
  if (input.categoryId) patch.categoryId = new Types.ObjectId(input.categoryId);
  if (input.slug) {
    const s = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      throw new ValidationError("Invalid slug", ERROR_CODES.VALIDATION_FAILED);
    }
    const clash = await Product.findOne({ slug: s, _id: { $ne: id } })
      .setOptions({ withDeleted: true })
      .select({ _id: 1 })
      .lean();
    if (clash) throw new ValidationError("Slug already in use", ERROR_CODES.VALIDATION_FAILED);
    patch.slug = s;
  }

  const updated = await Product.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, runValidators: true },
  )
    .setOptions({ withDeleted: true })
    .select({ slug: 1 })
    .lean<{ _id: Types.ObjectId; slug: string } | null>();

  if (!updated) throw new NotFoundError("Product not found");

  logger.info(
    { actorId, action: "update", entity: "product", entityId: id },
    "admin_product_action",
  );

  return { id: updated._id.toString(), slug: updated.slug };
}

export async function softDeleteProduct(
  id: string,
  actorId: string,
): Promise<{ id: string; deletedAt: string }> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Product not found");

  const now = new Date();
  const updated = await Product.findByIdAndUpdate(
    id,
    { $set: { deletedAt: now, isActive: false } },
    { new: true },
  )
    .setOptions({ withDeleted: true })
    .select({ _id: 1, deletedAt: 1 })
    .lean<{ _id: Types.ObjectId; deletedAt: Date | null } | null>();

  if (!updated) throw new NotFoundError("Product not found");

  logger.info(
    { actorId, action: "soft_delete", entity: "product", entityId: id },
    "admin_product_action",
  );

  return {
    id: updated._id.toString(),
    deletedAt: (updated.deletedAt ?? now).toISOString(),
  };
}
