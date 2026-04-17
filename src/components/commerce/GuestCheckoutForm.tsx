"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import AddressForm from "@/components/commerce/AddressForm";
import EmptyCart from "@/components/commerce/EmptyCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { placeGuestOrderAction } from "@/lib/actions/order";
import { formatBDT } from "@/lib/constants";
import {
  clearGuestCart,
  getGuestCart,
  guestCartSubtotal,
  removeGuestCartItem,
  type GuestCartItem,
} from "@/lib/client/guest-cart";
import type { AddressInput } from "@/types/api/address";
import type { AddressLabel } from "@/lib/validators/commerce";

const contactSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: "Phone must be in E.164 format (e.g. +8801XXXXXXXXX)",
    }),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function GuestCheckoutForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<GuestCartItem[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [address, setAddress] = React.useState<AddressInput | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setItems(getGuestCart());
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { email: "", phone: "" },
  });

  const handleRemoveItem = (productId: string, variantId: string) => {
    setItems(removeGuestCartItem(productId, variantId));
  };

  const handleAddressSubmit = async (values: AddressInput) => {
    setAddress(values);
  };

  const handlePlace = async (contact: ContactValues) => {
    if (!address) {
      toast({ title: "Enter a shipping address first", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }
    setPending(true);
    try {
      const payload = {
        guestEmail: contact.email,
        phone: contact.phone,
        shippingAddress: {
          ...address,
          label: (address.label as AddressLabel) ?? "home",
        },
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      };
      const res = await placeGuestOrderAction(payload);
      if (res.ok) {
        clearGuestCart();
        const target = `/checkout/confirmation/${res.data.orderId}?guest=1&email=${encodeURIComponent(contact.email)}`;
        router.push(target);
      } else {
        toast({
          title: "Could not place order",
          description: res.error.message,
          variant: "destructive",
        });
      }
    } finally {
      setPending(false);
    }
  };

  if (!mounted) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)]">
        <Loader2 className="size-3.5 animate-spin" /> Loading cart…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyCart
        title="Nothing to check out"
        description="Your guest cart is empty. Browse products and add a few to get started."
      />
    );
  }

  const subtotal = guestCartSubtotal(items);

  return (
    <form
      onSubmit={handleSubmit(handlePlace)}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_360px]"
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="font-display mb-4 text-lg text-[var(--ink)]">Contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input
                id="guest-email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? true : undefined}
                {...register("email")}
              />
              {errors.email ? (
                <p role="alert" className="text-xs text-[var(--danger)]">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="guest-phone">Phone</Label>
              <Input
                id="guest-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+8801XXXXXXXXX"
                aria-invalid={errors.phone ? true : undefined}
                {...register("phone")}
              />
              {errors.phone ? (
                <p role="alert" className="text-xs text-[var(--danger)]">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="font-display mb-4 text-lg text-[var(--ink)]">Shipping address</h2>
          {address ? (
            <div className="flex items-start justify-between gap-4">
              <address className="text-sm text-[var(--ink)] not-italic">
                <p className="font-medium">{address.recipientName}</p>
                <p className="text-[var(--ink-soft)] tabular-nums">{address.phone}</p>
                <p className="mt-1 text-[var(--ink-soft)]">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : null}
                </p>
                <p className="text-[var(--ink-soft)]">
                  {address.city}, {address.district}{" "}
                  <span className="tabular-nums">{address.postalCode}</span>, {address.country}
                </p>
              </address>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddress(null)}>
                Edit
              </Button>
            </div>
          ) : (
            <AddressForm
              defaultValues={{ phone: getValues("phone") }}
              onSubmit={handleAddressSubmit}
              submitLabel="Save address"
            />
          )}
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
          <header className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-display text-lg text-[var(--ink)]">Your items</h2>
          </header>
          <ul>
            {items.map((item) => (
              <li
                key={`${item.productId}:${item.variantId}`}
                className="flex items-start gap-4 border-b border-[var(--line)] px-5 py-4 last:border-b-0"
              >
                <div className="relative h-[80px] w-[64px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-alt)]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={80}
                      className="h-full w-full object-cover"
                      sizes="64px"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {item.brand ? (
                    <p className="text-xs font-medium tracking-[0.08em] text-[var(--muted)] uppercase">
                      {item.brand}
                    </p>
                  ) : null}
                  <p className="line-clamp-2 text-sm font-medium text-[var(--ink)]">{item.name}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {item.variantName} · Qty {item.quantity}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm text-[var(--ink)] tabular-nums">
                    {formatBDT(item.priceSnapshot * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.productId, item.variantId)}
                    className="text-xs text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--danger)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="font-display mb-2 text-lg text-[var(--ink)]">Payment</h2>
          <p className="text-sm text-[var(--ink-soft)]">
            Cash on delivery (COD) — pay when your order arrives.
          </p>
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h3 className="font-display mb-3 text-lg text-[var(--ink)]">Order summary</h3>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--ink-soft)]">Subtotal (est.)</dt>
              <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Final totals (coupon, shipping, discounts) are calculated after submission.
            </p>
          </dl>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={pending || !address}
          className="w-full"
          aria-live="polite"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Placing order…
            </>
          ) : (
            "Place order (COD)"
          )}
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </aside>
    </form>
  );
}
