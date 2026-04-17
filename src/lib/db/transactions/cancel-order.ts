import mongoose, { Types } from "mongoose";
import type { ClientSession } from "mongoose";
import { ERROR_CODES } from "@/lib/constants";
import { Order, type OrderDoc } from "@/lib/db/models/Order";
import { Product } from "@/lib/db/models/Product";
import { OrderError } from "./place-order";

export const ORDER_CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000;

async function runInTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}

/**
 * Cancel an order owned by `userId`, restore inventory, append to statusHistory.
 * Only allowed when current status is 'placed' or 'confirmed' AND the order was placed
 * within ORDER_CANCEL_WINDOW_MS. Throws ORDER_NOT_CANCELLABLE otherwise.
 */
export async function cancelOrderTransaction(
  orderId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  reason: string,
): Promise<OrderDoc> {
  return runInTransaction(async (session) => {
    const order = await Order.findOne({ _id: orderId, userId }).session(session);
    if (!order) {
      throw new OrderError(ERROR_CODES.NOT_FOUND, "Order not found");
    }

    const status = order.orderStatus;
    if (status !== "placed" && status !== "confirmed") {
      throw new OrderError(
        ERROR_CODES.ORDER_NOT_CANCELLABLE,
        `Order cannot be cancelled from status '${status}'`,
      );
    }

    const placedAt = order.placedAt?.getTime() ?? 0;
    if (Date.now() - placedAt > ORDER_CANCEL_WINDOW_MS) {
      throw new OrderError(ERROR_CODES.ORDER_NOT_CANCELLABLE, "Cancellation window has expired");
    }

    for (const item of order.items) {
      const res = await Product.updateOne(
        { _id: item.productId, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity, totalSold: -item.quantity } },
        { session },
      );
      if (res.modifiedCount !== 1) {
        throw new OrderError(ERROR_CODES.INTERNAL_ERROR, "Stock restoration failed during cancel", {
          productId: item.productId.toString(),
          variantId: item.variantId.toString(),
        });
      }
    }

    order.orderStatus = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      note: reason,
      changedBy: new Types.ObjectId(userId.toString()),
      changedAt: new Date(),
    });
    await order.save({ session });

    return order;
  });
}
