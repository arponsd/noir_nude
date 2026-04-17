import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAddresses } from "@/lib/services/address";
import AddressesClient from "./_client";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Addresses" };
}

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account/addresses");

  const addresses = await listAddresses(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Addresses</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          {addresses.length === 0
            ? "Add your first shipping address to speed up checkout."
            : `${addresses.length} saved.`}
        </p>
      </header>

      <AddressesClient initialAddresses={addresses} />
    </div>
  );
}
