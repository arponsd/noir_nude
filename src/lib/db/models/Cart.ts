import { Schema, model, models } from "mongoose";
import type mongoose from "mongoose";
import type { InferSchemaType, Model, Query } from "mongoose";

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
      validate: Number.isInteger,
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isInteger,
    },
  },
  { _id: false, timestamps: false },
);

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, trim: true, uppercase: true, maxlength: 24 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

cartSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type CartItemDoc = InferSchemaType<typeof cartItemSchema>;
export type CartDoc = InferSchemaType<typeof cartSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Cart: Model<CartDoc> =
  (models.Cart as Model<CartDoc> | undefined) ?? model<CartDoc>("Cart", cartSchema);
