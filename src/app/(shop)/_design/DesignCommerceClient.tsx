"use client";

import * as React from "react";
import type { Cart, CartItem } from "@/types/api/cart";
import type { Address } from "@/types/api/address";
import type { OrderStatusHistoryEntry, OrderSummary } from "@/types/api/order";
import type { WishlistItem } from "@/types/api/wishlist";
import AddressCard from "@/components/commerce/AddressCard";
import AddressForm from "@/components/commerce/AddressForm";
import CartLineItem from "@/components/commerce/CartLineItem";
import CartSummary from "@/components/commerce/CartSummary";
import CheckoutSteps, { type CheckoutStep } from "@/components/commerce/CheckoutSteps";
import CouponInput from "@/components/commerce/CouponInput";
import EmptyCart from "@/components/commerce/EmptyCart";
import OrderCard from "@/components/commerce/OrderCard";
import OrderTimeline from "@/components/commerce/OrderTimeline";
import PriceChangeBanner from "@/components/commerce/PriceChangeBanner";
import ReorderButton from "@/components/commerce/ReorderButton";
import StatusPill from "@/components/commerce/StatusPill";
import WishlistCard from "@/components/commerce/WishlistCard";
import type { OrderStatus } from "@/lib/constants";

const SAMPLE_ITEM: CartItem = {
  itemId: "ci-1",
  productId: "p-1",
  variantId: "v-1",
  name: "Hydrating hyaluronic serum",
  image:
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=80",
  brand: "Glow Lab",
  slug: "hydrating-serum",
  variantName: "30ml",
  sku: "HS-030",
  quantity: 2,
  priceSnapshot: 149900,
  currentPrice: 159900,
  priceChanged: true,
  lineSubtotal: 319800,
};

const SAMPLE_ITEM_2: CartItem = {
  itemId: "ci-2",
  productId: "p-2",
  variantId: "v-2",
  name: "Velvet matte lipstick",
  image:
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80",
  brand: "Rouge Atelier",
  slug: "matte-lipstick",
  variantName: "Rose 03",
  sku: "LS-R03",
  quantity: 1,
  priceSnapshot: 89900,
  currentPrice: 89900,
  priceChanged: false,
  lineSubtotal: 89900,
};

const SAMPLE_CART: Cart = {
  items: [SAMPLE_ITEM, SAMPLE_ITEM_2],
  couponCode: "GLOW10",
  subtotal: 409700,
  discount: 40970,
  shippingFee: 0,
  total: 368730,
  freeShippingEligible: true,
  freeShippingThreshold: 300000,
  freeShippingRemaining: 0,
};

const SAMPLE_CART_BELOW: Cart = {
  ...SAMPLE_CART,
  items: [SAMPLE_ITEM_2],
  couponCode: undefined,
  subtotal: 89900,
  discount: 0,
  shippingFee: 6000,
  total: 95900,
  freeShippingEligible: false,
  freeShippingRemaining: 210100,
};

const SAMPLE_ADDRESS: Address = {
  id: "a-1",
  label: "home",
  recipientName: "Ayesha Rahman",
  phone: "+8801712345678",
  addressLine1: "House 42, Road 7",
  addressLine2: "Dhanmondi",
  city: "Dhaka",
  district: "Dhaka",
  postalCode: "1205",
  country: "BD",
  isDefault: true,
  createdAt: new Date().toISOString(),
};

const SAMPLE_ADDRESS_2: Address = {
  ...SAMPLE_ADDRESS,
  id: "a-2",
  label: "office",
  recipientName: "Ayesha @ Work",
  addressLine1: "Level 6, Gulshan Tower",
  addressLine2: "Plot 1, Gulshan Ave",
  city: "Dhaka",
  isDefault: false,
};

const SAMPLE_ORDER: OrderSummary = {
  id: "o-1",
  orderNumber: "GC-240417-0042",
  placedAt: new Date().toISOString(),
  orderStatus: "shipped",
  paymentStatus: "pending",
  total: 368730,
  itemCount: 3,
};

const SAMPLE_HISTORY: OrderStatusHistoryEntry[] = [
  { status: "placed", changedAt: "2026-04-12T09:20:00Z" },
  { status: "confirmed", changedAt: "2026-04-12T10:05:00Z", note: "Payment confirmed" },
  { status: "packed", changedAt: "2026-04-13T14:10:00Z" },
  { status: "shipped", changedAt: "2026-04-14T08:30:00Z", note: "Courier: Pathao" },
];

