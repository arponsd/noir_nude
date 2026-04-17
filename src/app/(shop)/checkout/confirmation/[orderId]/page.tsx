import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check } from "lucide-react";
import { format } from "date-fns";
import OrderTimeline from "@/components/commerce/OrderTimeline";
import StatusPill from "@/components/commerce/StatusPill";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getUserOrder } from "@/lib/services/order";
import { formatBDT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Order placed" };
}

interface Params {
  orderId: string;
}

interface SearchParamsShape {
  guest?: string;
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParamsShape>;
}) {
  const { orderId } = await params;
  const sp = await searchParams;
  const isGuest = sp.guest === "1";

  // reason: guest order lookup by signed-link is phase-6 work — for now guests hit the
  // lightweight confirmation UI without the full order (shown from URL alone). Logged-in
  // customers get the owner-scoped fetch.
  const session = await auth();
  if (!session?.user?.id && !isGuest) {
    redirect(`/login?next=/checkout/confirmation/${orderId}`);
  }

  const order = session?.user?.id ? await getUserOrder(session.user.id, orderId) : null;
  if (session?.user?.id && !order) notFound();

  const placedAt = order ? format(new Date(order.placedAt), "MMMM d, yyyy · h:mm a") : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden
          className="inline-flex size-14 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]"
        >
          <Check className="size-7" strokeWidth={2} />
        </span>
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)] md:text-4xl">
          Thank you — your order is placed
        </h1>
        {order ? (
          <p className="text-sm text-[var(--ink-soft)]">
            Order <span className="font-mono tabular-nums">#{order.orderNumber}</span>
            {placedAt ? <> · placed {placedAt}</> : null}
          </p>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">
            A confirmation email is on its way. Reference number:{" "}
            <span className="font-mono tabular-nums">{orderId}</span>
          </p>
        )}
      </header>

      {order ? (
        <>
          <section className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg text-[var(--ink)]">Status</h2>
                <StatusPill status={order.orderStatus} />
              </div>
              <OrderTimeline
                history={order.statusHistory}
                currentStatus={order.orderStatus}
                className="mt-2"
              />
            </div>

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
          </section>

          <section className="mt-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
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
                    <p className="line-clamp-2 text-sm font-medium text-[var(--ink)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      SKU {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--ink)] tabular-nums">
                    {formatBDT(item.subtotal)}
                  </p>
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
        </>
      ) : null}

      <footer className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {order ? (
          <Button asChild>
            <Link href={`/account/orders/${order.id}`}>View order details</Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </footer>
    </div>
  );
}
