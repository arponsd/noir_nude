import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { InferSchemaType, Model, Query } from "mongoose";

const bannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 300 },
    imageUrl: { type: String, required: true, trim: true },
    href: { type: String, trim: true, maxlength: 500 },
    cta: { type: String, trim: true, maxlength: 80 },
    order: { type: Number, default: 0, validate: Number.isInteger },
    isActive: { type: Boolean, default: true },
    /**
     * When null -> "draft" (never surfaced to shoppers).
     * When set  -> "scheduled/active" — becomes eligible once `publishFrom <= now`.
     */
    publishFrom: { type: Date, default: null },
    publishUntil: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bannerSchema.index({ isActive: 1, order: 1 }, { name: "banner_active_order" });

bannerSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type BannerDoc = InferSchemaType<typeof bannerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Banner: Model<BannerDoc> =
  (models.Banner as Model<BannerDoc> | undefined) ?? model<BannerDoc>("Banner", bannerSchema);
