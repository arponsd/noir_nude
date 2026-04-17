import { describe, it, expect, vi, afterEach } from "vitest";
import { Types } from "mongoose";

import { installAuthMock, setMockSession, clearMockSession } from "../../harness/mock-auth";

installAuthMock();

import { seedOrder } from "../../harness/seed-orders";
import { seedUser } from "../../harness/seed";
import * as emailService from "@/lib/services/email";
import { adminUpdateOrderStatusService, adminGetOrderService } from "@/lib/services/admin-order";
import { ActivityLog } from "@/lib/db/models/ActivityLog";
import { Order } from "@/lib/db/models/Order";
import { ERROR_CODES } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";

type AdminActor = { id: string; role: UserRole };

const ADMIN: AdminActor = {
  id: new Types.ObjectId().toString(),
  role: "admin",
};

describe("adminUpdateOrderStatusService", () => {
  afterEach(() => {
    clearMockSession();
    vi.restoreAllMocks();
  });

  async function seedPlacedOrder(): Promise<string> {
    const user = await seedUser({
      email: `status+${Date.now()}@example.com`,
      password: "Zx!9aQpm.Vr34K",
    });
    const order = await seedOrder({
      userId: user.userId,
      status: "placed",
      items: [
        {
          productId: new Types.ObjectId(),
          variantId: new Types.ObjectId(),
          name: "Test",
          sku: "T-01",
          price: 50_000,
          quantity: 1,
        },
      ],
    });
    return order._id.toString();
  }

  it("walks placed → confirmed → packed → shipped → delivered, writing history + logs", async () => {
    const shippedSpy = vi
      .spyOn(emailService, "sendOrderShippedEmail")
      .mockResolvedValue({ delivered: true, provider: "logger" });
    vi.spyOn(emailService, "sendOrderDeliveredEmail").mockResolvedValue({
      delivered: true,
      provider: "logger",
    });

    const orderId = await seedPlacedOrder();

    await adminUpdateOrderStatusService(orderId, ADMIN, { status: "confirmed" });
    await adminUpdateOrderStatusService(orderId, ADMIN, { status: "packed" });
    await adminUpdateOrderStatusService(orderId, ADMIN, {
      status: "shipped",
      trackingNumber: "SP-99",
      courier: "Sundarban",
    });
    await adminUpdateOrderStatusService(orderId, ADMIN, { status: "delivered" });

    const detail = await adminGetOrderService(orderId);
    expect(detail.orderStatus).toBe("delivered");
    const statuses = detail.statusHistory.map((h) => h.status);
    // seed inserts a "placed" history entry on create; then 4 transitions.
    expect(statuses).toEqual(["placed", "confirmed", "packed", "shipped", "delivered"]);

    // email spy fired once on shipped transition
    expect(shippedSpy).toHaveBeenCalledTimes(1);

    // ActivityLog entries — one per status transition (4 total).
    const logs = await ActivityLog.find({
      entity: "order",
      entityId: new Types.ObjectId(orderId),
    }).lean();
    expect(logs.length).toBe(4);
    const events = new Set(logs.map((l) => l.event));
    expect(events).toEqual(new Set(["order.status_update"]));
  });

  it("rejects an invalid transition (delivered → packed) with ORDER_NOT_CANCELLABLE", async () => {
    const orderId = await seedPlacedOrder();
    // force delivered
    await Order.updateOne(
      { _id: new Types.ObjectId(orderId) },
      { $set: { orderStatus: "delivered" } },
    );
    await expect(
      adminUpdateOrderStatusService(orderId, ADMIN, { status: "packed" }),
    ).rejects.toMatchObject({ code: ERROR_CODES.ORDER_NOT_CANCELLABLE });
  });

  it("returns 403 at the route layer for a non-admin session", async () => {
    const orderId = await seedPlacedOrder();
    setMockSession({ role: "customer", userId: new Types.ObjectId().toString() });

    const { PATCH } = await import("@/app/api/admin/orders/[id]/status/route");
    const req = new Request(`http://localhost/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: orderId }) });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { ok: boolean; error?: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("fires sendOrderShippedEmail when transitioning to shipped", async () => {
    const shippedSpy = vi
      .spyOn(emailService, "sendOrderShippedEmail")
      .mockResolvedValue({ delivered: true, provider: "logger" });

    const orderId = await seedPlacedOrder();
    await adminUpdateOrderStatusService(orderId, ADMIN, { status: "confirmed" });
    await adminUpdateOrderStatusService(orderId, ADMIN, { status: "packed" });
    await adminUpdateOrderStatusService(orderId, ADMIN, {
      status: "shipped",
      trackingNumber: "T-1",
      courier: "S",
    });

    expect(shippedSpy).toHaveBeenCalledTimes(1);
    const [toArg, detailArg] = shippedSpy.mock.calls[0]!;
    expect(typeof toArg).toBe("string");
    expect(detailArg).toMatchObject({ trackingNumber: "T-1", courier: "S" });
  });
});
