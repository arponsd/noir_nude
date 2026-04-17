"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import WishlistCard from "@/components/commerce/WishlistCard";
import { useToast } from "@/hooks/use-toast";
import { addToCartAction } from "@/lib/actions/cart";
import { toggleWishlistAction } from "@/lib/actions/wishlist";
import type { WishlistItem } from "@/types/api/wishlist";

export interface WishlistGridProps {
  initialItems: WishlistItem[];
}

export default function WishlistGrid({ initialItems }: WishlistGridProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<WishlistItem[]>(initialItems);

  const handleMoveToCart = async (item: WishlistItem) => {
    // reason: wishlist entries may omit variantId (product-level save). Redirect to the PDP
    // so the shopper can pick a variant rather than silently defaulting to the first one.
    if (!item.variantId) {
      router.push(`/products/${item.slug}`);
      return;
    }
    const addRes = await addToCartAction({
      productId: item.productId,
      variantId: item.variantId,
      quantity: 1,
    });
    if (!addRes.ok) {
      toast({
        title: "Could not add to cart",
        description: addRes.error.message,
        variant: "destructive",
      });
      return;
    }
    const toggleInput = item.variantId
      ? { productId: item.productId, variantId: item.variantId }
      : { productId: item.productId };
    const toggleRes = await toggleWishlistAction(toggleInput);
    if (toggleRes.ok) {
      setItems((prev) =>
        prev.filter((i) => !(i.productId === item.productId && i.variantId === item.variantId)),
      );
    }
    toast({ title: "Moved to cart", variant: "success" });
  };

  const handleRemove = async (item: WishlistItem) => {
    const toggleInput = item.variantId
      ? { productId: item.productId, variantId: item.variantId }
      : { productId: item.productId };
    const res = await toggleWishlistAction(toggleInput);
    if (res.ok) {
      setItems((prev) =>
        prev.filter((i) => !(i.productId === item.productId && i.variantId === item.variantId)),
      );
      toast({ title: "Removed from wishlist" });
    } else {
      toast({
        title: "Could not remove",
        description: res.error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={`${item.productId}:${item.variantId ?? ""}`}>
          <WishlistCard item={item} onMoveToCart={handleMoveToCart} onRemove={handleRemove} />
        </li>
      ))}
    </ul>
  );
}
