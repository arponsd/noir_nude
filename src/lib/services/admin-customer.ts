import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import {
  listCustomers,
  getCustomerDetail,
  type CustomerRowDTO,
  type CustomerDetailDTO,
} from "@/lib/db/queries/admin-customers";
import { Order } from "@/lib/db/models/Order";
import { NotFoundError } from "@/lib/api/response";
import type { SkinType } from "@/lib/constants";
import { listOrdersByUser } from "@/lib/db/queries/order";
import { orderDocToSummary } from "@/lib/services/order";
import type { AdminCustomersQuery } from "@/lib/validators/admin";
import type {
  AdminCustomerDetail,
  AdminCustomerRow,
  AdminCustomersPage,
} from "@/types/api/admin-customers";
import type { UserNotificationPrefs, UserProfile, UserTier } from "@/types/api/user";

/* ----------------------------------------------------------------------------
 * Admin customer service. Maps the DB helpers' raw DTO shapes into the API
 * contract DTOs. Aggregates totalSpent + lastOrderAt for the list view separately
 * since the helper returns profile rows only.
 * -------------------------------------------------------------------------- */

const DEFAULT_NOTIFICATION_PREFS: UserNotificationPrefs = {
  orderUpdates: true,
  promos: false,
  newsletter: false,
};

type OrderAggRow = {
  _id: Types.ObjectId;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: Date | null;
};

async function aggregateOrderStats(
  userIds: Types.ObjectId[],
): Promise<Map<string, { totalOrders: number; totalSpent: number; lastOrderAt: Date | null }>> {
  if (userIds.length === 0) return new Map();
  const rows = await Order.aggregate<OrderAggRow>([
    {
      $match: {
        userId: { $in: userIds },
        orderStatus: { $nin: ["cancelled", "returned"] },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$userId",
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$total" },
        lastOrderAt: { $max: "$placedAt" },
      },
    },
  ]);
  return new Map(
    rows.map((r) => [
      r._id.toString(),
      {
        totalOrders: r.totalOrders,
        totalSpent: r.totalSpent,
        lastOrderAt: r.lastOrderAt,
      },
    ]),
  );
}

function toRow(
  raw: CustomerRowDTO,
  stats?: { totalOrders: number; totalSpent: number; lastOrderAt: Date | null },
): AdminCustomerRow {
  const row: AdminCustomerRow = {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    totalOrders: stats?.totalOrders ?? 0,
    totalSpent: stats?.totalSpent ?? 0,
  };
  if (stats?.lastOrderAt) row.lastOrderAt = stats.lastOrderAt.toISOString();
  return row;
}

export async function listCustomersService(
  query: AdminCustomersQuery,
): Promise<AdminCustomersPage> {
  await connectDb();
  const opts: Parameters<typeof listCustomers>[0] = {};
  if (query.q) opts.q = query.q;
  if (query.page) opts.page = query.page;
  if (query.limit) opts.limit = query.limit;
  const raw = await listCustomers(opts);

  const userIds = raw.items.map((u) => new Types.ObjectId(u.id));
  const stats = await aggregateOrderStats(userIds);

  return {
    items: raw.items.map((row) => toRow(row, stats.get(row.id))),
    page: raw.page,
    limit: raw.limit,
    total: raw.total,
    totalPages: raw.totalPages,
  };
}

function detailToProfile(detail: CustomerDetailDTO): UserProfile {
  const p = detail.profile;
  const profile: UserProfile = {
    id: p.id,
    name: p.name,
    email: p.email,
    loyaltyPoints: p.loyaltyPoints,
    tier: (p.tier as UserTier) ?? "silver",
    emailVerified: p.emailVerified,
    notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
  };
  if (p.phone) profile.phone = p.phone;
  if (p.dateOfBirth) profile.dateOfBirth = p.dateOfBirth;
  if (p.skinType) profile.skinType = p.skinType as SkinType;
  if (p.referralCode) profile.referralCode = p.referralCode;
  return profile;
}

export async function getCustomerDetailService(id: string): Promise<AdminCustomerDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Customer not found");
  const raw = await getCustomerDetail(id);
  if (!raw) throw new NotFoundError("Customer not found");

  const profile = detailToProfile(raw);

  // Load a full page of order summaries (page 1, limit 20) via the shared helper
  // so we reuse the OrderSummary DTO.
  const page = await listOrdersByUser(id, { page: 1, limit: 20 });
  const orders = page.items.map(orderDocToSummary);

  return {
    ...profile,
    orders,
    totalOrders: raw.stats.orderCount,
    totalSpent: raw.stats.totalSpent,
  };
}
