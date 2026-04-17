import type { Metadata } from "next";
import Link from "next/link";
import CheckoutSteps from "@/components/commerce/CheckoutSteps";
import GuestCheckoutForm from "@/components/commerce/GuestCheckoutForm";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Guest checkout" };
}

export default function GuestCheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)] md:text-4xl">
            Guest checkout
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Place your order without creating an account.{" "}
            <Link
              href="/login?next=/checkout"
              className="text-[var(--accent)] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              Sign in
            </Link>{" "}
            instead to use your saved cart.
          </p>
        </div>
        <CheckoutSteps current="address" />
      </header>

      <GuestCheckoutForm />
    </div>
  );
}
