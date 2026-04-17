import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutSteps, { type CheckoutStep } from "@/components/commerce/CheckoutSteps";
import { auth } from "@/lib/auth";
import { getCartForUser } from "@/lib/services/cart";
import { listAddresses } from "@/lib/services/address";
import CheckoutAddressStep from "./_address-step";
import CheckoutReviewStep from "./_review-step";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Checkout" };
}

interface SearchParamsShape {
  step?: string;
  addressId?: string;
}

function stepFromParam(raw: string | undefined): CheckoutStep {
  return raw === "review" ? "review" : "address";
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/checkout");
  }

  const [cart, addresses] = await Promise.all([
    getCartForUser(session.user.id),
    listAddresses(session.user.id),
  ]);

  if (cart.items.length === 0) redirect("/cart");

  const current = stepFromParam(sp.step);
  const selectedAddress =
    sp.addressId && addresses.find((a) => a.id === sp.addressId)
      ? addresses.find((a) => a.id === sp.addressId)!
      : (addresses.find((a) => a.isDefault) ?? null);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
      <header className="mb-8 flex flex-col gap-4">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)] md:text-4xl">
          Checkout
        </h1>
        <CheckoutSteps current={current} />
      </header>

      {current === "review" ? (
        <CheckoutReviewStep
          cart={cart}
          selectedAddress={selectedAddress}
          backHref={`/checkout?step=address${selectedAddress ? `&addressId=${selectedAddress.id}` : ""}`}
        />
      ) : (
        <CheckoutAddressStep
          addresses={addresses}
          initialSelectedId={selectedAddress?.id ?? null}
        />
      )}
    </div>
  );
}
