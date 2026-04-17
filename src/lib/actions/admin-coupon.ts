"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import {
  adminCouponCreateSchema,
  adminCouponUpdateSchema,
  type AdminCouponCreateInput,
  type AdminCouponUpdateInput,
} from "@/lib/validators/admin";
import { objectIdParamSchema } from "@/lib/utils/object-id";
import {
  createCouponService,
  deactivateCouponService,
  updateCouponService,
} from "@/lib/services/admin-coupon";
import type { CouponDetail } from "@/types/api/admin-coupons";

const ADMIN_ROLES = ["admin", "manager"] as const;

function revalidateCouponPaths(id?: string): void {
  revalidatePath("/admin/coupons");
  if (id) revalidatePath(`/admin/coupons/${id}`);
}

export const adminCreateCouponAction = safeAction(
  async (input: AdminCouponCreateInput): Promise<CouponDetail> => {
    const session = await requireRole(ADMIN_ROLES);
    const parsed = adminCouponCreateSchema.parse(input);
    const coupon = await createCouponService(parsed, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidateCouponPaths(coupon.id);
    return coupon;
  },
);

export const adminUpdateCouponAction = safeAction(
  async (input: { couponId: string } & AdminCouponUpdateInput): Promise<CouponDetail> => {
    const session = await requireRole(ADMIN_ROLES);
    const couponId = objectIdParamSchema.parse(input.couponId);
    const { couponId: _id, ...rest } = input;
    void _id;
    const parsed = adminCouponUpdateSchema.parse(rest);
    const coupon = await updateCouponService(couponId, parsed, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidateCouponPaths(coupon.id);
    return coupon;
  },
);

export const adminDeactivateCouponAction = safeAction(
  async (input: { couponId: string }): Promise<{ id: string; isActive: boolean }> => {
    const session = await requireRole(ADMIN_ROLES);
    const couponId = objectIdParamSchema.parse(input.couponId);
    const result = await deactivateCouponService(couponId, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidateCouponPaths(couponId);
    return result;
  },
);
