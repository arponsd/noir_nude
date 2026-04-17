import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Coupon, type CouponDoc } from "@/lib/db/models/Coupon";
import { createActivityLog } from "@/lib/db/models/ActivityLog";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import { ERROR_CODES, type UserRole } from "@/lib/constants";
import type { AdminCouponCreateInput, AdminCouponUpdateInput } from "@/lib/validators/admin";
import type {
  CouponDetail,
  CouponListPage,
  CouponSummary,
  CouponType,
} from "@/types/api/admin-coupons";

/* ----------------------------------------------------------------------------
 * Admin coupon service.
 *
 * DB agent has not (yet) delivered a dedicated admin-coupons query helper, so we
 * access the `Coupon` model directly here. When that helper lands this module
 * should be refactored to import `listAdminCoupons`/`getCouponById` instead.
 * -------------------------------------------------------------------------- */

type LeanCouponFull = {
  _id: Types.ObjectId;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  applicableCategories?: Types.ObjectId[];
  applicableProducts?: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toSummary(c: LeanCouponFull): CouponSummary {
  const out: CouponSummary = {
    id: c._id.toString(),
    code: c.code,
    type: c.type,
    value: c.value,
    usedCount: c.usedCount,
    validFrom: c.validFrom.toISOString(),
    validUntil: c.validUntil.toISOString(),
    isActive: c.isActive,
  };
  if (c.minOrderAmount !== undefined) out.minOrderAmount = c.minOrderAmount;
  if (c.maxDiscount !== undefined) out.maxDiscount = c.maxDiscount;
  if (c.usageLimit !== undefined) out.usageLimit = c.usageLimit;
  if (c.perUserLimit !== undefined) out.perUserLimit = c.perUserLimit;
  return out;
}

function toDetail(c: LeanCouponFull): CouponDetail {
  return {
    ...toSummary(c),
    applicableCategories: (c.applicableCategories ?? []).map((id) => id.toString()),
    applicableProducts: (c.applicableProducts ?? []).map((id) => id.toString()),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export type ListCouponsOpts = {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
};

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}
function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 20;
  return Math.min(Math.floor(n), 100);
}

export async function listCouponsService(opts: ListCouponsOpts = {}): Promise<CouponListPage> {
  await connectDb();
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  // Default surfaces active coupons only; admin toggle surfaces soft-deactivated ones too.
  if (!opts.includeInactive) filter.isActive = true;

  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean<LeanCouponFull[]>(),
    Coupon.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items: items.map(toSummary), page, limit, total, totalPages };
}

export async function getCouponService(id: string): Promise<CouponDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Coupon not found");
  const doc = await Coupon.findById(id).lean<LeanCouponFull | null>();
  if (!doc) throw new NotFoundError("Coupon not found");
  return toDetail(doc);
}

function normalizeInput<T extends Partial<AdminCouponCreateInput>>(
  input: T,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.code !== undefined) patch.code = input.code;
  if (input.type !== undefined) patch.type = input.type;
  if (input.value !== undefined) patch.value = input.value;
  if (input.minOrderAmount !== undefined) patch.minOrderAmount = input.minOrderAmount;
  if (input.maxDiscount !== undefined) patch.maxDiscount = input.maxDiscount;
  if (input.usageLimit !== undefined) patch.usageLimit = input.usageLimit;
  if (input.perUserLimit !== undefined) patch.perUserLimit = input.perUserLimit;
  if (input.validFrom !== undefined) patch.validFrom = new Date(input.validFrom);
  if (input.validUntil !== undefined) patch.validUntil = new Date(input.validUntil);
  if (input.applicableCategories !== undefined) {
    patch.applicableCategories = input.applicableCategories.map((id) => new Types.ObjectId(id));
  }
  if (input.applicableProducts !== undefined) {
    patch.applicableProducts = input.applicableProducts.map((id) => new Types.ObjectId(id));
  }
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  return patch;
}

export async function createCouponService(
  input: AdminCouponCreateInput,
  actor: { id: string; role: UserRole },
): Promise<CouponDetail> {
  await connectDb();

  const existing = await Coupon.findOne({ code: input.code }).select({ _id: 1 }).lean();
  if (existing) {
    throw new ValidationError("Coupon code already exists", ERROR_CODES.VALIDATION_FAILED);
  }

  let created: CouponDoc;
  try {
    created = await Coupon.create(normalizeInput(input));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Coupon creation failed";
    throw new ValidationError(message, ERROR_CODES.VALIDATION_FAILED);
  }

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "coupon.create",
    entity: "coupon",
    entityId: created._id,
    summary: `Created coupon ${input.code}`,
    details: { code: input.code, type: input.type, value: input.value },
  });

  const fresh = await Coupon.findById(created._id).lean<LeanCouponFull | null>();
  if (!fresh) throw new NotFoundError("Coupon not found");
  return toDetail(fresh);
}

export async function updateCouponService(
  id: string,
  input: AdminCouponUpdateInput,
  actor: { id: string; role: UserRole },
): Promise<CouponDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Coupon not found");

  const patch = normalizeInput(input);
  if (Object.keys(patch).length === 0) return getCouponService(id);

  if (input.code) {
    const clash = await Coupon.findOne({ code: input.code, _id: { $ne: id } })
      .select({ _id: 1 })
      .lean();
    if (clash)
      throw new ValidationError("Coupon code already in use", ERROR_CODES.VALIDATION_FAILED);
  }

  const updated = await Coupon.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, runValidators: true },
  ).lean<LeanCouponFull | null>();
  if (!updated) throw new NotFoundError("Coupon not found");

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "coupon.update",
    entity: "coupon",
    entityId: updated._id,
    summary: `Updated coupon ${updated.code}`,
    details: { patch: Object.keys(patch) },
  });

  return toDetail(updated);
}

/** Soft deactivate — keeps the doc for audit/redemption history. */
export async function deactivateCouponService(
  id: string,
  actor: { id: string; role: UserRole },
): Promise<{ id: string; isActive: boolean }> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Coupon not found");
  const updated = await Coupon.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
    .select({ _id: 1, code: 1, isActive: 1 })
    .lean<{ _id: Types.ObjectId; code: string; isActive: boolean } | null>();
  if (!updated) throw new NotFoundError("Coupon not found");

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "coupon.deactivate",
    entity: "coupon",
    entityId: updated._id,
    summary: `Deactivated coupon ${updated.code}`,
  });

  return { id: updated._id.toString(), isActive: updated.isActive };
}
