// e2e: tag=admin-orders
// TODO(security): enforce x-csrf-token once middleware covers admin API routes.

import { NextResponse } from "next/server";
import { z } from "zod";
import { Order } from "@/lib/db/models";
import { connectDb } from "@/lib/db/connect";
import { requireRole } from "@/lib/auth/require-role";
import { safeRoute, fail, NotFoundError } from "@/lib/api/response";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { assertTransition } from "@/lib/services/order-state";
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from "@/lib/services/email";
import { orderDocToDetail } from "@/lib/services/order";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import logger from "@/lib/utils/logger";

const statusUpdateSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    note: z.string().trim().min(1).max(1000).optional(),
    trackingNumber: z.string().trim().min(1).max(100).optional(),
    courier: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const PATCH = safeRoute(async (request: Request, ctx: unknown) => {
  const { id } = objectIdRouteParamsSchema.parse(
    await (ctx as { params: Promise<{ id: string }> }).params,
  );
  const session = await requireRole(["admin", "manager"]);
  const body = statusUpdateSchema.parse(await request.json());

  await connectDb();
  const order = await Order.findById(id);
  if (!order || order.deletedAt) throw new NotFoundError("Order not found");

  const from = order.orderStatus as OrderStatus;
  const to = body.status;

  if (from !== to) {
    assertTransition(from, to);
    order.orderStatus = to;
    order.statusHistory.push({
      status: to,
      note: body.note,
      changedBy: session.user.id,
      changedAt: new Date(),
    });
    if (to === "delivered") order.deliveredAt = new Date();
  }

  if (body.trackingNumber !== undefined) order.trackingNumber = body.trackingNumber;
  if (body.courier !== undefined) order.courier = body.courier;

  await order.save();

  logger.info(
    { actorId: session.user.id, orderId: order.id, from, to },
    "admin_order_status_update",
  );

  const email = order.userId ? undefined : order.guestEmail;
  const recipient = email ?? (order.shippingAddress as { phone?: string } | undefined)?.phone;
  const detail = orderDocToDetail(order.toObject());

  if (to === "shipped" && typeof email === "string" && email.length > 0) {
    try {
      await sendOrderShippedEmail(email, detail);
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "order_shipped_email_failed");
    }
  } else if (to === "delivered" && typeof email === "string" && email.length > 0) {
    try {
      await sendOrderDeliveredEmail(email, detail);
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "order_delivered_email_failed");
    }
  }

  void recipient;
  return NextResponse.json({ ok: true, data: detail }, { status: 200 });
});

// Keep fail import referenced (used by safeRoute envelope in error paths).
void fail;
