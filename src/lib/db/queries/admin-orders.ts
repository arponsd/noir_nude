import type { FilterQuery, Types } from "mongoose";
import { Order, type OrderDoc } from "@/lib/db/models/Order";
import type { OrderStatus } from "@/lib/constants";

export type AdminListOrdersOpts = {
  status?: OrderStatus;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  q?: string;
  page?: number;
  limit?: number;
};

export type AdminListOrdersResult = {
  items: OrderDoc[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}

function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 20;
  return Math.min(Math.floor(n), 100);
}

// reason: escape user input before using it as a RegExp source to avoid ReDoS + literal-intent bugs.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Admin-side paginated order listing. `q` matches orderNumber or guestEmail
 * case-insensitively. No userId scope — callers must be role-guarded upstream.
 */
export async function listAdminOrders(
  opts: AdminListOrdersOpts = {},
): Promise<AdminListOrdersResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<OrderDoc> = {};
  if (opts.status) filter.orderStatus = opts.status;
  if (opts.paymentStatus) filter.paymentStatus = opts.paymentStatus;

  const q = opts.q?.trim();
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ orderNumber: re }, { guestEmail: re }];
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ placedAt: -1 }).skip(skip).limit(limit).lean<OrderDoc[]>(),
    Order.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items, page, limit, total, totalPages };
}

/**
 * Admin-scoped fetch: returns the full document regardless of owner. Soft-deleted
 * orders are still excluded via the default find-hook.
 */
export async function adminGetOrder(id: Types.ObjectId | string): Promise<OrderDoc | null> {
  return Order.findOne({ _id: id }).lean<OrderDoc | null>();
}
