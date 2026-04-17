"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Menu, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SearchAutocomplete from "@/components/shop/SearchAutocomplete";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
] as const;

interface HeaderProps {
  cartCount?: number;
}

export default function Header({ cartCount = 0 }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="size-5" strokeWidth={1.5} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-3 text-base text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="font-display text-2xl leading-none tracking-[-0.02em] text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Cosmetic — Home"
        >
          Cosmetic
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden w-64 md:block lg:w-80">
            <SearchAutocomplete />
          </div>
          <Link
            href="/account/wishlist"
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)]",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
            )}
            aria-label="Wishlist"
          >
            <Heart className="size-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/account"
            className={cn(
              "hidden size-10 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)] sm:inline-flex",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
            )}
            aria-label="Account"
          >
            <User className="size-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/cart"
            className={cn(
              "relative inline-flex size-10 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-alt)]",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
            )}
            aria-label={`Cart (${cartCount} items)`}
          >
            <ShoppingBag className="size-5" strokeWidth={1.5} />
            {cartCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] leading-5 font-medium text-white tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
