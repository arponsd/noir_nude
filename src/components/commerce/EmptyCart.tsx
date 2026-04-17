import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface EmptyCartProps {
  href?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  className?: string;
}

export default function EmptyCart({
  href = "/shop",
  title = "Your cart is empty",
  description = "Discover fresh arrivals and editor favourites — add a few to get started.",
  ctaLabel = "Browse products",
  className,
}: EmptyCartProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center",
        className,
      )}
      role="status"
    >
      <span
        aria-hidden
        className="inline-flex size-14 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--ink-soft)]"
      >
        <ShoppingBag className="size-6" strokeWidth={1.5} />
      </span>
      <div className="space-y-1">
        <h3 className="font-display text-xl text-[var(--ink)]">{title}</h3>
        <p className="max-w-sm text-sm text-[var(--ink-soft)]">{description}</p>
      </div>
      <Button asChild>
        <Link href={href}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
