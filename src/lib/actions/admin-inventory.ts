"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import { adminInventoryAdjustSchema, type AdminInventoryAdjustInput } from "@/lib/validators/admin";
import { adjustInventoryService, type AdjustInventoryResult } from "@/lib/services/admin-inventory";

const ADMIN_ROLES = ["admin", "manager"] as const;

/**
 * Adjust a variant's on-hand stock by integer delta. Service layer writes an
 * ActivityLog entry and refuses to go below zero.
 */
export const adjustInventoryAction = safeAction(
  async (input: AdminInventoryAdjustInput): Promise<AdjustInventoryResult> => {
    const session = await requireRole(ADMIN_ROLES);
    const parsed = adminInventoryAdjustSchema.parse(input);
    const result = await adjustInventoryService(parsed, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/products`);
    return result;
  },
);
