import Link from "next/link";
import CouponForm from "@/components/admin/coupons/CouponForm";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New coupon — Admin" };
export const dynamic = "force-dynamic";

export default function AdminNewCouponPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">New coupon</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Define a discount code for customers to apply at checkout.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/coupons">← Back to list</Link>
        </Button>
      </header>

      <CouponForm mode="create" />
    </div>
  );
}
