import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { InferSchemaType, Model, Query } from "mongoose";

const wishlistItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, default: null },
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: false, timestamps: false },
);

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [wishlistItemSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

wishlistSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type WishlistItemDoc = InferSchemaType<typeof wishlistItemSchema>;
export type WishlistDoc = InferSchemaType<typeof wishlistSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Wishlist: Model<WishlistDoc> =
  (models.Wishlist as Model<WishlistDoc> | undefined) ??
  model<WishlistDoc>("Wishlist", wishlistSchema);
