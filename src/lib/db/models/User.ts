import { Schema, model, models } from "mongoose";
import type mongoose from "mongoose";
import type { InferSchemaType, Model, Query } from "mongoose";

const ROLES = ["customer", "admin", "manager", "support"] as const;
const SKIN_TYPES = ["normal", "dry", "oily", "combination", "sensitive"] as const;
const TIERS = ["silver", "gold", "platinum"] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, match: /^\+?[1-9]\d{1,14}$/ },
    avatar: { type: String },
    role: { type: String, enum: ROLES, default: "customer", required: true },

    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    dateOfBirth: { type: Date },
    skinType: { type: String, enum: SKIN_TYPES },

    loyaltyPoints: { type: Number, default: 0, min: 0 },
    tier: { type: String, enum: TIERS, default: "silver", required: true },

    referralCode: { type: String, trim: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true },
);

// reason: email already has field-level `unique: true` — redeclaring here would trigger
// Mongoose duplicate-index warnings at model compile time.
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });

/**
 * Why this hook: soft-deleted users must be hidden from every default query
 * unless the caller explicitly opts in via `.setOptions({ withDeleted: true })`.
 */
userSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc> | undefined) ?? model<UserDoc>("User", userSchema);

export { ROLES as USER_ROLES, SKIN_TYPES as USER_SKIN_TYPES, TIERS as USER_TIERS };
