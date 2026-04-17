import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Address } from "@/lib/db/models/Address";
import {
  listAddresses as dbListAddresses,
  getAddress as dbGetAddress,
  setDefault as dbSetDefault,
  type LeanAddress,
} from "@/lib/db/queries/address";
import { NotFoundError } from "@/lib/api/response";
import type { Address as AddressDTO, AddressInput } from "@/types/api/address";
import type { AddressLabel } from "@/lib/validators/commerce";

/* ----------------------------------------------------------------------------
 * Address service. Reads go through `db/queries/address`; writes go directly to the
 * Address model (the DB agent has not yet exposed create/update/soft-delete helpers,
 * so we keep model access minimal and local here).
 * -------------------------------------------------------------------------- */

function toDto(doc: LeanAddress): AddressDTO {
  const out: AddressDTO = {
    id: doc._id.toString(),
    label: doc.label,
    recipientName: doc.recipientName,
    phone: doc.phone,
    addressLine1: doc.addressLine1,
    city: doc.city,
    district: doc.district,
    postalCode: doc.postalCode,
    country: doc.country,
    isDefault: doc.isDefault,
    createdAt: doc.createdAt.toISOString(),
  };
  if (doc.addressLine2) out.addressLine2 = doc.addressLine2;
  return out;
}

type AddressInputWithLabel = AddressInput & { label: AddressLabel };

export async function listAddresses(userId: string): Promise<AddressDTO[]> {
  await connectDb();
  const docs = await dbListAddresses(userId);
  return docs.map(toDto);
}

export async function getAddress(userId: string, id: string): Promise<AddressDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Address not found");
  const doc = await dbGetAddress(userId, id);
  if (!doc) throw new NotFoundError("Address not found");
  return toDto(doc);
}

export async function createAddress(
  userId: string,
  input: AddressInputWithLabel,
): Promise<AddressDTO> {
  await connectDb();
  const created = await Address.create({
    userId: new Types.ObjectId(userId),
    label: input.label,
    recipientName: input.recipientName,
    phone: input.phone,
    addressLine1: input.addressLine1,
    ...(input.addressLine2 ? { addressLine2: input.addressLine2 } : {}),
    city: input.city,
    district: input.district,
    postalCode: input.postalCode,
    country: input.country,
    isDefault: false,
  });
  const lean = await dbGetAddress(userId, created._id.toString());
  if (!lean) throw new NotFoundError("Address not found");
  return toDto(lean);
}

export async function updateAddress(
  userId: string,
  id: string,
  partial: Partial<AddressInputWithLabel>,
): Promise<AddressDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Address not found");
  const updated = await Address.findOneAndUpdate(
    { _id: id, userId, deletedAt: null },
    { $set: partial },
    { new: true, runValidators: true },
  );
  if (!updated) throw new NotFoundError("Address not found");
  const lean = await dbGetAddress(userId, id);
  if (!lean) throw new NotFoundError("Address not found");
  return toDto(lean);
}

export async function deleteAddress(userId: string, id: string): Promise<{ id: string }> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Address not found");
  const res = await Address.updateOne(
    { _id: id, userId, deletedAt: null },
    { $set: { deletedAt: new Date(), isDefault: false } },
  );
  if (res.matchedCount === 0) throw new NotFoundError("Address not found");
  return { id };
}

export async function setDefaultAddress(userId: string, id: string): Promise<AddressDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Address not found");
  const updated = await dbSetDefault(userId, id);
  if (!updated) throw new NotFoundError("Address not found");
  const lean = await dbGetAddress(userId, id);
  if (!lean) throw new NotFoundError("Address not found");
  return toDto(lean);
}
