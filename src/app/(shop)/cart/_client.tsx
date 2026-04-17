"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CartLineItem from "@/components/commerce/CartLineItem";
import CartSummary from "@/components/commerce/CartSummary";
import CouponInput from "@/components/commerce/CouponInput";
import PriceChangeBanner from "@/components/commerce/PriceChangeBanner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  applyCouponAction,
  removeCartItemAction,
  removeCouponAction,
  updateCartItemAction,
} from "@/lib/actions/cart";
import type { Cart } from "@/types/api/cart";

export interface CartViewProps {
  initialCart: Cart;
}

export default function CartView({ initialCart }: CartViewProps) {
  const { toast } = useToast();
  const [cart, setCart] = React.useState<Cart>(initialCart);
  const [pending, startTransition] = React.useTransition();

  const anyPriceChanged = cart.items.some((i) => i.priceChanged);

  const handleQty = (itemId: string, quantity: number) => {
    startTransition(async () => {
      const res = await updateCartItemAction({ itemId, quantity });
      if (res.ok) {
        setCart(res.data);
      } else {
        toast({
          title: "Could not update quantity",
          description: res.error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleRemove = (itemId: string) => {
    startTransition(async () => {
      const res = await removeCartItemAction({ itemId });
      if (res.ok) {
        setCart(res.data);
      } else {
        toast({
          title: "Could not remove item",
          description: res.error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleApplyCoupon = async (code: string) => {
    const res = await applyCouponAction({ code });
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    if (!res.data.ok) {
      throw new Error(res.data.reason ?? "Coupon is not valid for this cart.");
    }
    // reason: applyCouponAction returns a CouponValidation (not the refreshed cart),
    // so we splice the coupon/discount onto local state to avoid a second round-trip.
    const discount = res.data.discount ?? 0;
    const postDiscount = Math.max(0, cart.subtotal - discount);
    const freeShippingEligible = postDiscount >= cart.freeShippingThreshold;
    const shippingFee = cart.items.length === 0 || freeShippingEligible ? 0 : cart.shippingFee;
    setCart((prev) => ({
      ...prev,
      couponCode: code.toUpperCase(),
      discount,
      shippingFee,
      total: postDiscount + shippingFee,
      freeShippingEligible,
      freeShippingRemaining: freeShippingEligible
        ? 0
        : Math.max(0, cart.freeShippingThreshold - postDiscount),
    }));
    toast({
      title: "Coupon applied",
      description: `${code.toUpperCase()} — you saved on this order.`,
      variant: "success",
    });
  };

  const handleRemoveCoupon = async () => {
    const res = await removeCouponAction();
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    setCart(res.data);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-5">
        {anyPriceChanged ? <PriceChangeBanner /> : null}

        <div
          id="cart-items"
          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]"
          aria-busy={pending}
        >
          <ul className="px-5">
            {cart.items.map((item) => (
              <li key={item.itemId}>
                <CartLineItem
                  item={item}
                  variant="page"
                  onQtyChange={handleQty}
                  onRemove={handleRemove}
                />
              </li>
            ))}
          </ul>
        </div>

        {pending ? (
          <p
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 text-xs text-[var(--ink-soft)]"
          >
            <Loader2 className="size-3.5 animate-spin" /> Updating cart…
          </p>
        ) : null}
      </section>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
        <CouponInput
          currentCode={cart.couponCode}
          currentDiscount={cart.discount}
          onApply={handleApplyCoupon}
          onRemove={handleRemoveCoupon}
        />
        <CartSummary cart={cart} />
        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </aside>
    </div>
  );
}
