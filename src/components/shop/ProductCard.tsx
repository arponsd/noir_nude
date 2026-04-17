"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import PriceBlock from "./PriceBlock";
import VariantSwatches, { type VariantSwatch } from "./VariantSwatches";

// TODO replace with import when backend types land: `import type { ProductCard as ProductCardDTO } from "@/types/api/products";`
export interface ProductCardDTO {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  image: { url: string; alt: string };
  basePrice: number;
  comparePrice?: number | null;
  variants?: VariantSwatch[];
  wishlisted?: boolean;
}

export interface ProductCardProps {
  product: ProductCardDTO;
  priority?: boolean;
  onToggleWishlist?: (id: string, next: boolean) => void;
  className?: string;
}

export default function ProductCard({
  product,
  priority,
  onToggleWishlist,
  className,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = React.useState(Boolean(product.wishlisted));

  const handleHeart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !wishlisted;
    setWishlisted(next);
    onToggleWishlist?.(product.id, next);
  };

  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="block rounded-[var(--radius-md)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`${product.name}${product.brand ? ` by ${product.brand}` : ""}`}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-alt)]">
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 50vw"
            priority={priority}
            className="object-cover transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>

        <div className="mt-3 space-y-1.5">
          {product.brand ? (
            <p className="text-xs font-medium tracking-[0.08em] text-[var(--muted)] uppercase">
              {product.brand}
            </p>
          ) : null}
          <h3 className="line-clamp-1 text-sm font-medium text-[var(--ink)]">{product.name}</h3>
          <PriceBlock
            basePrice={product.basePrice}
            comparePrice={product.comparePrice ?? null}
            size="sm"
          />
          {product.variants && product.variants.length > 0 ? (
            <div className="pt-1">
              <VariantSwatches variants={product.variants} max={5} size={18} />
            </div>
          ) : null}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleHeart}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
        className={cn(
          "absolute top-2 right-2 inline-flex size-9 items-center justify-center rounded-full bg-[var(--surface)]/90 text-[var(--ink)] shadow-[var(--shadow-sm)] backdrop-blur transition-colors duration-200",
          "hover:bg-[var(--surface)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
        )}
      >
        <Heart
          className={cn(
            "size-4 transition-colors",
            wishlisted ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--ink)]",
          )}
          strokeWidth={1.5}
        />
      </button>
    </article>
  );
}
