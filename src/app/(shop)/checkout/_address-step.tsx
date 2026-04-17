"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AddressForm from "@/components/commerce/AddressForm";
import AddressCard from "@/components/commerce/AddressCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createAddressAction } from "@/lib/actions/address";
import type { Address, AddressInput } from "@/types/api/address";
import type { AddressLabel } from "@/lib/validators/commerce";

export interface CheckoutAddressStepProps {
  addresses: Address[];
  initialSelectedId: string | null;
}

export default function CheckoutAddressStep({
  addresses,
  initialSelectedId,
}: CheckoutAddressStepProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = React.useState<string | null>(initialSelectedId);
  const [adding, setAdding] = React.useState(addresses.length === 0);
  const [pending, startTransition] = React.useTransition();

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/checkout?step=review&addressId=${selected}`);
  };

  const handleSubmitNew = async (values: AddressInput) => {
    const payload = { ...values, label: (values.label as AddressLabel) ?? "home" };
    await new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await createAddressAction(payload);
        if (res.ok) {
          setSelected(res.data.id);
          setAdding(false);
          toast({
            title: "Address saved",
            description: "You can pick it again on future orders.",
            variant: "success",
          });
          router.refresh();
        } else {
          toast({
            title: "Could not save address",
            description: res.error.message,
            variant: "destructive",
          });
        }
        resolve();
      });
    });
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        {addresses.length > 0 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
              Choose a shipping address
            </legend>
            <ul className="flex flex-col gap-3">
              {addresses.map((address) => (
                <li key={address.id}>
                  <label
                    className={`group flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-1 transition-colors ${
                      selected === address.id
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                        : "border-transparent"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping-address"
                      value={address.id}
                      checked={selected === address.id}
                      onChange={() => setSelected(address.id)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <AddressCard address={address} />
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--ink-soft)]">
            You don&apos;t have any saved addresses yet. Add one below to continue.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
          >
            {adding ? "Cancel new address" : "+ Add new address"}
          </Button>
          <Button asChild variant="link" size="sm">
            <Link href="/account/addresses">Manage addresses</Link>
          </Button>
        </div>

        {adding ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <h3 className="font-display mb-4 text-lg text-[var(--ink)]">New address</h3>
            <AddressForm onSubmit={handleSubmitNew} submitLabel="Save and continue" />
          </div>
        ) : null}
      </div>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Next step
        </p>
        <p className="text-sm text-[var(--ink-soft)]">
          After choosing an address, you&apos;ll review your order and place it with cash on
          delivery.
        </p>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={!selected || pending}
          className="w-full"
          size="lg"
        >
          Continue to review
        </Button>
      </aside>
    </section>
  );
}
