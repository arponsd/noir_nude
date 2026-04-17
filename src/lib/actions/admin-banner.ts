"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/require-role";
import {
  adminBannerCreateSchema,
  adminBannerReorderSchema,
  adminBannerUpdateSchema,
  type AdminBannerCreateInput,
  type AdminBannerReorderInput,
  type AdminBannerUpdateInput,
} from "@/lib/validators/admin";
import { objectIdParamSchema } from "@/lib/utils/object-id";
import {
  createBannerService,
  deleteBannerService,
  reorderBannersService,
  updateBannerService,
} from "@/lib/services/admin-banner";
import type { Banner } from "@/types/api/banner";

const ADMIN_ROLES = ["admin", "manager"] as const;

function revalidateBannerPaths(): void {
  revalidatePath("/admin/banners");
  // reason: the homepage hero renders banners — invalidate so the storefront
  // reflects admin changes on the next request.
  revalidatePath("/");
}

export const adminCreateBannerAction = safeAction(
  async (input: AdminBannerCreateInput): Promise<Banner> => {
    const session = await requireRole(ADMIN_ROLES);
    const parsed = adminBannerCreateSchema.parse(input);
    const banner = await createBannerService(parsed, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidateBannerPaths();
    return banner;
  },
);

export const adminUpdateBannerAction = safeAction(
  async (input: { bannerId: string } & AdminBannerUpdateInput): Promise<Banner> => {
    const session = await requireRole(ADMIN_ROLES);
    const bannerId = objectIdParamSchema.parse(input.bannerId);
    const { bannerId: _id, ...rest } = input;
    void _id;
    const parsed = adminBannerUpdateSchema.parse(rest);
    const banner = await updateBannerService(bannerId, parsed, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidateBannerPaths();
    return banner;
  },
);

export const adminDeleteBannerAction = safeAction(
  async (input: { bannerId: string }): Promise<{ id: string; deletedAt: string }> => {
    const session = await requireRole(ADMIN_ROLES);
    const bannerId = objectIdParamSchema.parse(input.bannerId);
    const result = await deleteBannerService(bannerId, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidateBannerPaths();
    return result;
  },
);

export const adminReorderBannersAction = safeAction(
  async (input: AdminBannerReorderInput): Promise<{ updated: number }> => {
    const session = await requireRole(ADMIN_ROLES);
    const parsed = adminBannerReorderSchema.parse(input);
    const result = await reorderBannersService(parsed, {
      id: session.user.id,
      role: session.user.role,
    });
    revalidateBannerPaths();
    return result;
  },
);
