"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import {
  adminOrderStatusUpdateSchema,
  type AdminOrderStatusUpdateInput,
} from "@/lib/validators/admin";
import { objectIdParamSchema } from "@/lib/utils/object-id";
import { adminUpdateOrderStatusService } from "@/lib/services/admin-order";
import type { OrderDetail } from "@/types/api/order";

const ADMIN_ROLES = ["admin", "manager"] as const;

/**
 * Admin order status transition. Delegates to `adminUpdateOrderStatusService` which
 * asserts the `ORDER_TRANSITIONS` guard + writes an activity log entry. Revalidates
 * the admin orders list + the specific detail route so the UI reflects the new state
 * on the server-component side without a manual page reload.
 */
export const adminUpdateOrderStatusAction = safeAction(
  async (input: { orderId: string } & AdminOrderStatusUpdateInput): Promise<OrderDetail> => {
    const session = await requireRole(ADMIN_ROLES);
    const orderId = objectIdParamSchema.parse(input.orderId);
    const parsed = adminOrderStatusUpdateSchema.parse({
      status: input.status,
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber } : {}),
      ...(input.courier !== undefined ? { courier: input.courier } : {}),
    });
    const detail = await adminUpdateOrderStatusService(
      orderId,
      { id: session.user.id, role: session.user.role },
      parsed,
    );
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return detail;
  },
);
