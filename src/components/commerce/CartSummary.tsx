import type { Cart } from "@/types/api/cart";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import FreeShippingBar from "./FreeShippingBar";

export interface CartSummaryProps {
  cart: Cart;
  className?: string;
}

export default function CartSummary({ cart, className }: CartSummaryProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5",
        className,
      )}
    >
      <h3 className="font-display text-lg text-[var(--ink)]">Order summary</h3>

      <FreeShippingBar
        subtotal={cart.subtotal}
        threshold={cart.freeShippingThreshold}
        eligible={cart.freeShippingEligible}
      />

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-[var(--ink-soft)]">Subtotal</dt>
          <dd className="text-[var(--ink)] tabular-nums">{formatBDT(cart.subtotal)}</dd>
        </div>
        {cart.discount > 0 ? (
          <div className="flex items-center justify-between">
            <dt className="text-[var(--ink-soft)]">
              Discount{cart.couponCode ? ` (${cart.couponCode})` : null}
            </dt>
            <dd className="text-[var(--accent)] tabular-nums">-{formatBDT(cart.discount)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <dt className="text-[var(--ink-soft)]">Shipping</dt>
          <dd className="text-[var(--ink)] tabular-nums">
            {cart.shippingFee === 0 ? "Free" : formatBDT(cart.shippingFee)}
          </dd>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-[var(--line)] pt-3">
          <dt className="text-sm font-medium text-[var(--ink)]">Total</dt>
          <dd className="font-display text-lg text-[var(--ink)] tabular-nums">
            {formatBDT(cart.total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
