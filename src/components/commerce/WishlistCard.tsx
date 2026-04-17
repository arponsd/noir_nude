"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2, ShoppingBag, X } from "lucide-react";
import type { WishlistItem } from "@/types/api/wishlist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface WishlistCardProps {
  item: WishlistItem;
  onMoveToCart: (item: WishlistItem) => Promise<void> | void;
  onRemove: (item: WishlistItem) => Promise<void> | void;
  className?: string;
}

function formatAddedAt(iso: string) {
  try {
    return `Added on ${format(new Date(iso), "MMM d")}`;
  } catch {
    return "Added recently";
  }
}

export default function WishlistCard({
  item,
  onMoveToCart,
  onRemove,
  className,
}: WishlistCardProps) {
  const [moving, setMoving] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  const handleMove = async () => {
    setMoving(true);
    try {
      await onMoveToCart(item);
    } finally {
      setMoving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(item);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link
        href={`/products/${item.slug}`}
        className="block rounded-[var(--radius-md)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`${item.name} by ${item.brand}`}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-alt)]">
          {item.thumbUrl ? (
            <Image
              src={item.thumbUrl}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : null}
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium tracking-[0.08em] text-[var(--muted)] uppercase">
            {item.brand}
          </p>
          <h3 className="line-clamp-1 text-sm font-medium text-[var(--ink)]">{item.name}</h3>
          <p className="text-xs text-[var(--muted)]">{formatAddedAt(item.addedAt)}</p>
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleMove}
          disabled={moving || removing}
          className="flex-1"
        >
          {moving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Adding
            </>
          ) : (
            <>
              <ShoppingBag className="size-3.5" strokeWidth={1.5} /> Move to cart
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={moving || removing}
          aria-label={`Remove ${item.name} from wishlist`}
        >
          {removing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" strokeWidth={1.5} />
          )}
        </Button>
      </div>
    </article>
  );
}
