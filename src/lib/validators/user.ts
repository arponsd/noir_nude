import { z } from "zod";
import { Types } from "mongoose";
import { SKIN_TYPES } from "@/lib/constants";

/**
 * NOTE(backend↔database): `SKIN_TYPES` in constants includes "acne-prone" and "mature",
 * but the current User Mongoose enum is narrower (`normal|dry|oily|combination|sensitive`).
 * Profile writes with the extended values will currently fail Mongoose validation — this
 * is tracked as a DB ASK (widen User.skinType enum to match constants).
 */

/**
 * User / profile / review / GDPR boundary schemas.
 *
 * All object schemas use `.strict()` so unknown keys are rejected at the entry — we
 * never want callers sneaking extra fields through to the services.
 */

const objectIdSchema = z
  .string()
  .trim()
  .refine((v) => Types.ObjectId.isValid(v), { message: "Invalid ObjectId" });

/**
 * E.164 format mirrored from commerce validators — kept local so this module does not
 * have to import across validator boundaries.
 */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, { message: "Phone must be in E.164 format (e.g. +8801XXXXXXXXX)" });

/** ISO date (YYYY-MM-DD) or full ISO timestamp. Coerced to a Date by callers. */
const isoDateSchema = z
  .string()
  .trim()
  .refine(
    (v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d.getTime() <= Date.now();
    },
    { message: "Date of birth must be a valid past date" },
  );

const skinTypeSchema = z.enum(SKIN_TYPES);

/* ---------- Profile ---------- */

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: phoneSchema.optional(),
    dateOfBirth: isoDateSchema.optional(),
    skinType: skinTypeSchema.optional(),
  })
  .strict();
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const notificationPrefsSchema = z
  .object({
    orderUpdates: z.boolean(),
    promos: z.boolean(),
    newsletter: z.boolean(),
  })
  .strict();
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;

/** Accepts any Cloudinary-hosted URL; the service re-validates the hostname before storing. */
export const avatarUpdateSchema = z
  .object({
    url: z.string().trim().url().max(2048),
  })
  .strict();
export type AvatarUpdateInput = z.infer<typeof avatarUpdateSchema>;

/* ---------- Reviews ---------- */

export const reviewSubmitSchema = z
  .object({
    productId: objectIdSchema,
    orderId: objectIdSchema,
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().min(3).max(140),
    body: z.string().trim().min(10).max(4000),
    images: z.array(z.string().trim().url().max(2048)).max(3).optional(),
    // reason: `null` is an explicit "opt out" signal; distinguishes from "omitted".
    skinTypeAtReview: skinTypeSchema.nullable().optional(),
  })
  .strict();
export type ReviewSubmitInputSchema = z.infer<typeof reviewSubmitSchema>;

/**
 * Body shape for the helpful toggle endpoint. In practice the route reads `reviewId`
 * from the path param, but exporting the schema lets actions share validation.
 */
export const reviewHelpfulSchema = z
  .object({
    reviewId: objectIdSchema,
  })
  .strict();
export type ReviewHelpfulInput = z.infer<typeof reviewHelpfulSchema>;

export const adminReviewModerationSchema = z
  .object({
    isApproved: z.boolean(),
    adminReply: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();
export type AdminReviewModerationInput = z.infer<typeof adminReviewModerationSchema>;

/* ---------- GDPR ---------- */

/**
 * Literal confirmation phrase is mandatory to prevent accidental DELETE calls. The
 * phrase is deliberately loud and not i18n-ed — the destructive contract stays stable.
 */
export const deleteAccountSchema = z
  .object({
    confirmation: z.literal("DELETE MY ACCOUNT"),
  })
  .strict();
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
