import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { InferSchemaType, Model, Query } from "mongoose";

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const variantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    // Integer paisa. 1 BDT = 100 paisa. Never store floats.
    price: { type: Number, required: true, min: 0, validate: Number.isInteger },
    // Integer paisa; optional strikethrough reference price.
    comparePrice: { type: Number, min: 0, validate: Number.isInteger },
    stock: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    reservedStock: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, timestamps: false },
);

const ratingSchema = new Schema(
  {
    avg: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const seoMetaSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 160 },
    ogImage: { type: String },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 280 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, required: true, trim: true },
    images: { type: [imageSchema], default: [] },
    variants: { type: [variantSchema], default: [] },

    // Integer paisa. Default purchase price when no variant is selected.
    basePrice: { type: Number, required: true, min: 0, validate: Number.isInteger },
    // Integer paisa.
    comparePrice: { type: Number, min: 0, validate: Number.isInteger },

    ingredients: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    skinTypes: { type: [String], default: [] },
    badges: { type: [String], default: [] },
    tags: { type: [String], default: [], index: false },

    rating: { type: ratingSchema, default: () => ({ avg: 0, count: 0 }) },
    totalSold: { type: Number, default: 0, min: 0 },

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    seoMeta: { type: seoMetaSchema, default: () => ({}) },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// reason: slug already has field-level `unique: true` — omit the redundant compound decl
productSchema.index({ categoryId: 1 });
productSchema.index({ tags: 1 });
productSchema.index(
  { isActive: 1, isFeatured: 1, createdAt: -1 },
  { name: "active_featured_recent" },
);
productSchema.index(
  { name: "text", description: "text", brand: "text" },
  {
    name: "product_text",
    weights: { name: 10, description: 5, brand: 2 },
    default_language: "english",
  },
);
productSchema.index(
  { "variants.sku": 1 },
  { unique: true, sparse: true, name: "variant_sku_unique" },
);

productSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }
  next();
});

productSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type ProductDoc = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ProductVariantDoc = InferSchemaType<typeof variantSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc> | undefined) ?? model<ProductDoc>("Product", productSchema);

export { toSlug as toProductSlug };
