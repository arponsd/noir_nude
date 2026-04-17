import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import AddressCard from "@/components/commerce/AddressCard";
import OrderTimeline from "@/components/commerce/OrderTimeline";
import StatusPill from "@/components/commerce/StatusPill";
import AdminOrderStatusForm from "@/components/admin/orders/AdminOrderStatusForm";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/constants";
import { NotFoundError } from "@/lib/api/response";
import { adminGetOrderService } from "@/lib/services/admin-order";

export const metadata = { title: "Order — Admin" };
export const dynamic = "force-dynamic";

function formatWhen(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy · HH:mm");
  } catch {
    return iso;
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order;
  try {
    order = await adminGetOrderService(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
            <Link href="/admin/orders">← Back to orders</Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
              Order <span className="font-mono tabular-nums">#{order.orderNumber}</span>
            </h1>
            <StatusPill status={order.orderStatus} />
          </div>
          <p className="text-sm text-[var(--ink-soft)] tabular-nums">
            Placed {formatWhen(order.placedAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section
            aria-label="Items"
            className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]"
          >
            <header className="border-b border-[var(--line)] px-5 py-3">
              <h2 className="font-display text-base tracking-[-0.01em]">
                Items{" "}
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  ({order.items.length})
                </span>
              </h2>
            </header>
            <ul className="divide-y divide-[var(--line)]">
              {order.items.map((line) => (
                <li
                  key={`${line.productId}-${line.variantId}`}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-alt)]">
                    {line.image ? (
                      <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--ink)]">{line.name}</p>
                    <p className="text-xs text-[var(--muted)] tabular-nums">
                      {line.sku}
                      <span className="mx-1.5 opacity-60">·</span>
                      Qty {line.quantity}
                    </p>
                  </div>
                  <p className="font-display text-sm text-[var(--ink)] tabular-nums">
                    {formatBDT(line.subtotal)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Addresses" className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
                Shipping
              </h3>
              <AddressCard address={order.shippingAddress} />
            </div>
            {order.billingAddress ? (
              <div>
                <h3 className="mb-2 text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
                  Billing
                </h3>
                <AddressCard address={order.billingAddress} />
              </div>
            ) : null}
          </section>

          <section
            aria-label="Timeline"
            className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <h2 className="font-display mb-4 text-base tracking-[-0.01em]">Status history</h2>
            <OrderTimeline history={order.statusHistory} currentStatus={order.orderStatus} />
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="font-display mb-3 text-base tracking-[-0.01em]">Customer</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Email</dt>
                <dd className="truncate text-[var(--ink)]">
                  {order.shippingAddress.recipientName}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Phone</dt>
                <dd className="text-[var(--ink)] tabular-nums">{order.shippingAddress.phone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Payment</dt>
                <dd className="text-[var(--ink)] uppercase">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Payment status</dt>
                <dd className="text-[var(--ink)] capitalize">{order.paymentStatus}</dd>
              </div>
              {order.trackingNumber ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Tracking</dt>
                  <dd className="text-[var(--ink)] tabular-nums">{order.trackingNumber}</dd>
                </div>
              ) : null}
              {order.courier ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Courier</dt>
                  <dd className="text-[var(--ink)]">{order.courier}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="font-display mb-3 text-base tracking-[-0.01em]">Totals</h2>
            <dl className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">Subtotal</dt>
                <dd className="text-[var(--ink)]">{formatBDT(order.subtotal)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                  </dt>
                  <dd className="text-[var(--success)]">−{formatBDT(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">Shipping</dt>
                <dd className="text-[var(--ink)]">{formatBDT(order.shippingFee)}</dd>
              </div>
              {order.tax > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">Tax</dt>
                  <dd className="text-[var(--ink)]">{formatBDT(order.tax)}</dd>
                </div>
              ) : null}
              <div className="mt-2 flex justify-between border-t border-[var(--line)] pt-2">
                <dt className="font-medium text-[var(--ink)]">Total</dt>
                <dd className="font-display text-lg text-[var(--ink)]">{formatBDT(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-display mb-3 text-base tracking-[-0.01em] text-[var(--ink)]">
              Update status
            </h2>
            <AdminOrderStatusForm
              orderId={order.id}
              orderNumber={order.orderNumber}
              currentStatus={order.orderStatus}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
