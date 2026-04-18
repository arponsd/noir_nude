import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { InferSchemaType, Model, Query } from "mongoose";
import { USER_SKIN_TYPES } from "./User";

const MAX_REVIEW_IMAGES = 3;

const reviewImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { _id: false, timestamps: false },
);

const adminReplySchema = new Schema(
  {
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    repliedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false, timestamps: false },
);

const reviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: Number.isInteger,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 4000,
    },
    images: { type: [reviewImageSchema], default: [] },
    skinTypeAtReview: {
      type: String,
      enum: [...USER_SKIN_TYPES, null],
      default: null,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isInteger,
    },
    helpfulVoters: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isVerified: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    adminReply: { type: adminReplySchema, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reviewSchema.index(
  { productId: 1, isApproved: 1, createdAt: -1 },
  { name: "product_approved_recent" },
);
reviewSchema.index({ userId: 1 });
reviewSchema.index({ productId: 1, rating: 1 }, { name: "product_rating" });
reviewSchema.index(
  { userId: 1, productId: 1, orderId: 1 },
  { unique: true, name: "user_product_order_unique" },
);

/**
 * Why this hook: cap review images at MAX_REVIEW_IMAGES. Mongoose has no declarative
 * array-max constraint so we enforce it here before validation finishes.
 */
reviewSchema.pre("validate", function (next) {
  if (this.images && this.images.length > MAX_REVIEW_IMAGES) {
    return next(new Error(`Review cannot have more than ${MAX_REVIEW_IMAGES} images`));
  }
  next();
});

reviewSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type ReviewImageDoc = InferSchemaType<typeof reviewImageSchema>;
export type ReviewAdminReply = InferSchemaType<typeof adminReplySchema>;
export type ReviewDoc = InferSchemaType<typeof reviewSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Review: Model<ReviewDoc> =
  (models.Review as Model<ReviewDoc> | undefined) ?? model<ReviewDoc>("Review", reviewSchema);

export { MAX_REVIEW_IMAGES };
