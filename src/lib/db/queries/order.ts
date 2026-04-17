import type { FilterQuery, Types } from "mongoose";
import { Order, type OrderDoc } from "@/lib/db/models/Order";
import type { OrderStatus } from "@/lib/constants";

export type ListOrdersOpts = {
  status?: OrderStatus;
  page?: number;
  limit?: number;
};

export type LeanOrder = OrderDoc;

export type ListOrdersResult = {
  items: LeanOrder[];
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

export async function listOrdersByUser(
  userId: Types.ObjectId | string,
  opts: ListOrdersOpts = {},
): Promise<ListOrdersResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<OrderDoc> = { userId };
  if (opts.status) filter.orderStatus = opts.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ placedAt: -1 }).skip(skip).limit(limit).lean<LeanOrder[]>(),
    Order.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items, page, limit, total, totalPages };
}

/**
 * Owner-scoped order fetch. Pass `userId = null` from admin paths to bypass the
 * ownership filter. Never let userId default — callers must be explicit.
 */
export async function getOrderById(
  id: Types.ObjectId | string,
  userId: Types.ObjectId | string | null,
): Promise<LeanOrder | null> {
  const filter: FilterQuery<OrderDoc> = { _id: id };
  if (userId !== null) filter.userId = userId;
  return Order.findOne(filter).lean<LeanOrder | null>();
}

export async function countActiveOrdersForCoupon(couponCode: string): Promise<number> {
  return Order.countDocuments({
    couponCode: couponCode.toUpperCase(),
    orderStatus: { $nin: ["cancelled", "returned"] },
  });
}
