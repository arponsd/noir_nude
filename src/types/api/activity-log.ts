import type { UserRole } from "@/lib/constants";

/**
 * Audit-log entry written on every admin mutation. `details` is a free-form JSON
 * payload (whatever the service decides is useful — status transitions, diffs, etc.).
 */
export type ActivityLogEntry = {
  id: string;
  actorId: string;
  actorRole: UserRole;
  event: string;
  entity: string;
  entityId: string;
  summary: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

export type ActivityLogPage = {
  items: ActivityLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
