import { connectDb } from "@/lib/db/connect";
import {
  listActivity,
  type ActivityLogDTO,
  type ListActivityOpts,
} from "@/lib/db/queries/activity-log";
import type { ActivityEntity } from "@/lib/db/models/ActivityLog";
import { ValidationError } from "@/lib/api/response";
import { ERROR_CODES, USER_ROLES, type UserRole } from "@/lib/constants";
import type { AdminActivityQuery } from "@/lib/validators/admin";
import type { ActivityLogEntry, ActivityLogPage } from "@/types/api/activity-log";

const ALLOWED_ENTITIES = ["order", "product", "coupon", "banner", "review", "user"] as const;

function isAllowedEntity(v: string): v is ActivityEntity {
  return (ALLOWED_ENTITIES as readonly string[]).includes(v);
}

function toEntry(dto: ActivityLogDTO): ActivityLogEntry {
  const role = (USER_ROLES as readonly string[]).includes(dto.actorRole)
    ? (dto.actorRole as UserRole)
    : ("admin" as UserRole);
  const out: ActivityLogEntry = {
    id: dto.id,
    actorId: dto.actorId,
    actorRole: role,
    event: dto.event,
    entity: dto.entity,
    entityId: dto.entityId,
    summary: dto.summary,
    createdAt: dto.createdAt,
  };
  if (dto.details && Object.keys(dto.details).length > 0) out.details = dto.details;
  return out;
}

export async function listActivityService(query: AdminActivityQuery): Promise<ActivityLogPage> {
  await connectDb();

  const opts: ListActivityOpts = {};
  if (query.actorId) opts.actorId = query.actorId;
  if (query.entity) {
    if (!isAllowedEntity(query.entity)) {
      throw new ValidationError("Invalid entity", ERROR_CODES.VALIDATION_FAILED);
    }
    opts.entity = query.entity;
  }
  if (query.page) opts.page = query.page;
  if (query.limit) opts.limit = query.limit;

  const raw = await listActivity(opts);
  return {
    items: raw.items.map(toEntry),
    page: raw.page,
    limit: raw.limit,
    total: raw.total,
    totalPages: raw.totalPages,
  };
}
