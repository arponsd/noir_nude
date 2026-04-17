"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import CartSummary from "@/components/commerce/CartSummary";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { placeOrderAction } from "@/lib/actions/order";
import { formatBDT } from "@/lib/constants";
import type { Cart } from "@/types/api/cart";
import type { Address } from "@/types/api/address";

export interface CheckoutReviewStepProps {
  cart: Cart;
  selectedAddress: Address | null;
  backHref: string;
}

export default function CheckoutReviewStep({
  cart,
  selectedAddress,
  backHref,
}: CheckoutReviewStepProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!selectedAddress) router.replace("/checkout?step=address");
  }, [selectedAddress, router]);

  if (!selectedAddress) return null;

  const handlePlace = () => {
    startTransition(async () => {
      const res = await placeOrderAction({
        addressId: selectedAddress.id,
        ...(cart.couponCode ? { couponCode: cart.couponCode } : {}),
      });
      if (res.ok) {
        router.push(`/checkout/confirmation/${res.data.orderId}`);
      } else {
        toast({
          title: "Could not place order",
          description: res.error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-[var(--ink)]">Shipping address</h2>
            <Link
              href={backHref}
              className="text-sm text-[var(--accent)] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              Change
            </Link>
          </header>
          <address className="text-sm text-[var(--ink)] not-italic">
            <p className="font-medium">{selectedAddress.recipientName}</p>
            <p className="text-[var(--ink-soft)] tabular-nums">{selectedAddress.phone}</p>
            <p className="mt-1 text-[var(--ink-soft)]">
              {selectedAddress.addressLine1}
              {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : null}
            </p>
            <p className="text-[var(--ink-soft)]">
              {selectedAddress.city}, {selectedAddress.district}{" "}
              <span className="tabular-nums">{selectedAddress.postalCode}</span>,{" "}
              {selectedAddress.country}
            </p>
          </address>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
          <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-display text-lg text-[var(--ink)]">Your items</h2>
            <Link
              href="/cart"
              className="text-sm text-[var(--accent)] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              Edit
            </Link>
          </header>
          <ul>
            {cart.items.map((item) => (
              <li
                key={item.itemId}
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
                  <p className="text-xs font-medium tracking-[0.08em] text-[var(--muted)] uppercase">
                    {item.brand}
                  </p>
                  <p className="line-clamp-2 text-sm font-medium text-[var(--ink)]">{item.name}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {item.variantName} · Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm text-[var(--ink)] tabular-nums">
                  {formatBDT(item.lineSubtotal)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="font-display mb-2 text-lg text-[var(--ink)]">Payment</h2>
          <p className="text-sm text-[var(--ink-soft)]">
            Cash on delivery (COD) — pay when your order arrives.
          </p>
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <CartSummary cart={cart} />
        <Button
          type="button"
          size="lg"
          onClick={handlePlace}
          disabled={pending}
          className="w-full"
          aria-live="polite"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Placing order…
            </>
          ) : (
            "Place order (COD)"
          )}
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href={backHref}>Back to address</Link>
        </Button>
      </aside>
    </section>
  );
}
