"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { deleteAccountSchema, type DeleteAccountInput } from "@/lib/validators/user";
import {
  deleteUserAccount,
  getUserDataExport,
  type DeleteAccountOutcome,
  type UserDataExport,
} from "@/lib/services/account";

export const exportAccountAction = safeAction(async (): Promise<UserDataExport> => {
  const session = await requireAuth();
  return getUserDataExport(session.user.id);
});

export const deleteAccountAction = safeAction(
  async (input: DeleteAccountInput): Promise<DeleteAccountOutcome> => {
    const session = await requireAuth();
    deleteAccountSchema.parse(input);
    const result = await deleteUserAccount(session.user.id);
    revalidatePath("/");
    return result;
  },
);
