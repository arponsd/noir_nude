import type { Types } from "mongoose";
import { NotFoundError } from "@/lib/api/response";
import { Address } from "@/lib/db/models/Address";
import { Cart } from "@/lib/db/models/Cart";
import { Order } from "@/lib/db/models/Order";
import { Review } from "@/lib/db/models/Review";
import { User } from "@/lib/db/models/User";
import { Wishlist } from "@/lib/db/models/Wishlist";

type UserProfileExport = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  dateOfBirth?: string;
  skinType?: string;
  loyaltyPoints: number;
  tier: string;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserExportPayload = {
  exportedAt: string;
  profile: UserProfileExport;
  addresses: unknown[];
  cart: unknown | null;
  wishlist: unknown | null;
  orders: unknown[];
  reviews: unknown[];
  loyaltyEvents: unknown[];
  consents: unknown[];
};

type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  emailVerified?: boolean;
  dateOfBirth?: Date;
  skinType?: string;
  loyaltyPoints?: number;
  tier?: string;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Assembles a JSON-serializable bundle of everything a user can request under GDPR
 * right-to-access. Password hashes, reset tokens, and other secret fields are excluded.
 * Loyalty events and consent logs are stubs for MVP — empty arrays today, slot for
 * future models.
 */
export async function exportUserData(userId: Types.ObjectId | string): Promise<UserExportPayload> {
  const user = await User.findOne({ _id: userId })
    .select({
      passwordHash: 0,
      emailVerificationToken: 0,
      passwordResetToken: 0,
      passwordResetExpiry: 0,
    })
    .lean<LeanUser | null>();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const [addresses, cart, wishlist, orders, reviews] = await Promise.all([
    Address.find({ userId }).lean(),
    Cart.findOne({ userId }).lean(),
    Wishlist.findOne({ userId }).lean(),
    Order.find({ userId }).sort({ placedAt: -1 }).lean(),
    Review.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const profile: UserProfileExport = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified ?? false,
    loyaltyPoints: user.loyaltyPoints ?? 0,
    tier: user.tier ?? "silver",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
  if (user.phone) profile.phone = user.phone;
  if (user.avatar) profile.avatar = user.avatar;
  if (user.dateOfBirth) profile.dateOfBirth = user.dateOfBirth.toISOString();
  if (user.skinType) profile.skinType = user.skinType;
  if (user.referralCode) profile.referralCode = user.referralCode;

  return {
    exportedAt: new Date().toISOString(),
    profile,
    addresses,
    cart: cart ?? null,
    wishlist: wishlist ?? null,
    orders,
    reviews,
    loyaltyEvents: [],
    consents: [],
  };
}
