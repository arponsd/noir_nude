import { z } from "zod";
import { Types } from "mongoose";
import { ORDER_STATUSES } from "@/lib/constants";

/**
 * Zod validators for admin-only boundaries. All schemas use `.strict()` — unknown
 * keys are rejected so accidental client payload pollution never hits the services.
 *
 * Money is integer paisa throughout. ObjectIds are validated by shape (not DB lookup).
 */

const objectIdSchema = z
  .string()
  .trim()
  .refine((v) => Types.ObjectId.isValid(v), { message: "Invalid ObjectId" });

const paisaInt = z.number().int().nonnegative();
const positiveInt = z.number().int().positive();

const isoDateSchema = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid ISO date" });

const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,24}$/, { message: "Code must match ^[A-Z0-9_-]{3,24}$" });

const COUPON_TYPES = ["percentage", "fixed", "free_shipping"] as const;

/* ------------------------------------------------------------------ Orders */

/**
 * Admin order status update — matches the status route behaviour. Kept here as the
 * single source of truth so the status route can be refactored to import from it.
 */
export const adminOrderStatusUpdateSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    note: z.string().trim().min(1).max(1000).optional(),
    trackingNumber: z.string().trim().min(1).max(100).optional(),
    courier: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type AdminOrderStatusUpdateInput = z.infer<typeof adminOrderStatusUpdateSchema>;

/** Refund stub — records an ActivityLog entry only; actual payment refund is post-MVP. */
export const adminRefundSchema = z
  .object({
    amount: positiveInt,
    reason: z.string().trim().min(3).max(500),
  })
  .strict();
export type AdminRefundInput = z.infer<typeof adminRefundSchema>;

