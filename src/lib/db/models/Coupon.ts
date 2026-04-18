import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { InferSchemaType, Model, Query } from "mongoose";

const COUPON_TYPES = ["percentage", "fixed", "free_shipping"] as const;
const CODE_REGEX = /^[A-Z0-9_-]{3,24}$/;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 24,
      set: (v: unknown) => (typeof v === "string" ? v.toUpperCase() : v),
    },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, required: true, min: 0, validate: Number.isInteger },
    minOrderAmount: { type: Number, min: 0, validate: Number.isInteger },
    maxDiscount: { type: Number, min: 0, validate: Number.isInteger },
    usageLimit: { type: Number, min: 0, validate: Number.isInteger },
    usedCount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    perUserLimit: { type: Number, min: 0, validate: Number.isInteger },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableCategories: { type: [Schema.Types.ObjectId], ref: "Category", default: [] },
    applicableProducts: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

couponSchema.index({ isActive: 1, validUntil: 1 });

/**
 * Why this hook: guarantee the stored `code` matches the public regex contract
 * even if a caller bypasses the setter (e.g. `updateOne` with a lowercased value
 * going through save()). Percentage coupons also need 0..100 bounds.
 */
couponSchema.pre("validate", function (next) {
  if (this.code) this.code = this.code.toUpperCase();
  if (this.code && !CODE_REGEX.test(this.code)) {
    return next(new Error(`Coupon.code must match ${CODE_REGEX}`));
  }
  if (this.type === "percentage" && (this.value < 0 || this.value > 100)) {
    return next(new Error("Coupon.value for percentage must be 0-100"));
  }
  if (this.validFrom && this.validUntil && this.validFrom > this.validUntil) {
    return next(new Error("Coupon.validFrom must be <= validUntil"));
  }
  next();
});

couponSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type CouponDoc = InferSchemaType<typeof couponSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Coupon: Model<CouponDoc> =
  (models.Coupon as Model<CouponDoc> | undefined) ?? model<CouponDoc>("Coupon", couponSchema);

export { COUPON_TYPES, CODE_REGEX as COUPON_CODE_REGEX };
