import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { exportUserData, type UserExportPayload } from "@/lib/db/queries/user-export";
import { deleteUserTransaction, type DeleteUserResult } from "@/lib/db/transactions/delete-user";
import { NotFoundError } from "@/lib/api/response";
import { sendAccountDeletedEmail } from "@/lib/services/email";
import logger from "@/lib/utils/logger";

/* ----------------------------------------------------------------------------
 * Account service (GDPR).
 *
 * Export returns a JSON-serialisable payload + a filename derived from a short id prefix
 * so nothing leaks the raw ObjectId. Delete runs the cascade transaction and, before the
 * User doc is anonymised, captures email + name so the farewell email can still be sent.
 * -------------------------------------------------------------------------- */

export type UserDataExport = {
  filename: string;
  payload: UserExportPayload;
};

function shortId(fullId: string): string {
  return fullId.slice(-8);
}

export async function getUserDataExport(userId: string): Promise<UserDataExport> {
  await connectDb();
  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");
  const payload = await exportUserData(userId);
  const filename = `glowcart-export-${shortId(userId)}.json`;
  return { filename, payload };
}

export type DeleteAccountOutcome = {
  userId: string;
  emailSent: boolean;
};

export async function deleteUserAccount(userId: string): Promise<DeleteAccountOutcome> {
  await connectDb();
  if (!Types.ObjectId.isValid(userId)) throw new NotFoundError("User not found");

  // Capture identity BEFORE the cascade anonymises the User document so the farewell
  // email still has a real address + name to address.
  const current = await User.findById(userId)
    .setOptions({ withDeleted: true })
    .select({ email: 1, name: 1 })
    .lean<{ email: string; name: string } | null>();

  if (!current) throw new NotFoundError("User not found");

  const result: DeleteUserResult = await deleteUserTransaction(userId);

  let emailSent = false;
  try {
    await sendAccountDeletedEmail(current.email, current.name);
    emailSent = true;
  } catch (err) {
    // Best-effort: the account is already gone at this point; log and continue.
    logger.warn({ err, userId }, "account-deleted email failed to send");
  }

  return { userId: result.userId, emailSent };
}
