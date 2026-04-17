import type { FilterQuery, PipelineStage, Types } from "mongoose";
import { User, type UserDoc } from "@/lib/db/models/User";
import { Order, type OrderDoc } from "@/lib/db/models/Order";
import { Review } from "@/lib/db/models/Review";
import { Address } from "@/lib/db/models/Address";

export type CustomerRowDTO = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tier: string;
  loyaltyPoints: number;
  emailVerified: boolean;
  createdAt: string;
};

export type ListCustomersOpts = {
  q?: string;
  page?: number;
  limit?: number;
};

export type ListCustomersResult = {
  items: CustomerRowDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerDetailDTO = {
  profile: CustomerRowDTO & {
    dateOfBirth?: string;
    skinType?: string;
    referralCode?: string;
    isActive: boolean;
    updatedAt: string;
  };
  stats: {
    orderCount: number;
    reviewCount: number;
    addressCount: number;
    totalSpent: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    placedAt: string;
  }>;
};

type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  emailVerified?: boolean;
  dateOfBirth?: Date;
  skinType?: string;
  loyaltyPoints?: number;
  tier?: string;
  referralCode?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type LeanOrderSummary = {
  _id: Types.ObjectId;
  orderNumber: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  placedAt: Date;
};

function clampPage(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 1;
  return Math.floor(n);
}

function clampLimit(n: number | undefined): number {
  if (!n || n < 1 || !Number.isFinite(n)) return 20;
  return Math.min(Math.floor(n), 100);
}

// reason: escape user input before RegExp construction — avoids ReDoS + literal-intent bugs.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toRow(u: LeanUser): CustomerRowDTO {
  const row: CustomerRowDTO = {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    tier: u.tier ?? "silver",
    loyaltyPoints: u.loyaltyPoints ?? 0,
    emailVerified: u.emailVerified ?? false,
    createdAt: u.createdAt.toISOString(),
  };
  if (u.phone) row.phone = u.phone;
  return row;
}

/**
 * Paginated customer listing. Only surfaces `role: customer`, non-soft-deleted users.
 * `q` matches against email or name prefix, case-insensitive.
 */
export async function listCustomers(opts: ListCustomersOpts = {}): Promise<ListCustomersResult> {
  const page = clampPage(opts.page);
  const limit = clampLimit(opts.limit);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<UserDoc> = { role: "customer" };

  const q = opts.q?.trim();
  if (q) {
    const prefix = new RegExp(`^${escapeRegex(q)}`, "i");
    filter.$or = [{ email: prefix }, { name: prefix }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<LeanUser[]>(),
    User.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { items: items.map(toRow), page, limit, total, totalPages };
}

type TotalSpentRow = { _id: null; total: number };

/**
 * Full customer detail pane: profile, last 10 orders, totalSpent (all-time excl.
 * cancelled/returned), and supplementary join counts (reviews/addresses).
 */
export async function getCustomerDetail(
  id: Types.ObjectId | string,
): Promise<CustomerDetailDTO | null> {
  const user = await User.findOne({ _id: id, role: "customer" }).lean<LeanUser | null>();
  if (!user) return null;

  const filterUserOrders: FilterQuery<OrderDoc> = { userId: user._id };

  const totalSpentPipeline: PipelineStage[] = [
    {
      $match: {
        userId: user._id,
        orderStatus: { $nin: ["cancelled", "returned"] },
        deletedAt: null,
      },
    },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ];

  const [recent, orderCount, reviewCount, addressCount, totalSpentRows] = await Promise.all([
    Order.find(filterUserOrders)
      .sort({ placedAt: -1 })
      .limit(10)
      .select({ orderNumber: 1, total: 1, orderStatus: 1, paymentStatus: 1, placedAt: 1 })
      .lean<LeanOrderSummary[]>(),
    Order.countDocuments(filterUserOrders),
    Review.countDocuments({ userId: user._id }),
    Address.countDocuments({ userId: user._id }),
    Order.aggregate<TotalSpentRow>(totalSpentPipeline),
  ]);

  const totalSpent = totalSpentRows[0]?.total ?? 0;

  const base = toRow(user);
  const profile: CustomerDetailDTO["profile"] = {
    ...base,
    isActive: user.isActive ?? true,
    updatedAt: user.updatedAt.toISOString(),
  };
  if (user.dateOfBirth) profile.dateOfBirth = user.dateOfBirth.toISOString();
  if (user.skinType) profile.skinType = user.skinType;
  if (user.referralCode) profile.referralCode = user.referralCode;

  return {
    profile,
    stats: {
      orderCount,
      reviewCount,
      addressCount,
      totalSpent,
    },
    recentOrders: recent.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      total: o.total,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      placedAt: o.placedAt.toISOString(),
    })),
  };
}
