import { Schema, model, models } from "mongoose";
import type mongoose from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const couponRedemptionSchema = new Schema(
  {
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    appliedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

// reason: prevents duplicate-apply of the same coupon within the same order; still allows
// a different coupon on a future order by the same user.
couponRedemptionSchema.index(
  { couponId: 1, userId: 1, orderId: 1 },
  { unique: true, name: "coupon_user_order_unique" },
);
couponRedemptionSchema.index({ userId: 1, couponId: 1 });
couponRedemptionSchema.index({ guestEmail: 1, couponId: 1 }, { sparse: true });

export type CouponRedemptionDoc = InferSchemaType<typeof couponRedemptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CouponRedemption: Model<CouponRedemptionDoc> =
  (models.CouponRedemption as Model<CouponRedemptionDoc> | undefined) ??
  model<CouponRedemptionDoc>("CouponRedemption", couponRedemptionSchema);
