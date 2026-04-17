import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { listAdminOrders, adminGetOrder } from "@/lib/db/queries/admin-orders";
import { User } from "@/lib/db/models/User";
import { Order } from "@/lib/db/models/Order";
import { createActivityLog } from "@/lib/db/models/ActivityLog";
import { NotFoundError, ValidationError } from "@/lib/api/response";
import { ERROR_CODES, type OrderStatus, type UserRole } from "@/lib/constants";
import { assertTransition } from "@/lib/services/order-state";
import { orderDocToSummary, orderDocToDetail } from "@/lib/services/order";
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from "@/lib/services/email";
import type { LeanOrder } from "@/lib/db/queries/order";
import type {
  AdminOrderStatusUpdateInput,
  AdminOrdersQuery,
  AdminRefundInput,
} from "@/lib/validators/admin";
import type { AdminOrderRow, AdminOrdersPage } from "@/types/api/admin-orders";
import type { OrderDetail } from "@/types/api/order";
import logger from "@/lib/utils/logger";

/* ----------------------------------------------------------------------------
 * Admin order service.
 *
 * Wraps the admin-side DB helpers with DTO mapping + writes an ActivityLog entry
 * for every mutation (status update, refund stub).
 * -------------------------------------------------------------------------- */

type CustomerLookup = { email: string; name?: string };

async function resolveCustomers(
  userIds: readonly (Types.ObjectId | null | undefined)[],
): Promise<Map<string, CustomerLookup>> {
  const ids = Array.from(
    new Set(userIds.filter((v): v is Types.ObjectId => Boolean(v)).map((v) => v.toString())),
  );
  if (ids.length === 0) return new Map();
  const users = await User.find({ _id: { $in: ids } })
    .setOptions({ withDeleted: true })
    .select({ email: 1, name: 1 })
    .lean<Array<{ _id: Types.ObjectId; email: string; name?: string }>>();
  return new Map(
    users.map((u) => [
      u._id.toString(),
      u.name ? { email: u.email, name: u.name } : { email: u.email },
    ]),
  );
}

function rowFromOrder(doc: LeanOrder, customers: Map<string, CustomerLookup>): AdminOrderRow {
  const summary = orderDocToSummary(doc);
  const userKey = doc.userId ? doc.userId.toString() : null;
  const customer = userKey ? customers.get(userKey) : undefined;
  const email = customer?.email ?? doc.guestEmail ?? "";
  const row: AdminOrderRow = {
    ...summary,
    customerEmail: email,
    isGuest: !doc.userId,
  };
  if (customer?.name) row.customerName = customer.name;
  return row;
}

export async function listAdminOrdersService(query: AdminOrdersQuery): Promise<AdminOrdersPage> {
  await connectDb();
  const opts: Parameters<typeof listAdminOrders>[0] = {};
  if (query.status) opts.status = query.status;
  if (query.q) opts.q = query.q;
  if (query.page) opts.page = query.page;
  if (query.limit) opts.limit = query.limit;
  const raw = await listAdminOrders(opts);
  const customers = await resolveCustomers(raw.items.map((o) => o.userId as Types.ObjectId | null));
  return {
    items: raw.items.map((o) => rowFromOrder(o as unknown as LeanOrder, customers)),
    page: raw.page,
    limit: raw.limit,
    total: raw.total,
    totalPages: raw.totalPages,
  };
}

export async function adminGetOrderService(orderId: string): Promise<OrderDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new NotFoundError("Order not found");
  const doc = await adminGetOrder(orderId);
  if (!doc) throw new NotFoundError("Order not found");
  return orderDocToDetail(doc as unknown as LeanOrder);
}

export async function adminUpdateOrderStatusService(
  orderId: string,
  actor: { id: string; role: UserRole },
  input: AdminOrderStatusUpdateInput,
): Promise<OrderDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new NotFoundError("Order not found");

  const order = await Order.findById(orderId);
  if (!order || order.deletedAt) throw new NotFoundError("Order not found");

  const from = order.orderStatus as OrderStatus;
  const to = input.status;

  if (from !== to) {
    assertTransition(from, to);
    order.orderStatus = to;
    order.statusHistory.push({
      status: to,
      note: input.note,
      changedBy: new Types.ObjectId(actor.id),
      changedAt: new Date(),
    });
    if (to === "delivered") order.deliveredAt = new Date();
  }

  if (input.trackingNumber !== undefined) order.trackingNumber = input.trackingNumber;
  if (input.courier !== undefined) order.courier = input.courier;

  await order.save();

  const detail = orderDocToDetail(order.toObject() as unknown as LeanOrder);

  // Fire notification emails on shipped/delivered transitions. Guests use guestEmail;
  // authenticated orders look up the user's email.
  if (from !== to && (to === "shipped" || to === "delivered")) {
    let email: string | null = null;
    if (order.guestEmail) {
      email = order.guestEmail;
    } else if (order.userId) {
      const u = await User.findById(order.userId)
        .select({ email: 1 })
        .lean<{ email?: string } | null>();
      email = u?.email ?? null;
    }
    if (email) {
      try {
        if (to === "shipped") await sendOrderShippedEmail(email, detail);
        else await sendOrderDeliveredEmail(email, detail);
      } catch (err) {
        logger.warn({ err, orderId: order.id, to }, "order_status_email_failed");
      }
    }
  }

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "order.status_update",
    entity: "order",
    entityId: order._id,
    summary:
      from === to
        ? `Updated order ${order.orderNumber}`
        : `Order ${order.orderNumber}: ${from} → ${to}`,
    details: {
      from,
      to,
      note: input.note,
      trackingNumber: input.trackingNumber,
      courier: input.courier,
    },
  });

  return detail;
}

/**
 * Stub refund recorder — does not perform a real gateway refund (post-MVP).
 * Writes an ActivityLog entry and flags `paymentStatus = refunded` when the
 * order is already marked paid. Amount is in paisa.
 */
export async function adminRecordRefundService(
  orderId: string,
  actor: { id: string; role: UserRole },
  input: AdminRefundInput,
): Promise<OrderDetail> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new NotFoundError("Order not found");
  const order = await Order.findById(orderId);
  if (!order || order.deletedAt) throw new NotFoundError("Order not found");

  if (input.amount > order.total) {
    throw new ValidationError("Refund amount exceeds order total", ERROR_CODES.VALIDATION_FAILED);
  }

  if (order.paymentStatus === "paid") {
    order.paymentStatus = "refunded";
    await order.save();
  }

  await createActivityLog({
    actorId: actor.id,
    actorRole: actor.role,
    event: "order.refund_recorded",
    entity: "order",
    entityId: order._id,
    summary: `Refund recorded for ${order.orderNumber}: ${input.amount} paisa`,
    details: { amount: input.amount, reason: input.reason },
  });

  return orderDocToDetail(order.toObject() as unknown as LeanOrder);
}
