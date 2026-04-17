"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import CartLineItem from "@/components/commerce/CartLineItem";
import EmptyCart from "@/components/commerce/EmptyCart";
import FreeShippingBar from "@/components/commerce/FreeShippingBar";
import { removeCartItemAction, updateCartItemAction } from "@/lib/actions/cart";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { Cart } from "@/types/api/cart";

interface CartDrawerContextValue {
  open: () => void;
  close: () => void;
  setCount: (n: number) => void;
  count: number;
}

const CartDrawerContext = React.createContext<CartDrawerContextValue | null>(null);

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = React.useContext(CartDrawerContext);
  if (!ctx) {
    // reason: keep Header usable even if Provider is missing — return a no-op so
    // unmounted environments (tests, storybook) don't blow up.
    return {
      open: () => undefined,
      close: () => undefined,
      setCount: () => undefined,
      count: 0,
    };
  }
  return ctx;
}

export interface CartDrawerProviderProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export function CartDrawerProvider({ children, isAuthenticated }: CartDrawerProviderProps) {
  const [isOpen, setOpen] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchCart = React.useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) throw new Error("cart fetch failed");
      const json = (await res.json()) as { ok: boolean; data?: Cart };
      if (json.ok && json.data) {
        setCart(json.data);
        setCount(json.data.items.reduce((s, i) => s + i.quantity, 0));
      }
    } catch {
      // reason: drawer silently tolerates cart fetch failures; badge stays at last known value.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  // reason: refresh when the drawer is opened so the panel shows current state
  // even if the shopper added items through another tab.
  React.useEffect(() => {
    if (isOpen) void fetchCart();
  }, [isOpen, fetchCart]);

  const value = React.useMemo<CartDrawerContextValue>(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      setCount,
      count,
    }),
    [count],
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawerSheet
        isOpen={isOpen}
        onOpenChange={setOpen}
        isAuthenticated={isAuthenticated}
        cart={cart}
        loading={loading}
        onChange={(next) => {
          setCart(next);
          setCount(next.items.reduce((s, i) => s + i.quantity, 0));
        }}
      />
    </CartDrawerContext.Provider>
  );
}

function CartDrawerSheet({
  isOpen,
  onOpenChange,
  isAuthenticated,
  cart,
  loading,
  onChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
  cart: Cart | null;
  loading: boolean;
  onChange: (cart: Cart) => void;
}) {
  const [pending, startTransition] = React.useTransition();

  const handleQty = (itemId: string, quantity: number) => {
    startTransition(async () => {
      const res = await updateCartItemAction({ itemId, quantity });
      if (res.ok) onChange(res.data);
    });
  };

  const handleRemove = (itemId: string) => {
    startTransition(async () => {
      const res = await removeCartItemAction({ itemId });
      if (res.ok) onChange(res.data);
    });
  };

  const items = cart?.items ?? [];
  const busy = loading || pending;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          {cart && items.length > 0 ? (
            <p className="text-sm text-[var(--ink-soft)]" aria-live="polite">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </p>
          ) : null}
        </SheetHeader>

        <div className={cn("flex-1 overflow-y-auto px-6", busy && "opacity-60")}>
          {!isAuthenticated ? (
            <AnonymousCartNotice />
          ) : loading && !cart ? (
            <div className="flex items-center justify-center py-12" aria-live="polite">
              <Loader2 className="size-5 animate-spin text-[var(--ink-soft)]" />
              <span className="sr-only">Loading cart</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-6">
              <EmptyCart />
            </div>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.itemId}>
                  <CartLineItem
                    item={item}
                    variant="drawer"
                    onQtyChange={handleQty}
                    onRemove={handleRemove}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && items.length > 0 ? (
          <SheetFooter className="flex-col items-stretch gap-3 sm:flex-col sm:items-stretch">
            <FreeShippingBar
              subtotal={cart.subtotal}
              threshold={cart.freeShippingThreshold}
              eligible={cart.freeShippingEligible}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--ink)]">Subtotal</span>
              <span className="font-display text-lg text-[var(--ink)] tabular-nums">
                {formatBDT(cart.subtotal)}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="secondary" size="default" className="flex-1">
                <Link href="/cart" onClick={() => onOpenChange(false)}>
                  View cart
                </Link>
              </Button>
              <Button asChild size="default" className="flex-1">
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  Checkout
                </Link>
              </Button>
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function AnonymousCartNotice() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
      <span
        aria-hidden
        className="inline-flex size-12 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--ink-soft)]"
      >
        <ShoppingBag className="size-5" strokeWidth={1.5} />
      </span>
      <div className="space-y-1">
        <h3 className="font-display text-lg text-[var(--ink)]">Sign in to see your cart</h3>
        <p className="max-w-sm text-sm text-[var(--ink-soft)]">
          Your cart is saved to your account so you can pick up where you left off on any device.
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/login?next=/cart">Sign in</Link>
      </Button>
    </div>
  );
}
