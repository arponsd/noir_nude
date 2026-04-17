import { z } from "zod";
import { Types } from "mongoose";

/**
 * Zod validators for commerce boundaries (cart, wishlist, addresses, orders, coupons).
 *
 * All object schemas use `.strict()` — unknown keys are rejected at the boundary so that
 * clients cannot sneak extra fields through to the service layer.
 */

const objectIdSchema = z
  .string()
  .trim()
  .refine((v) => Types.ObjectId.isValid(v), { message: "Invalid ObjectId" });

/**
 * E.164 format: `+` followed by 1-15 digits where the first digit is 1-9.
 * Matches the regex used on the User model phone field.
 */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, { message: "Phone must be in E.164 format (e.g. +8801XXXXXXXXX)" });

const emailSchema = z.string().trim().toLowerCase().email().max(254);

const quantitySchema = z.number().int().min(1).max(99);

const notesSchema = z.string().trim().max(500);

/**
 * Address label matches the DB enum on `Address.label` ("home"|"office"|"other").
 * Kept here (rather than imported from models) because validators must not import DB.
 */
export const ADDRESS_LABELS = ["home", "office", "other"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

/** Address input — strict, with default country "BD" and E.164 phone. */
export const addressInputSchema = z
  .object({
    label: z.enum(ADDRESS_LABELS).default("home"),
    recipientName: z.string().trim().min(1).max(120),
    phone: phoneSchema,
    addressLine1: z.string().trim().min(1).max(200),
    addressLine2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(1).max(80),
    district: z.string().trim().min(1).max(80),
    postalCode: z.string().trim().min(3).max(20),
    country: z.string().trim().length(2).toUpperCase().default("BD"),
  })
  .strict();

export type AddressInputSchema = z.infer<typeof addressInputSchema>;

/** Partial update for address — still strict, all fields optional. */
export const addressUpdateSchema = addressInputSchema.partial().strict();
export type AddressUpdateSchema = z.infer<typeof addressUpdateSchema>;

export const addCartItemSchema = z
  .object({
    productId: objectIdSchema,
    variantId: objectIdSchema,
    quantity: quantitySchema,
  })
  .strict();
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z
  .object({
    quantity: quantitySchema,
  })
  .strict();
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

/** Coupon codes are upper-cased, max 24 chars, trimmed. */
export const applyCouponSchema = z
  .object({
    code: z.string().trim().min(1).max(24).toUpperCase(),
  })
  .strict();
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

/** Wishlist toggle — variant is optional (product-level wishlist). */
export const wishlistToggleSchema = z
  .object({
    productId: objectIdSchema,
    variantId: objectIdSchema.optional(),
  })
  .strict();
export type WishlistToggleInput = z.infer<typeof wishlistToggleSchema>;

/** Place-order (authenticated user, cart-driven). */
export const placeOrderSchema = z
  .object({
    addressId: objectIdSchema,
    billingAddressId: objectIdSchema.optional(),
    couponCode: z.string().trim().min(1).max(24).toUpperCase().optional(),
    notes: notesSchema.optional(),
  })
  .strict();
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

const guestOrderItemSchema = z
  .object({
    productId: objectIdSchema,
    variantId: objectIdSchema,
    quantity: quantitySchema,
  })
  .strict();

/** Place-order for guest checkout — inline address + items (no server cart). */
export const guestPlaceOrderSchema = z
  .object({
    guestEmail: emailSchema,
    phone: phoneSchema,
    shippingAddress: addressInputSchema,
    billingAddress: addressInputSchema.optional(),
    items: z.array(guestOrderItemSchema).min(1).max(50),
    couponCode: z.string().trim().min(1).max(24).toUpperCase().optional(),
    notes: notesSchema.optional(),
  })
  .strict();
export type GuestPlaceOrderInput = z.infer<typeof guestPlaceOrderSchema>;

export const cancelOrderSchema = z
  .object({
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
