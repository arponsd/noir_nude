import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { User, type UserDoc } from "@/lib/db/models/User";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import { ERROR_CODES, type SkinType } from "@/lib/constants";
import type {
  UserNotificationPrefs,
  UserProfile,
  UserProfileUpdateInput,
  UserTier,
} from "@/types/api/user";

/* ----------------------------------------------------------------------------
 * Profile service.
 *
 * ASK(database): the User schema does not yet declare `notificationPrefs`. We persist
 * it via `strict: false` writes for MVP (same trick used for `passwordChangedAt`). When
 * the DB agent lands the field, remove the `strict: false` flag and add defaults at the
 * schema level so this read-time fallback can be dropped.
 * -------------------------------------------------------------------------- */

const DEFAULT_NOTIFICATION_PREFS: UserNotificationPrefs = {
  orderUpdates: true,
  promos: false,
  newsletter: false,
};

/** The User doc may or may not carry `notificationPrefs` depending on seed date. */
type UserDocWithNotifPrefs = UserDoc & {
  notificationPrefs?: Partial<UserNotificationPrefs>;
};

function normalizePrefs(raw: Partial<UserNotificationPrefs> | undefined): UserNotificationPrefs {
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
  return {
    orderUpdates:
      typeof raw.orderUpdates === "boolean"
        ? raw.orderUpdates
        : DEFAULT_NOTIFICATION_PREFS.orderUpdates,
    promos: typeof raw.promos === "boolean" ? raw.promos : DEFAULT_NOTIFICATION_PREFS.promos,
    newsletter:
      typeof raw.newsletter === "boolean" ? raw.newsletter : DEFAULT_NOTIFICATION_PREFS.newsletter,
  };
}

function userDocToProfile(doc: UserDocWithNotifPrefs): UserProfile {
  const profile: UserProfile = {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    loyaltyPoints: doc.loyaltyPoints ?? 0,
    tier: (doc.tier ?? "silver") as UserTier,
    emailVerified: doc.emailVerified ?? false,
    notificationPrefs: normalizePrefs(doc.notificationPrefs),
  };
  if (doc.phone) profile.phone = doc.phone;
  if (doc.avatar) profile.avatar = doc.avatar;
  if (doc.dateOfBirth) profile.dateOfBirth = doc.dateOfBirth.toISOString();
  if (doc.skinType) profile.skinType = doc.skinType as SkinType;
  if (doc.referralCode) profile.referralCode = doc.referralCode;
  return profile;
}

async function loadUser(userId: string): Promise<UserDocWithNotifPrefs> {
  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");
  const doc = await User.findById(userId).lean<UserDocWithNotifPrefs | null>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  await connectDb();
  const doc = await loadUser(userId);
  return userDocToProfile(doc);
}

export async function updateProfile(
  userId: string,
  input: UserProfileUpdateInput,
): Promise<UserProfile> {
  await connectDb();
  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name.trim();
  if (input.phone !== undefined) set.phone = input.phone;
  if (input.dateOfBirth !== undefined) {
    const d = new Date(input.dateOfBirth);
    if (Number.isNaN(d.getTime())) {
      throw new ValidationError("Invalid date of birth", ERROR_CODES.VALIDATION_FAILED);
    }
    set.dateOfBirth = d;
  }
  if (input.skinType !== undefined) set.skinType = input.skinType;

  if (Object.keys(set).length === 0) {
    // Nothing to change — return the current profile so callers are idempotent.
    return getProfile(userId);
  }

  const updated = await User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    { $set: set },
    { new: true, runValidators: true },
  ).lean<UserDocWithNotifPrefs | null>();

  if (!updated) throw new NotFoundError("User not found");
  return userDocToProfile(updated);
}

const CLOUDINARY_URL_PATTERN = /^https:\/\/res\.cloudinary\.com\/[\w-]+\//i;

export async function updateAvatar(userId: string, avatarUrl: string): Promise<UserProfile> {
  await connectDb();
  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");

  if (!CLOUDINARY_URL_PATTERN.test(avatarUrl)) {
    throw new ValidationError(
      "Avatar must be a Cloudinary-hosted URL",
      ERROR_CODES.VALIDATION_FAILED,
    );
  }

  const updated = await User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    { $set: { avatar: avatarUrl } },
    { new: true, runValidators: true },
  ).lean<UserDocWithNotifPrefs | null>();

  if (!updated) throw new NotFoundError("User not found");
  return userDocToProfile(updated);
}

/**
 * Writes the prefs with `strict: false` so Mongoose accepts the unknown field. When the
 * DB agent adds the schema field this flag becomes a no-op and can stay safely.
 */
export async function updateNotificationPrefs(
  userId: string,
  prefs: UserNotificationPrefs,
): Promise<UserProfile> {
  await connectDb();
  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");

  const updated = await User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    { $set: { notificationPrefs: prefs } },
    {
      new: true,
      // reason: User schema does not yet declare notificationPrefs. See module ASK note.
      strict: false,
    },
  ).lean<UserDocWithNotifPrefs | null>();

  if (!updated) throw new NotFoundError("User not found");
  return userDocToProfile(updated);
}
