import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { ActivityLog, type ActivityEntity, type ActivityLogDoc } from "@/lib/db/models/ActivityLog";

/**
 * Activity log seeder for admin integration tests. Inserts N entries with
 * round-robin entities + monotonic timestamps so sort assertions are stable.
 */

export type SeedActivityInput = {
  actorId?: Types.ObjectId | string;
  actorRole?: string;
  event?: string;
  entity?: ActivityEntity;
  entityId?: Types.ObjectId | string;
  summary?: string;
  details?: Record<string, unknown>;
  createdAt?: Date;
};

const DEFAULT_ENTITIES: ActivityEntity[] = ["order", "product", "coupon", "banner"];

export type SeededActivity = {
  id: string;
  event: string;
  entity: ActivityEntity;
};

function toSeeded(doc: ActivityLogDoc): SeededActivity {
  const raw = doc as unknown as { _id: Types.ObjectId; event: string; entity: ActivityEntity };
  return {
    id: raw._id.toString(),
    event: raw.event,
    entity: raw.entity,
  };
}

export async function seedActivity(
  count: number,
  overrides: SeedActivityInput[] = [],
): Promise<SeededActivity[]> {
  await connectDb();
  const out: SeededActivity[] = [];
  const baseActor = new Types.ObjectId();
  for (let i = 0; i < count; i += 1) {
    const o = overrides[i] ?? {};
    const entity: ActivityEntity = o.entity ?? DEFAULT_ENTITIES[i % DEFAULT_ENTITIES.length]!;
    const payload: Record<string, unknown> = {
      actorId: o.actorId
        ? typeof o.actorId === "string"
          ? new Types.ObjectId(o.actorId)
          : o.actorId
        : baseActor,
      actorRole: o.actorRole ?? "admin",
      event: o.event ?? `${entity}.test_event`,
      entity,
      entityId: o.entityId
        ? typeof o.entityId === "string"
          ? new Types.ObjectId(o.entityId)
          : o.entityId
        : new Types.ObjectId(),
      summary: o.summary ?? `Seeded ${entity} activity #${i + 1}`,
      details: o.details ?? {},
    };
    const doc = await ActivityLog.create(payload);
    if (o.createdAt) {
      // reason: createdAt is set by timestamps option; back-date when caller asks.
      await ActivityLog.updateOne({ _id: doc._id }, { $set: { createdAt: o.createdAt } });
    }
    out.push(toSeeded(doc));
  }
  return out;
}