export const adminOrdersQuerySchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    q: z.string().trim().min(1).max(200).optional(),
    page: z.coerce.number().int().min(1).max(10_000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

/* ---------------------------------------------------------------- Inventory */

export const adminInventoryAdjustSchema = z
  .object({
    productId: objectIdSchema,
    variantId: objectIdSchema,
    /** Integer delta — can be negative (stock shrink) but must fit int range. */
    delta: z
      .number()
      .int()
      .min(-1_000_000)
      .max(1_000_000)
      .refine((n) => n !== 0, {
        message: "delta must be non-zero",
      }),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();
export type AdminInventoryAdjustInput = z.infer<typeof adminInventoryAdjustSchema>;

/* ------------------------------------------------------------------ Coupons */

const couponBaseFields = {
  code: couponCodeSchema,
  type: z.enum(COUPON_TYPES),
  value: z.number().int().min(0).max(1_000_000_000),
  minOrderAmount: paisaInt.optional(),
  maxDiscount: paisaInt.optional(),
  usageLimit: z.number().int().min(0).max(1_000_000).optional(),
  perUserLimit: z.number().int().min(0).max(10_000).optional(),
  validFrom: isoDateSchema,
  validUntil: isoDateSchema,
  applicableCategories: z.array(objectIdSchema).max(100).optional(),
  applicableProducts: z.array(objectIdSchema).max(500).optional(),
  isActive: z.boolean().optional(),
};

export const adminCouponCreateSchema = z
  .object(couponBaseFields)
  .strict()
  .refine((d) => Date.parse(d.validFrom) < Date.parse(d.validUntil), {
    message: "validFrom must be before validUntil",
    path: ["validUntil"],
  })
  .refine((d) => d.type !== "percentage" || (d.value >= 1 && d.value <= 100), {
    message: "Percentage coupons require value 1..100",
    path: ["value"],
  });
export type AdminCouponCreateInput = z.infer<typeof adminCouponCreateSchema>;

export const adminCouponUpdateSchema = z
  .object({
    code: couponCodeSchema.optional(),
    type: z.enum(COUPON_TYPES).optional(),
    value: z.number().int().min(0).max(1_000_000_000).optional(),
    minOrderAmount: paisaInt.optional(),
    maxDiscount: paisaInt.optional(),
    usageLimit: z.number().int().min(0).max(1_000_000).optional(),
    perUserLimit: z.number().int().min(0).max(10_000).optional(),
    validFrom: isoDateSchema.optional(),
    validUntil: isoDateSchema.optional(),
    applicableCategories: z.array(objectIdSchema).max(100).optional(),
    applicableProducts: z.array(objectIdSchema).max(500).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (d) =>
      d.validFrom === undefined ||
      d.validUntil === undefined ||
      Date.parse(d.validFrom) < Date.parse(d.validUntil),
    { message: "validFrom must be before validUntil", path: ["validUntil"] },
  )
  .refine(
    (d) => d.type !== "percentage" || d.value === undefined || (d.value >= 1 && d.value <= 100),
    { message: "Percentage coupons require value 1..100", path: ["value"] },
  );
export type AdminCouponUpdateInput = z.infer<typeof adminCouponUpdateSchema>;

/* ------------------------------------------------------------------ Banners */

export const adminBannerCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    subtitle: z.string().trim().max(400).optional(),
    imageUrl: z.string().url().max(2048),
    href: z.string().trim().max(2048).optional(),
    cta: z.string().trim().max(60).optional(),
    order: z.number().int().min(0).max(1000).default(0),
    isActive: z.boolean().default(true),
    publishFrom: isoDateSchema.optional(),
    publishUntil: isoDateSchema.optional(),
  })
  .strict()
  .refine(
    (d) =>
      d.publishFrom === undefined ||
      d.publishUntil === undefined ||
      Date.parse(d.publishFrom) <= Date.parse(d.publishUntil),
    { message: "publishFrom must be <= publishUntil", path: ["publishUntil"] },
  );
export type AdminBannerCreateInput = z.infer<typeof adminBannerCreateSchema>;

export const adminBannerUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    subtitle: z.string().trim().max(400).optional(),
    imageUrl: z.string().url().max(2048).optional(),
    href: z.string().trim().max(2048).optional(),
    cta: z.string().trim().max(60).optional(),
    order: z.number().int().min(0).max(1000).optional(),
    isActive: z.boolean().optional(),
    publishFrom: isoDateSchema.optional(),
    publishUntil: isoDateSchema.optional(),
  })
  .strict()
  .refine(
    (d) =>
      d.publishFrom === undefined ||
      d.publishUntil === undefined ||
      Date.parse(d.publishFrom) <= Date.parse(d.publishUntil),
    { message: "publishFrom must be <= publishUntil", path: ["publishUntil"] },
  );
export type AdminBannerUpdateInput = z.infer<typeof adminBannerUpdateSchema>;

export const adminBannerReorderSchema = z
  .object({
    items: z
      .array(z.object({ id: objectIdSchema, order: z.number().int().min(0).max(1000) }).strict())
      .min(1)
      .max(100),
  })
  .strict();
export type AdminBannerReorderInput = z.infer<typeof adminBannerReorderSchema>;

/* ------------------------------------------------------------------ Reports */

export const adminReportsQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    groupBy: z.enum(["day", "week", "month"]).default("day"),
  })
  .strict()
  .refine((d) => Date.parse(d.from) <= Date.parse(d.to), {
    message: "from must be <= to",
    path: ["to"],
  });
export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>;

/* ----------------------------------------------------------------- Activity */

export const adminActivityQuerySchema = z
  .object({
    actorId: objectIdSchema.optional(),
    entity: z.string().trim().min(1).max(60).optional(),
    page: z.coerce.number().int().min(1).max(10_000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();
export type AdminActivityQuery = z.infer<typeof adminActivityQuerySchema>;

/* ---------------------------------------------------------------- Customers */

export const adminCustomersQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    page: z.coerce.number().int().min(1).max(10_000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();
export type AdminCustomersQuery = z.infer<typeof adminCustomersQuerySchema>;

/* ------------------------------------------------------------ Dashboard/misc */

export const adminDashboardQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .strict()
  .refine(
    (d) => d.from === undefined || d.to === undefined || Date.parse(d.from) <= Date.parse(d.to),
    { message: "from must be <= to", path: ["to"] },
  );
export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;
