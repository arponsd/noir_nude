/**
 * User/account API DTOs.
 *
 * `notificationPrefs` is stored on the User document (via strict:false until the DB schema
 * is extended — see profile service for the gap note). Defaults are applied server-side on
 * first read so the frontend always receives a fully-populated object.
 */
import type { SkinType } from "@/lib/constants";

export type UserNotificationPrefs = {
  orderUpdates: boolean;
  promos: boolean;
  newsletter: boolean;
};

export type UserTier = "silver" | "gold" | "platinum";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  /** ISO date string (UTC). */
  dateOfBirth?: string;
  skinType?: SkinType;
  loyaltyPoints: number;
  tier: UserTier;
  referralCode?: string;
  emailVerified: boolean;
  notificationPrefs: UserNotificationPrefs;
};

/**
 * Partial update envelope for PATCH /api/user/profile. `notificationPrefs` lives on a
 * dedicated endpoint so this shape covers name/phone/dateOfBirth/skinType only.
 */
export type UserProfileUpdateInput = {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  skinType?: SkinType;
};

export type UserAvatarInput = {
  url: string;
};

export type UserDeleteAccountInput = {
  confirmation: "DELETE MY ACCOUNT";
};

/**
 * JSON-serialisable export payload returned by `GET /api/user/export`. The exact
 * structure of the nested buckets is owned by the DB helper `exportUserData`; we only
 * commit to the outer envelope here so the route can set a stable `Content-Type`.
 */
export type UserExportEnvelope = {
  exportedAt: string;
  user: Record<string, unknown>;
  addresses: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  cart?: Record<string, unknown>;
  wishlist?: Record<string, unknown>;
};
