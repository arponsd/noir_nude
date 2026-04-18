import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { InferSchemaType, Model, Query } from "mongoose";
import { ORDER_STATUSES } from "@/lib/constants";

const PAYMENT_METHODS = ["cod"] as const;
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

/**
 * Generates a human-readable unique-ish order number of the form
 * `GC-YYYYMMDD-XXXXX`. The 5-char suffix is base36 upper. A DB unique index
 * on `orderNumber` is the final authority; callers should retry on collision.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  // reason: 5 base36 chars -> 60M combinations; combined w/ date prefix keeps collision
  // probability negligible for realistic daily volume.
  const rand = Math.floor(Math.random() * 36 ** 5)
    .toString(36)
    .toUpperCase()
    .padStart(5, "0");
  return `GC-${y}${m}${d}-${rand}`;
}

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    sku: { type: String, required: true, trim: true, uppercase: true },
    price: { type: Number, required: true, min: 0, validate: Number.isInteger },
    quantity: { type: Number, required: true, min: 1, max: 99, validate: Number.isInteger },
    subtotal: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { _id: false, timestamps: false },
);

const addressSnapshotSchema = new Schema(
  {
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, match: /^\+?[1-9]\d{1,14}$/ },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "BD" },
  },
  { _id: false, timestamps: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, trim: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    changedAt: { type: Date, default: () => new Date(), required: true },
  },
  { _id: false, timestamps: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    items: { type: [orderItemSchema], required: true, default: [] },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema },
    subtotal: { type: Number, required: true, min: 0, validate: Number.isInteger },
    discount: { type: Number, required: true, default: 0, min: 0, validate: Number.isInteger },
    shippingFee: { type: Number, required: true, default: 0, min: 0, validate: Number.isInteger },
    tax: { type: Number, required: true, default: 0, min: 0, validate: Number.isInteger },
    total: { type: Number, required: true, min: 0, validate: Number.isInteger },
    couponCode: { type: String, trim: true, uppercase: true, maxlength: 24 },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
      default: "placed",
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    trackingNumber: { type: String, trim: true },
    courier: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    placedAt: { type: Date, required: true, default: () => new Date() },
    deliveredAt: { type: Date },
    isTest: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ placedAt: -1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ guestEmail: 1 }, { sparse: true });

/**
 * Why this hook: enforce "at least one of userId/guestEmail present" invariant + seed
 * the statusHistory with the initial 'placed' entry on creation. Mongoose doesn't express
 * XOR constraints declaratively.
 */
orderSchema.pre("validate", function (next) {
  if (!this.userId && !this.guestEmail) {
    return next(new Error("Order requires either userId or guestEmail"));
  }
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory.push({
      status: this.orderStatus ?? "placed",
      changedBy: null,
      changedAt: this.placedAt ?? new Date(),
    });
  }
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = generateOrderNumber(this.placedAt ?? new Date());
  }
  next();
});

orderSchema.pre(/^find/, function (this: Query<unknown, unknown>, next) {
  const opts = this.getOptions() as { withDeleted?: boolean };
  if (!opts.withDeleted) {
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  }
  next();
});

export type OrderItemDoc = InferSchemaType<typeof orderItemSchema>;
export type OrderAddressSnapshot = InferSchemaType<typeof addressSnapshotSchema>;
export type OrderStatusHistoryEntry = InferSchemaType<typeof statusHistorySchema>;
export type OrderDoc = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order: Model<OrderDoc> =
  (models.Order as Model<OrderDoc> | undefined) ?? model<OrderDoc>("Order", orderSchema);

export { PAYMENT_METHODS, PAYMENT_STATUSES };
