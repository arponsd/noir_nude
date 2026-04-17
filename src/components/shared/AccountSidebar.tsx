"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, MapPin, Package, Star, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { signOutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/account", label: "Profile", icon: User, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package, exact: false },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, exact: false },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, exact: false },
  { href: "/account/reviews", label: "Reviews", icon: Star, exact: false },
] as const;

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none",
              active
                ? "bg-[var(--bg-alt)] text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--bg-alt)] hover:text-[var(--ink)]",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <form action={signOutAction} className="mt-2 border-t border-[var(--line)] pt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-alt)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          Sign out
        </button>
      </form>
    </nav>
  );
}
