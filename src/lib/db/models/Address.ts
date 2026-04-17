import { Schema, model, models } from "mongoose";
import type mongoose from "mongoose";
import type { InferSchemaType, Model, Query } from "mongoose";

const ADDRESS_LABELS = ["home", "office", "other"] as const;

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ADDRESS_LABELS,
      default: "home",
      required: true,
    },
    recipientName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^\+?[1-9]\d{1,14}$/,
    },
    addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
    addressLine2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    district: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, required: true, trim: true, maxlength: 16 },
    country: { type: String, required: true, trim: true, default: "BD", maxlength: 2 },
    isDefault: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

addressSchema.index({ userId: 1, isDefault: 1 });

/**
 * Why this hook: enforce "single default address per user" invariant. When an address is
 * saved as default, clear the flag on all siblings in the same user scope.
 */
addressSchema.pre("save", async function (next) {
  if (!this.isDefault) return next();
  try {
    await (this.constructor as Model<AddressDoc>).updateMany(
      { userId: this.userId, _id: { $ne: this._id }, deletedAt: null },
      { $set: { isDefault: false } },
    );
    next();
  } catch (err) {
    next(err as Error);
  }
});

addressSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type AddressDoc = InferSchemaType<typeof addressSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Address: Model<AddressDoc> =
  (models.Address as Model<AddressDoc> | undefined) ?? model<AddressDoc>("Address", addressSchema);

export { ADDRESS_LABELS };
