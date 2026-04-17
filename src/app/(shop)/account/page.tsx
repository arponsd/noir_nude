import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, MapPin, Package, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { listUserOrders } from "@/lib/services/order";
import { getWishlist } from "@/lib/services/wishlist";
import { listAddresses } from "@/lib/services/address";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account");

  const userId = session.user.id;
  const [orders, wishlist, addresses] = await Promise.all([
    listUserOrders(userId, { limit: 1 }),
    getWishlist(userId),
    listAddresses(userId),
  ]);

  const name = session.user.name ?? "there";
  const email = session.user.email ?? "";

  const tiles = [
    {
      href: "/account/orders",
      label: "Orders",
      count: orders.total,
      icon: Package,
      description: orders.total === 0 ? "No orders yet" : "View order history",
    },
    {
      href: "/account/wishlist",
      label: "Wishlist",
      count: wishlist.items.length,
      icon: Heart,
      description: wishlist.items.length === 0 ? "Save items for later" : "Saved favourites",
    },
    {
      href: "/account/addresses",
      label: "Addresses",
      count: addresses.length,
      icon: MapPin,
      description: addresses.length === 0 ? "Add a shipping address" : "Manage addresses",
    },
    {
      href: "/account/profile",
      label: "Profile",
      icon: User,
      description: "Update name, email, password",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
          Welcome, {name}
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">{email}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="group flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-md)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
              >
                <span
                  aria-hidden
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--ink)]"
                >
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-lg text-[var(--ink)]">{tile.label}</h2>
                    {"count" in tile && typeof tile.count === "number" ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)] tabular-nums">
                        {tile.count}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[var(--ink-soft)]">{tile.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
