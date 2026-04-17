import mongoose from "mongoose";
import type { Types } from "mongoose";
import { Address, type AddressDoc } from "@/lib/db/models/Address";

export type LeanAddress = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label: "home" | "office" | "other";
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function listAddresses(userId: Types.ObjectId | string): Promise<LeanAddress[]> {
  return Address.find({ userId }).sort({ isDefault: -1, updatedAt: -1 }).lean<LeanAddress[]>();
}

export async function getAddress(
  userId: Types.ObjectId | string,
  id: Types.ObjectId | string,
): Promise<LeanAddress | null> {
  return Address.findOne({ _id: id, userId }).lean<LeanAddress | null>();
}

/**
 * Atomically mark one address as default and unset the flag on siblings.
 * Uses a transaction when the connected Mongo supports it (replica set); falls back
 * to sequential writes otherwise. The pre-save hook on the model also enforces the
 * invariant for the save() path — this function is the updateMany() path.
 */
export async function setDefault(
  userId: Types.ObjectId | string,
  id: Types.ObjectId | string,
): Promise<AddressDoc | null> {
  const session = await mongoose.startSession();
  try {
    let result: AddressDoc | null = null;
    await session.withTransaction(async () => {
      await Address.updateMany(
        { userId, _id: { $ne: id } },
        { $set: { isDefault: false } },
        { session },
      );
      result = await Address.findOneAndUpdate(
        { _id: id, userId },
        { $set: { isDefault: true } },
        { new: true, session },
      );
    });
    return result;
  } catch (err) {
    // Fallback for standalone Mongo (no transactions) — run the two writes sequentially.
    if (isTransactionUnsupported(err)) {
      await Address.updateMany({ userId, _id: { $ne: id } }, { $set: { isDefault: false } });
      return Address.findOneAndUpdate(
        { _id: id, userId },
        { $set: { isDefault: true } },
        { new: true },
      );
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

function isTransactionUnsupported(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = (err as { message?: string }).message ?? "";
  return (
    message.includes("Transaction numbers") ||
    message.includes("replica set") ||
    message.includes("sharded cluster")
  );
}
