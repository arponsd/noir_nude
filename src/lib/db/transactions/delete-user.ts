import mongoose, { Types } from "mongoose";
import type { ClientSession } from "mongoose";
import { NotFoundError } from "@/lib/api/response";
import { AuthToken } from "@/lib/auth/token-store";
import { Address } from "@/lib/db/models/Address";
import { Cart } from "@/lib/db/models/Cart";
import { CouponRedemption } from "@/lib/db/models/CouponRedemption";
import { Order } from "@/lib/db/models/Order";
import { Review } from "@/lib/db/models/Review";
import { User } from "@/lib/db/models/User";
import { Wishlist } from "@/lib/db/models/Wishlist";
import logger from "@/lib/utils/logger";

export type DeleteUserResult = {
  userId: string;
  anonymizedEmail: string;
  counts: {
    addressesDeleted: number;
    cartDeleted: number;
    wishlistDeleted: number;
    reviewsSoftDeleted: number;
    ordersAnonymized: number;
    authTokensDeleted: number;
    couponRedemptionsAnonymized: number;
  };
};

function isTransactionUnsupported(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = (err as { message?: string }).message ?? "";
  return (
    message.includes("Transaction numbers") ||
    message.includes("replica set") ||
    message.includes("sharded cluster")
  );
}

async function doDelete(
  userId: Types.ObjectId,
  session: ClientSession | null,
): Promise<DeleteUserResult> {
  const now = new Date();
  const anonymizedEmail = `deleted+${userId.toString()}@invalid`;
  const opts = session ? { session } : undefined;

  const userQuery = User.findOne({ _id: userId }).setOptions({ withDeleted: true });
  if (session) userQuery.session(session);
  const user = await userQuery.exec();
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.set({
    deletedAt: now,
    isActive: false,
    email: anonymizedEmail,
    name: "[deleted]",
    phone: undefined,
    avatar: undefined,
  });
  await user.save(opts);

  const cartDeleted = (await Cart.deleteMany({ userId }, opts)).deletedCount ?? 0;
  const wishlistDeleted = (await Wishlist.deleteMany({ userId }, opts)).deletedCount ?? 0;
  const addressesDeleted = (await Address.deleteMany({ userId }, opts)).deletedCount ?? 0;

  const reviewRes = await Review.updateMany(
    { userId, deletedAt: null },
    { $set: { deletedAt: now } },
    opts,
  );
  const reviewsSoftDeleted = reviewRes.modifiedCount ?? 0;

  const orderRes = await Order.updateMany(
    { userId },
    {
      $set: {
        userId: null,
        "shippingAddress.recipientName": "[deleted]",
        "shippingAddress.phone": "[deleted]",
      },
      $unset: { guestEmail: 1 },
    },
    opts,
  );
  const ordersAnonymized = orderRes.modifiedCount ?? 0;

  const authTokensDeleted = (await AuthToken.deleteMany({ userId }, opts)).deletedCount ?? 0;

  const couponRes = await CouponRedemption.updateMany({ userId }, { $set: { userId: null } }, opts);
  const couponRedemptionsAnonymized = couponRes.modifiedCount ?? 0;

  const result: DeleteUserResult = {
    userId: userId.toString(),
    anonymizedEmail,
    counts: {
      addressesDeleted,
      cartDeleted,
      wishlistDeleted,
      reviewsSoftDeleted,
      ordersAnonymized,
      authTokensDeleted,
      couponRedemptionsAnonymized,
    },
  };

  logger.info(
    {
      kind: "activity",
      event: "user.deleted",
      ...result,
    },
    "user deleted (GDPR cascade)",
  );

  return result;
}

/**
 * GDPR cascade delete. Soft-deletes the user document and anonymizes linked data:
 *   - Hard-delete: Cart, Wishlist, Address, AuthToken.
 *   - Soft-delete: Reviews (keep content, detach via deletedAt filter).
 *   - Anonymize: Orders (keep for accounting, clear PII + unlink userId),
 *                CouponRedemption (unlink userId).
 *
 * Falls back to sequential writes on standalone Mongo. Throws NotFoundError if
 * the user doesn't exist.
 */
export async function deleteUserTransaction(
  userId: Types.ObjectId | string,
): Promise<DeleteUserResult> {
  const uid = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
  const session = await mongoose.startSession();
  try {
    let result: DeleteUserResult | undefined;
    await session.withTransaction(async () => {
      result = await doDelete(uid, session);
    });
    return result as DeleteUserResult;
  } catch (err) {
    if (isTransactionUnsupported(err)) {
      return doDelete(uid, null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
