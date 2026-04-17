"use client";

import AdminOrderStatusForm from "@/components/admin/orders/AdminOrderStatusForm";
import ActivityFeed from "@/components/admin/activity/ActivityFeed";
import DateRangePicker from "@/components/admin/reports/DateRangePicker";
import type { ActivityRowData } from "@/components/admin/activity/ActivityRow";

const SAMPLE_ACTIVITY: ActivityRowData[] = [
  {
    id: "a1",
    event: "order.status_changed",
    summary: "Marked order #A2134 as shipped with courier Pathao.",
    actorName: "Nadia (manager)",
    entityLabel: "Order #A2134",
    entityHref: "/admin/orders/a2134",
    entityType: "order",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "a2",
    event: "coupon.created",
    summary: "Created coupon SPRING25 (25% off).",
    actorName: "Rahim (admin)",
    entityLabel: "SPRING25",
    entityHref: "/admin/coupons/spring25",
    entityType: "coupon",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "a3",
    event: "banner.reordered",
    summary: "Reordered the homepage banners.",
    actorName: "Nadia (manager)",
    entityType: "banner",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

/**
 * Interactive admin-primitive showcase. Kept in a client island so the
 * parent design page can stay a server component.
 */
export default function DesignAdminClient() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Order status form
        </p>
        <div className="mt-3">
          <AdminOrderStatusForm
            orderId="preview-order"
            orderNumber="PREVIEW-001"
            currentStatus="confirmed"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Activity feed
        </p>
        <div className="mt-3">
          <ActivityFeed
            items={SAMPLE_ACTIVITY}
            entityTypes={["order", "coupon", "banner", "product"]}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Date range picker
        </p>
        <div className="mt-3">
          <DateRangePicker />
        </div>
      </div>
    </div>
  );
}
