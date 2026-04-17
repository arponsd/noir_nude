"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { adminDeactivateCouponAction } from "@/lib/actions/admin-coupon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface DeactivateCouponButtonProps {
  couponId: string;
  code: string;
}

/**
 * Soft-deactivate confirmation button. Uses a native `confirm()` rather than a
 * dialog primitive to keep the coupon-edit page free of additional client state;
 * activity log + audit trail live server-side.
 */
export default function DeactivateCouponButton({ couponId, code }: DeactivateCouponButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  const onClick = async () => {
    if (!window.confirm(`Deactivate coupon ${code}? This is reversible via edit.`)) return;
    setBusy(true);
    try {
      const result = await adminDeactivateCouponAction({ couponId });
      if (!result.ok) {
        toast({
          title: "Deactivate failed",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Coupon deactivated", description: code });
      router.push("/admin/coupons");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={busy}
      className="text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
      ) : (
        <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
      )}
      Deactivate
    </Button>
  );
}
