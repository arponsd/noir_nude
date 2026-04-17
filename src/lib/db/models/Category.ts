import { Schema, model, models } from "mongoose";
import type mongoose from "mongoose";
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

const seoMetaSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 160 },
    ogImage: { type: String },
  },
  { _id: false },
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    description: { type: String, trim: true },
    image: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoMeta: { type: seoMetaSchema, default: () => ({}) },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// reason: slug already has field-level `unique: true` — avoid duplicate-index warning
categorySchema.index({ parentId: 1 });

categorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }
  next();
});

/**
 * Why this check: category tree is capped at depth 2 (root → child). If the would-be
 * parent already has its own parentId, attaching here would create a grandchild.
 */
categorySchema.pre("save", async function (next) {
  if (!this.parentId) return next();
  try {
    const parent = await (this.constructor as Model<CategoryDoc>)
      .findById(this.parentId)
      .select({ parentId: 1 })
      .lean();
    if (!parent) return next(new Error("Category.parentId references a non-existent category"));
    if (parent.parentId) {
      return next(new Error("Category tree depth exceeds max of 2"));
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

categorySchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type CategoryDoc = InferSchemaType<typeof categorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc> | undefined) ??
  model<CategoryDoc>("Category", categorySchema);

export { toSlug as toCategorySlug };
