import type { FilterQuery, Types } from "mongoose";
import { Banner, type BannerDoc } from "@/lib/db/models/Banner";

export type BannerStatus = "draft" | "scheduled" | "active" | "expired" | "inactive";

export type BannerDTO = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href?: string;
  cta?: string;
  order: number;
  isActive: boolean;
  publishFrom: string | null;
  publishUntil: string | null;
  status: BannerStatus;
  createdAt: string;
  updatedAt: string;
};

export type ListAdminBannersOpts = {
  page?: number;
  limit?: number;
};

export type ListAdminBannersResult = {
  items: BannerDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LeanBanner = {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href?: string;
  cta?: string;
  order?: number;
  isActive?: boolean;
  publishFrom?: Date | null;
  publishUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}

function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 20;
  return Math.min(Math.floor(n), 100);
}

function computeStatus(b: LeanBanner, now: Date = new Date()): BannerStatus {
  if (!b.isActive) return "inactive";
  if (!b.publishFrom) return "draft";
  if (b.publishFrom > now) return "scheduled";
  if (b.publishUntil && b.publishUntil < now) return "expired";
  return "active";
}

function toDTO(b: LeanBanner): BannerDTO {
  const dto: BannerDTO = {
    id: b._id.toString(),
    title: b.title,
    imageUrl: b.imageUrl,
    order: b.order ?? 0,
    isActive: b.isActive ?? true,
    publishFrom: b.publishFrom ? b.publishFrom.toISOString() : null,
    publishUntil: b.publishUntil ? b.publishUntil.toISOString() : null,
    status: computeStatus(b),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
  if (b.subtitle !== undefined) dto.subtitle = b.subtitle;
  if (b.href !== undefined) dto.href = b.href;
  if (b.cta !== undefined) dto.cta = b.cta;
  return dto;
}

/**
 * Homepage-facing list: active, non-deleted, within publish window (or unbounded).
 * Sorted by `order` asc then `createdAt` desc so newer entries win ties.
 */
export async function listActiveBanners(): Promise<BannerDTO[]> {
  const now = new Date();
  const docs = await Banner.find({
    isActive: true,
    deletedAt: null,
    $and: [
      { $or: [{ publishFrom: null }, { publishFrom: { $lte: now } }] },
      {
        $or: [
          { publishUntil: { $exists: false } },
          { publishUntil: null },
          { publishUntil: { $gte: now } },
        ],
      },
    ],
  })
    .sort({ order: 1, createdAt: -1 })
    .lean<LeanBanner[]>();
  return docs.map(toDTO);
}

/**
 * Admin-facing paginated list. Includes inactive, scheduled, and expired — only
 * soft-deleted entries are excluded.
 */
export async function listAllBannersAdmin(
  opts: ListAdminBannersOpts = {},
): Promise<ListAdminBannersResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<BannerDoc> = {};

  const [items, total] = await Promise.all([
    Banner.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<LeanBanner[]>(),
    Banner.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items: items.map(toDTO), page, limit, total, totalPages };
}

export async function getBannerById(id: Types.ObjectId | string): Promise<BannerDTO | null> {
  const doc = await Banner.findOne({ _id: id }).lean<LeanBanner | null>();
  if (!doc) return null;
  return toDTO(doc);
}
