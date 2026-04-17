import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { listAllBannersAdmin, getBannerById, type BannerDTO } from "@/lib/db/queries/banner";
import { Banner } from "@/lib/db/models/Banner";
import { createActivityLog } from "@/lib/db/models/ActivityLog";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import { ERROR_CODES, type UserRole } from "@/lib/constants";
import type {
  AdminBannerCreateInput,
  AdminBannerReorderInput,
  AdminBannerUpdateInput,
} from "@/lib/validators/admin";
import type { Banner as BannerResponse } from "@/types/api/banner";

/* ----------------------------------------------------------------------------
 * Admin banner service.
 *
 * Writes flow through the Banner model directly (DB helper module doesn't yet
 * expose create/update/delete). Reads flow through the DB helpers.
 * -------------------------------------------------------------------------- */

function toResponse(b: BannerDTO): BannerResponse {
  const out: BannerResponse = {
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    order: b.order,
    isActive: b.isActive,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
  if (b.subtitle !== undefined) out.subtitle = b.subtitle;
  if (b.href !== undefined) out.href = b.href;
  if (b.cta !== undefined) out.cta = b.cta;
  if (b.publishFrom) out.publishFrom = b.publishFrom;
  if (b.publishUntil) out.publishUntil = b.publishUntil;
  return out;
}

export type ListBannersAdminOpts = {
  page?: number;
  limit?: number;
};

export type ListBannersAdminResult = {
  items: BannerResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function listBannersAdminService(
  opts: ListBannersAdminOpts = {},
): Promise<ListBannersAdminResult> {
  await connectDb();
  const raw = await listAllBannersAdmin(opts);
  return {
    items: raw.items.map(toResponse),
    page: raw.page,
    limit: raw.limit,
    total: raw.total,
    totalPages: raw.totalPages,
  };
}

export async function getBannerService(id: string): Promise<BannerResponse> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Banner not found");
  const dto = await getBannerById(id);
  if (!dto) throw new NotFoundError("Banner not found");
  return toResponse(dto);
}

function payloadFromInput(input: Partial<AdminBannerCreateInput>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle;
  if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl;
  if (input.href !== undefined) patch.href = input.href;
  if (input.cta !== undefined) patch.cta = input.cta;
  if (input.order !== undefined) patch.order = input.order;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.publishFrom !== undefined) patch.publishFrom = new Date(input.publishFrom);
  if (input.publishUntil !== undefined) patch.publishUntil = new Date(input.publishUntil);
  return patch;
}

export async function createBannerService(
  input: AdminBannerCreateInput,
  actor: { id: string; role: UserRole },
): Promise<BannerResponse> {
  await connectDb();
  let created;
  try {
    created = await Banner.create(payloadFromInput(input));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Banner creation failed";
    throw new ValidationError(message, ERROR_CODES.VALIDATION_FAILED);
  }

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "banner.create",
    entity: "banner",
    entityId: created._id,
    summary: `Created banner "${input.title}"`,
    details: { title: input.title, imageUrl: input.imageUrl },
  });

  return getBannerService(created._id.toString());
}

export async function updateBannerService(
  id: string,
  input: AdminBannerUpdateInput,
  actor: { id: string; role: UserRole },
): Promise<BannerResponse> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Banner not found");

  const patch = payloadFromInput(input);
  if (Object.keys(patch).length === 0) return getBannerService(id);

  const updated = await Banner.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, runValidators: true },
  )
    .select({ _id: 1 })
    .lean<{ _id: Types.ObjectId } | null>();
  if (!updated) throw new NotFoundError("Banner not found");

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "banner.update",
    entity: "banner",
    entityId: updated._id,
    summary: `Updated banner ${updated._id.toString()}`,
    details: { patch: Object.keys(patch) },
  });

  return getBannerService(id);
}

/** Soft delete — sets `deletedAt` so the homepage query hides the banner. */
export async function deleteBannerService(
  id: string,
  actor: { id: string; role: UserRole },
): Promise<{ id: string; deletedAt: string }> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Banner not found");
  const now = new Date();
  const updated = await Banner.findByIdAndUpdate(
    id,
    { $set: { deletedAt: now, isActive: false } },
    { new: true },
  )
    .setOptions({ withDeleted: true })
    .select({ _id: 1, deletedAt: 1 })
    .lean<{ _id: Types.ObjectId; deletedAt: Date | null } | null>();
  if (!updated) throw new NotFoundError("Banner not found");

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "banner.delete",
    entity: "banner",
    entityId: updated._id,
    summary: `Deleted banner ${updated._id.toString()}`,
  });

  return { id: updated._id.toString(), deletedAt: (updated.deletedAt ?? now).toISOString() };
}

/**
 * Bulk-reorder banners. Accepts `{id, order}` pairs and applies them in a single
 * bulkWrite. Missing ids are silently skipped; caller is expected to validate IDs
 * upstream via `objectIdSchema`.
 */
export async function reorderBannersService(
  input: AdminBannerReorderInput,
  actor: { id: string; role: UserRole },
): Promise<{ updated: number }> {
  await connectDb();
  if (input.items.length === 0) return { updated: 0 };

  const ops = input.items.map((it) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(it.id) },
      update: { $set: { order: it.order } },
    },
  }));
  const result = await Banner.bulkWrite(ops);
  const updated = result.modifiedCount ?? 0;

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "banner.reorder",
    entity: "banner",
    entityId: new Types.ObjectId(input.items[0]!.id),
    summary: `Reordered ${updated} banner(s)`,
    details: { items: input.items },
  });

  return { updated };
}
