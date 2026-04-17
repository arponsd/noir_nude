import { describe, it, expect, afterEach, vi } from "vitest";
import { Types } from "mongoose";

import { installAuthMock, setMockSession, clearMockSession } from "../../harness/mock-auth";

installAuthMock();

import {
  createCouponService,
  deactivateCouponService,
  getCouponService,
  listCouponsService,
  updateCouponService,
} from "@/lib/services/admin-coupon";
import { ERROR_CODES } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";

const ADMIN = { id: new Types.ObjectId().toString(), role: "admin" as UserRole };

function baseInput(code = "SUMMER10") {
  return {
    code,
    type: "percentage" as const,
    value: 10,
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: "2026-12-31T00:00:00.000Z",
  };
}

describe("admin coupons service", () => {
  afterEach(() => {
    clearMockSession();
    vi.restoreAllMocks();
  });

  it("create → get → update → soft-deactivate round trip", async () => {
    const created = await createCouponService(baseInput("FLOW1"), ADMIN);
    expect(created.code).toBe("FLOW1");
    expect(created.isActive).toBe(true);

    const fetched = await getCouponService(created.id);
    expect(fetched.id).toBe(created.id);

    const updated = await updateCouponService(created.id, { value: 20 }, ADMIN);
    expect(updated.value).toBe(20);

    const deactivated = await deactivateCouponService(created.id, ADMIN);
    expect(deactivated.isActive).toBe(false);

    // listCoupons with activeOnly (default) excludes deactivated
    const activeOnly = await listCouponsService({});
    const codes = activeOnly.items.map((c) => c.code);
    expect(codes).not.toContain("FLOW1");

    // with includeInactive: true, it surfaces again
    const all = await listCouponsService({ includeInactive: true });
    expect(all.items.map((c) => c.code)).toContain("FLOW1");
  });

  it("duplicate code → VALIDATION_FAILED", async () => {
    await createCouponService(baseInput("DUP1"), ADMIN);
    await expect(createCouponService(baseInput("DUP1"), ADMIN)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });
  });

  it("non-admin cannot POST to /api/admin/coupons (403)", async () => {
    setMockSession({ role: "customer", userId: new Types.ObjectId().toString() });
    const { POST } = await import("@/app/api/admin/coupons/route");
    const req = new Request("http://localhost/api/admin/coupons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baseInput("NOPE1")),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { ok: boolean; error?: { code: string } };
    expect(body.error?.code).toBe(ERROR_CODES.FORBIDDEN);
  });
});
