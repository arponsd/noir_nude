import { z } from "zod";
import { Types } from "mongoose";
import { BADGES, SKIN_TYPES } from "@/lib/constants";

const objectIdSchema = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: "Invalid ObjectId" });

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const skuSchema = z.string().trim().min(1).max(64);

const paisaInt = z.number().int().nonnegative();
const positiveInt = z.number().int().positive();

const imageInputSchema = z
  .object({
    url: z.string().url().max(2048),
    alt: z.string().trim().max(200).default(""),
    order: z.number().int().min(0).max(1000).default(0),
  })
  .strict();

const variantInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    sku: skuSchema,
    price: positiveInt,
    comparePrice: paisaInt.optional(),
    stock: z.number().int().min(0).default(0),
    reservedStock: z.number().int().min(0).default(0),
    image: z.string().url().max(2048).optional(),
    isActive: z.boolean().default(true),
  })
  .strict()
  .refine((v) => v.comparePrice === undefined || v.comparePrice >= v.price, {
    message: "comparePrice must be >= price",
    path: ["comparePrice"],
  });

const seoMetaSchema = z
  .object({
    title: z.string().trim().max(70).optional(),
    description: z.string().trim().max(160).optional(),
    ogImage: z.string().url().max(2048).optional(),
  })
  .strict();

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    slug: slugSchema.optional(),
    description: z.string().trim().min(10),
    shortDescription: z.string().trim().max(280).optional(),
    categoryId: objectIdSchema,
    brand: z.string().trim().min(1).max(120),
    basePrice: positiveInt,
    comparePrice: paisaInt.optional(),
    ingredients: z.array(z.string().trim().min(1).max(120)).max(200).optional(),
    allergens: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
    skinTypes: z.array(z.enum(SKIN_TYPES)).max(SKIN_TYPES.length).optional(),
    badges: z.array(z.enum(BADGES)).max(BADGES.length).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    images: z.array(imageInputSchema).min(1).max(15),
    variants: z.array(variantInputSchema).min(1).max(50),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    seoMeta: seoMetaSchema.optional(),
  })
  .strict()
  .refine((d) => d.comparePrice === undefined || d.comparePrice >= d.basePrice, {
    message: "comparePrice must be >= basePrice",
    path: ["comparePrice"],
  });

export const updateProductSchema = createProductSchema
  .innerType()
  .partial()
  .strict()
  .refine(
    (d) =>
      d.comparePrice === undefined || d.basePrice === undefined || d.comparePrice >= d.basePrice,
    { message: "comparePrice must be >= basePrice", path: ["comparePrice"] },
  );

export const adminListProductsQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    category: slugSchema.optional(),
    brand: z.string().trim().min(1).max(120).optional(),
    includeInactive: z.coerce.boolean().optional(),
    includeDeleted: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().trim().min(1).max(60).optional(),
  })
  .strict();

export const adminProductIdParamSchema = z.object({ id: objectIdSchema });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdminListProductsQuery = z.infer<typeof adminListProductsQuerySchema>;
