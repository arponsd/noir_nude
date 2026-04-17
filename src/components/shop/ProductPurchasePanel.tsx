"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addToCartAction } from "@/lib/actions/cart";
import VariantSelector, { type VariantOption } from "./VariantSelector";
import type { ProductVariantFull } from "@/types/api/products";

export interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  productSlug: string;
  basePrice: number;
  variants: ProductVariantFull[];
  isAuthenticated: boolean;
}

const LOW_STOCK_THRESHOLD = 5;

function toVariantOptions(variants: ProductVariantFull[]): VariantOption[] {
  return variants
    .filter((v) => v.isActive)
    .map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      stock: Math.max(0, v.stock - v.reservedStock),
    }));
}

export default function ProductPurchasePanel({
  productId,
  productName,
  productSlug,
  basePrice,
  variants,
  isAuthenticated,
}: ProductPurchasePanelProps) {
  const { toast } = useToast();
  const options = React.useMemo(() => toVariantOptions(variants), [variants]);
  const firstInStock = options.find((v) => v.stock > 0) ?? options[0];
  const [selectedId, setSelectedId] = React.useState<string | null>(
    firstInStock ? firstInStock.id : null,
  );
  const [quantity, setQuantity] = React.useState(1);
  const [pending, startTransition] = React.useTransition();

  const selected = options.find((v) => v.id === selectedId) ?? null;
  const maxQty = selected ? Math.min(selected.stock, 10) : 1;
  const outOfStock = !selected || selected.stock <= 0;

  const signInHref = `/login?next=${encodeURIComponent(`/products/${productSlug}`)}`;

  const handleAdd = () => {
    if (outOfStock || !selected) return;
    if (!isAuthenticated) {
      toast({
        title: "Sign in to add to cart",
        description: "Your cart is saved to your account.",
        action: (
          <Link
            href={signInHref}
            className="inline-flex h-8 items-center rounded-full bg-[var(--accent)] px-3 text-xs font-medium text-white hover:bg-[var(--accent)]/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Sign in
          </Link>
        ),
      });
      return;
    }
    startTransition(async () => {
      const res = await addToCartAction({
        productId,
        variantId: selected.id,
        quantity,
      });
      if (res.ok) {
        toast({
          title: "Added to cart",
          description: `${productName} · ${selected.name} × ${quantity}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Could not add to cart",
          description: res.error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleNotify = () => {
    toast({
      title: "We'll let you know",
      description: "You'll get an email when this variant is back in stock.",
    });
  };

  React.useEffect(() => {
    if (quantity > maxQty) setQuantity(Math.max(1, maxQty));
  }, [maxQty, quantity]);

  if (options.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--ink-soft)]">
        No variants available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VariantSelector
        variants={options}
        selectedId={selectedId ?? ""}
        onSelect={setSelectedId}
        basePrice={basePrice}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1"
          role="group"
          aria-label="Quantity"
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || outOfStock}
            aria-label="Decrease quantity"
            className="inline-flex size-8 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            <Minus className="size-3.5" strokeWidth={1.5} aria-hidden />
          </button>
          <span
            className="min-w-8 text-center text-sm font-medium text-[var(--ink)] tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty || outOfStock}
            aria-label="Increase quantity"
            className="inline-flex size-8 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            <Plus className="size-3.5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {outOfStock ? (
          <Button variant="secondary" size="lg" onClick={handleNotify}>
            Notify me when available
          </Button>
        ) : (
          <Button size="lg" onClick={handleAdd} disabled={pending} aria-live="polite">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Adding
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />
                Add to cart
              </>
            )}
          </Button>
        )}
      </div>

      {selected && !outOfStock && selected.stock < LOW_STOCK_THRESHOLD ? (
        <p className="text-xs font-medium text-[var(--warn)]">
          Only {selected.stock} left in stock — order soon.
        </p>
      ) : null}
    </div>
  );
}
