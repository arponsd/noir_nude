import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getWishlist } from "@/lib/services/wishlist";
import WishlistGrid from "./_client";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Wishlist" };
}

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account/wishlist");

  const wishlist = await getWishlist(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Wishlist</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          {wishlist.items.length === 0
            ? "No items saved yet."
            : `${wishlist.items.length} ${wishlist.items.length === 1 ? "item" : "items"} saved.`}
        </p>
      </header>

      {wishlist.items.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center"
        >
          <p className="font-display text-xl text-[var(--ink)]">Your wishlist is empty</p>
          <p className="max-w-sm text-sm text-[var(--ink-soft)]">
            Tap the heart on any product to save it here for later.
          </p>
          <Button asChild size="sm">
            <Link href="/shop">Browse products</Link>
          </Button>
        </div>
      ) : (
        <WishlistGrid initialItems={wishlist.items} />
      )}
    </div>
  );
}
