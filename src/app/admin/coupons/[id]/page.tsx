import Link from "next/link";
import { notFound } from "next/navigation";
import CouponForm from "@/components/admin/coupons/CouponForm";
import DeactivateCouponButton from "@/components/admin/coupons/DeactivateCouponButton";
import { Button } from "@/components/ui/button";
import { NotFoundError } from "@/lib/api/response";
import { getCouponService } from "@/lib/services/admin-coupon";

export const metadata = { title: "Edit coupon — Admin" };
export const dynamic = "force-dynamic";

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default async function AdminEditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let coupon;
  try {
    coupon = await getCouponService(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  // Map the backend coupon DTO {percentage,fixed,free_shipping} to the form's
  // {percent,flat,free_shipping} vocabulary.
  const formType: "percent" | "flat" | "free_shipping" =
    coupon.type === "percentage" ? "percent" : coupon.type === "fixed" ? "flat" : "free_shipping";

  const initial = {
    code: coupon.code,
    type: formType,
    value: coupon.value,
    minOrderAmount: (coupon.minOrderAmount ?? "") as number | "",
    maxDiscount: (coupon.maxDiscount ?? "") as number | "",
    usageLimit: (coupon.usageLimit ?? "") as number | "",
    perUserLimit: (coupon.perUserLimit ?? "") as number | "",
    validFrom: toDatetimeLocal(coupon.validFrom),
    validUntil: toDatetimeLocal(coupon.validUntil),
    applicableCategories: coupon.applicableCategories,
    applicableProducts: coupon.applicableProducts,
    isActive: coupon.isActive,
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
            Edit coupon <span className="font-mono tabular-nums">{coupon.code}</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)] tabular-nums">
            Used {coupon.usedCount}
            {coupon.usageLimit !== undefined ? ` / ${coupon.usageLimit}` : ""} times
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeactivateCouponButton couponId={coupon.id} code={coupon.code} />
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/coupons">← Back to list</Link>
          </Button>
        </div>
      </header>

      <CouponForm mode="edit" couponId={coupon.id} initial={initial} />
    </div>
  );
}
