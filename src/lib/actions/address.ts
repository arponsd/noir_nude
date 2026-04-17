"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import {
  addressInputSchema,
  addressUpdateSchema,
  type AddressInputSchema,
  type AddressUpdateSchema,
} from "@/lib/validators/commerce";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/services/address";
import { objectIdParamSchema } from "@/lib/utils/object-id";
import type { Address } from "@/types/api/address";

function revalidateAddressPaths(): void {
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export const createAddressAction = safeAction(
  async (input: AddressInputSchema): Promise<Address> => {
    const session = await requireAuth();
    const parsed = addressInputSchema.parse(input);
    const address = await createAddress(session.user.id, parsed);
    revalidateAddressPaths();
    return address;
  },
);

export const updateAddressAction = safeAction(
  async (id: string, partial: AddressUpdateSchema): Promise<Address> => {
    const session = await requireAuth();
    const addressId = objectIdParamSchema.parse(id);
    const parsed = addressUpdateSchema.parse(partial);
    const address = await updateAddress(session.user.id, addressId, parsed);
    revalidateAddressPaths();
    return address;
  },
);

export const deleteAddressAction = safeAction(async (id: string): Promise<{ id: string }> => {
  const session = await requireAuth();
  const addressId = objectIdParamSchema.parse(id);
  const result = await deleteAddress(session.user.id, addressId);
  revalidateAddressPaths();
  return result;
});

export const setDefaultAddressAction = safeAction(async (id: string): Promise<Address> => {
  const session = await requireAuth();
  const addressId = objectIdParamSchema.parse(id);
  const address = await setDefaultAddress(session.user.id, addressId);
  revalidateAddressPaths();
  return address;
});
