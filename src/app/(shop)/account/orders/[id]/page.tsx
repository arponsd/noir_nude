import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import OrderTimeline from "@/components/commerce/OrderTimeline";
import StatusPill from "@/components/commerce/StatusPill";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getUserOrder } from "@/lib/services/order";
import { formatBDT } from "@/lib/constants";
import OrderDetailActions from "./_actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(-6).toUpperCase()}` };
}

const CANCELLABLE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours per docs/04-contracts

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    const { id } = await params;
    redirect(`/login?next=/account/orders/${id}`);
  }

  const { id } = await params;
  const order = await getUserOrder(session!.user.id, id);
  if (!order) notFound();

  const placedAtDate = new Date(order.placedAt);
  const withinCancelWindow = Date.now() - placedAtDate.getTime() < CANCELLABLE_WINDOW_MS;
  const canCancel =
    (order.orderStatus === "placed" || order.orderStatus === "confirmed") && withinCancelWindow;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
            Order
          </p>
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
            <span className="font-mono tabular-nums">#{order.orderNumber}</span>
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Placed {format(placedAtDate, "MMMM d, yyyy · h:mm a")}
          </p>
        </div>
        <StatusPill status={order.orderStatus} />
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="font-display mb-4 text-lg text-[var(--ink)]">Timeline</h2>
          <OrderTimeline history={order.statusHistory} currentStatus={order.orderStatus} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="font-display mb-3 text-lg text-[var(--ink)]">Shipping to</h2>
            <address className="text-sm text-[var(--ink)] not-italic">
              <p className="font-medium">{order.shippingAddress.recipientName}</p>
              <p className="text-[var(--ink-soft)] tabular-nums">{order.shippingAddress.phone}</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2
                  ? `, ${order.shippingAddress.addressLine2}`
                  : null}
              </p>
              <p className="text-[var(--ink-soft)]">
                {order.shippingAddress.city}, {order.shippingAddress.district}{" "}
                <span className="tabular-nums">{order.shippingAddress.postalCode}</span>,{" "}
                {order.shippingAddress.country}
              </p>
            </address>
          </div>

          {order.trackingNumber || order.courier ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
              <h2 className="font-display mb-3 text-lg text-[var(--ink)]">Tracking</h2>
              <dl className="flex flex-col gap-1 text-sm">
                {order.courier ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--ink-soft)]">Courier</dt>
                    <dd className="text-[var(--ink)]">{order.courier}</dd>
                  </div>
                ) : null}
                {order.trackingNumber ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--ink-soft)]">Number</dt>
                    <dd className="font-mono text-[var(--ink)] tabular-nums">
                      {order.trackingNumber}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
        <header className="border-b border-[var(--line)] px-5 py-4">
          <h2 className="font-display text-lg text-[var(--ink)]">Items</h2>
        </header>
        <ul>
          {order.items.map((item) => (
            <li
              key={`${item.productId}-${item.variantId}`}
              className="flex items-start gap-4 border-b border-[var(--line)] px-5 py-4 last:border-b-0"
            >
              <div className="relative h-[80px] w-[64px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-alt)]">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={80}
                    className="h-full w-full object-cover"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="line-clamp-2 text-sm font-medium text-[var(--ink)]">{item.name}</p>
                <p className="text-xs text-[var(--ink-soft)]">
                  SKU {item.sku} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm text-[var(--ink)] tabular-nums">{formatBDT(item.subtotal)}</p>
            </li>
          ))}
        </ul>
        <footer className="flex flex-col gap-2 border-t border-[var(--line)] px-5 py-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">Subtotal</span>
            <span className="tabular-nums">{formatBDT(order.subtotal)}</span>
          </div>
          {order.discount > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[var(--ink-soft)]">
                Discount{order.couponCode ? ` (${order.couponCode})` : null}
              </span>
              <span className="text-[var(--accent)] tabular-nums">
                -{formatBDT(order.discount)}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">Shipping</span>
            <span className="tabular-nums">
              {order.shippingFee === 0 ? "Free" : formatBDT(order.shippingFee)}
            </span>
          </div>
          <div className="font-display mt-1 flex items-center justify-between border-t border-[var(--line)] pt-3 text-lg">
            <span>Total</span>
            <span className="tabular-nums">{formatBDT(order.total)}</span>
          </div>
        </footer>
      </section>

      <footer className="flex flex-wrap items-center gap-3">
        <OrderDetailActions orderId={order.id} canCancel={canCancel} />
        <Button asChild variant="secondary">
          <Link href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
            Download invoice
          </Link>
        </Button>
      </footer>
    </div>
  );
}
