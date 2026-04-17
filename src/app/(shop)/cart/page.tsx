import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCartForUser } from "@/lib/services/cart";
import EmptyCart from "@/components/commerce/EmptyCart";
import CartView from "./_client";
import AnonymousCartCta from "./_anon";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Your cart" };
}

export default async function CartPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <header className="mb-8 flex flex-col gap-1">
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)] md:text-4xl">
            Your cart
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Sign in to view your saved cart, or check out as a guest.
          </p>
        </header>
        <AnonymousCartCta />
      </div>
    );
  }

  const cart = await getCartForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)] md:text-4xl">
          Your cart
        </h1>
        {cart.items.length > 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">
            {cart.items.reduce((s, i) => s + i.quantity, 0)} items
          </p>
        ) : null}
      </header>

      {cart.items.length === 0 ? <EmptyCart /> : <CartView initialCart={cart} />}
    </div>
  );
}
