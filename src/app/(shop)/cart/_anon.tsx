import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnonymousCartCta() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-5 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center"
    >
      <span
        aria-hidden
        className="inline-flex size-14 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--ink-soft)]"
      >
        <ShoppingBag className="size-6" strokeWidth={1.5} />
      </span>
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-[var(--ink)]">
          Your cart lives with your account
        </h2>
        <p className="mx-auto max-w-md text-sm text-[var(--ink-soft)]">
          We save your cart so you can pick up right where you left off — on any device. Sign in or
          create an account to get started, or check out as a guest with items you&apos;ve already
          selected.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/login?next=/cart">Sign in</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/register?next=/cart">Create account</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/checkout/guest">Guest checkout</Link>
        </Button>
      </div>
    </div>
  );
}