const SAMPLE_WISHLIST_ITEM: WishlistItem = {
  productId: "p-3",
  slug: "silk-cream-blush",
  name: "Silk cream blush",
  brand: "Petal & Co",
  thumbUrl:
    "https://images.unsplash.com/photo-1522335789203-aaa741b58c4d?auto=format&fit=crop&w=400&q=80",
  addedAt: "2026-04-14T12:00:00Z",
};

const ALL_STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export default function DesignCommerceClient() {
  const [items, setItems] = React.useState<CartItem[]>(SAMPLE_CART.items);
  const [couponCode, setCouponCode] = React.useState<string | undefined>(SAMPLE_CART.couponCode);
  const [checkoutStep, setCheckoutStep] = React.useState<CheckoutStep>("address");

  const handleQtyChange = (itemId: string, qty: number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.itemId === itemId ? { ...it, quantity: qty, lineSubtotal: qty * it.currentPrice } : it,
      ),
    );
  const handleRemove = (itemId: string) =>
    setItems((prev) => prev.filter((it) => it.itemId !== itemId));

  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Checkout steps
        </p>
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["address", "review", "placed"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCheckoutStep(s)}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs capitalize hover:bg-[var(--bg-alt)]"
              >
                {s}
              </button>
            ))}
          </div>
          <CheckoutSteps current={checkoutStep} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Status pills
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <StatusPill key={s} status={s} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Price change banner
        </p>
        <div className="mt-3">
          <PriceChangeBanner />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Cart line items (page variant) + summary
        </p>
        <div className="mt-3 grid gap-6 md:grid-cols-[1fr_320px]">
          <div
            id="cart-items"
            className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-5"
          >
            {items.map((it) => (
              <CartLineItem
                key={it.itemId}
                item={it}
                onQtyChange={handleQtyChange}
                onRemove={handleRemove}
              />
            ))}
            {items.length === 0 ? (
              <div className="py-4">
                <EmptyCart />
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-4">
            <CouponInput
              currentCode={couponCode}
              currentDiscount={couponCode ? SAMPLE_CART.discount : undefined}
              onApply={async (code) => {
                await new Promise((r) => setTimeout(r, 400));
                if (code === "BAD") throw new Error("That code is not valid.");
                setCouponCode(code);
              }}
              onRemove={async () => {
                await new Promise((r) => setTimeout(r, 200));
                setCouponCode(undefined);
              }}
            />
            <CartSummary cart={{ ...SAMPLE_CART, couponCode, items }} />
            <CartSummary cart={SAMPLE_CART_BELOW} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Empty cart
        </p>
        <div className="mt-3">
          <EmptyCart />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Address cards
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <AddressCard
            address={SAMPLE_ADDRESS}
            onEdit={() => void 0}
            onDelete={() => void 0}
            onSetDefault={() => void 0}
          />
          <AddressCard
            address={SAMPLE_ADDRESS_2}
            onEdit={() => void 0}
            onDelete={() => void 0}
            onSetDefault={() => void 0}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Address form
        </p>
        <div className="mt-3 max-w-2xl">
          <AddressForm
            onSubmit={async (values) => {
              await new Promise((r) => setTimeout(r, 400));
              void values;
            }}
            defaultValues={{
              label: "home",
              recipientName: "Ayesha Rahman",
              phone: "+8801712345678",
              addressLine1: "House 42, Road 7",
              city: "Dhaka",
              district: "Dhaka",
              postalCode: "1205",
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Order card + reorder button
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <OrderCard order={SAMPLE_ORDER} />
          <OrderCard
            order={{
              ...SAMPLE_ORDER,
              id: "o-2",
              orderNumber: "GC-240410-0031",
              orderStatus: "delivered",
            }}
          />
          <div>
            <ReorderButton
              onReorder={async () => {
                await new Promise((r) => setTimeout(r, 500));
                return { skipped: ["Rose toner"] };
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Order timeline
        </p>
        <div className="mt-3 max-w-md rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
          <OrderTimeline history={SAMPLE_HISTORY} currentStatus="shipped" />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Wishlist card
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <WishlistCard
            item={SAMPLE_WISHLIST_ITEM}
            onMoveToCart={async () => {
              await new Promise((r) => setTimeout(r, 300));
            }}
            onRemove={async () => {
              await new Promise((r) => setTimeout(r, 200));
            }}
          />
        </div>
      </div>
    </div>
  );
}
