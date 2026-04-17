"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Ribbon,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { signOutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { href: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { href: "/admin/coupons", label: "Coupons", icon: Ribbon, exact: false },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, exact: false },
  { href: "/admin/activity", label: "Activity", icon: Activity, exact: false },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 py-4">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "mx-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
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
      <form action={signOutAction} className="mt-auto border-t border-[var(--line)] pt-2">
        <button
          type="submit"
          className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-alt)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          Sign out
        </button>
      </form>
    </nav>
  );
}
