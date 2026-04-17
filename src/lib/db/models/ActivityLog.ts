import { Schema, model, models } from "mongoose";
import type mongoose from "mongoose";
import type { InferSchemaType, Model, Types } from "mongoose";

const ACTIVITY_ENTITIES = ["order", "product", "coupon", "banner", "review", "user"] as const;

export type ActivityEntity = (typeof ACTIVITY_ENTITIES)[number];

const TTL_SECONDS = 60 * 60 * 24 * 365; // 365 days

const activityLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** Role snapshot at time of action. Historical value — do not resolve live. */
    actorRole: { type: String, required: true, trim: true, maxlength: 32 },
    /** Dot-namespaced event key, e.g. `order.status_update`. */
    event: { type: String, required: true, trim: true, maxlength: 80 },
    entity: {
      type: String,
      required: true,
      enum: ACTIVITY_ENTITIES,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    // reason: arbitrary JSON context payload — keyed per-event, schema varies; enforced by callers.
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ actorId: 1, createdAt: -1 }, { name: "activity_actor_recent" });
activityLogSchema.index({ entity: 1, entityId: 1 }, { name: "activity_entity" });
activityLogSchema.index(
  { createdAt: 1 },
  { name: "activity_ttl", expireAfterSeconds: TTL_SECONDS },
);

export type ActivityLogDoc = InferSchemaType<typeof activityLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const ActivityLog: Model<ActivityLogDoc> =
  (models.ActivityLog as Model<ActivityLogDoc> | undefined) ??
  model<ActivityLogDoc>("ActivityLog", activityLogSchema);

export type CreateActivityLogInput = {
  actorId: Types.ObjectId | string;
  actorRole: string;
  event: string;
  entity: ActivityEntity;
  entityId: Types.ObjectId | string;
  summary: string;
  details?: Record<string, unknown>;
};

/**
 * Thin wrapper around `ActivityLog.create` so every admin action logs via the same shape.
 * Returns the persisted doc as a plain object. Never throws for non-fatal failures —
 * callers should treat logging as best-effort unless they explicitly need the receipt.
 */
export async function createActivityLog(input: CreateActivityLogInput): Promise<ActivityLogDoc> {
  const doc = await ActivityLog.create({
    actorId: input.actorId,
    actorRole: input.actorRole,
    event: input.event,
    entity: input.entity,
    entityId: input.entityId,
    summary: input.summary,
    details: input.details ?? {},
  });
  return doc.toObject() as ActivityLogDoc;
}

export { ACTIVITY_ENTITIES };
