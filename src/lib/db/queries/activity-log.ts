import type { FilterQuery, Types } from "mongoose";
import { ActivityLog, type ActivityEntity, type ActivityLogDoc } from "@/lib/db/models/ActivityLog";

export type ActivityLogDTO = {
  id: string;
  actorId: string;
  actorRole: string;
  event: string;
  entity: ActivityEntity;
  entityId: string;
  summary: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type ListActivityOpts = {
  actorId?: Types.ObjectId | string;
  entity?: ActivityEntity;
  page?: number;
  limit?: number;
};

export type ListActivityResult = {
  items: ActivityLogDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LeanActivity = {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: string;
  event: string;
  entity: ActivityEntity;
  entityId: Types.ObjectId;
  summary: string;
  details?: Record<string, unknown> | null;
  createdAt: Date;
};

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}

function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 50;
  return Math.min(Math.floor(n), 200);
}

function toDTO(a: LeanActivity): ActivityLogDTO {
  return {
    id: a._id.toString(),
    actorId: a.actorId.toString(),
    actorRole: a.actorRole,
    event: a.event,
    entity: a.entity,
    entityId: a.entityId.toString(),
    summary: a.summary,
    details: (a.details ?? {}) as Record<string, unknown>,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function listActivity(opts: ListActivityOpts = {}): Promise<ListActivityResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<ActivityLogDoc> = {};
  if (opts.actorId) filter.actorId = opts.actorId;
  if (opts.entity) filter.entity = opts.entity;

  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<LeanActivity[]>(),
    ActivityLog.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items: items.map(toDTO), page, limit, total, totalPages };
}

/**
 * Chronological (newest first) activity for a single entity. Use for audit trails
 * on admin detail pages (order timeline, product history, etc.).
 */
export async function getActivityForEntity(
  entity: ActivityEntity,
  entityId: Types.ObjectId | string,
  limit = 50,
): Promise<ActivityLogDTO[]> {
  const capped = Math.max(1, Math.min(limit, 200));
  const docs = await ActivityLog.find({ entity, entityId })
    .sort({ createdAt: -1 })
    .limit(capped)
    .lean<LeanActivity[]>();
  return docs.map(toDTO);
}
