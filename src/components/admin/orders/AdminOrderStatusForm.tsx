"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
// TODO(backend): reconcile with `@/lib/actions/admin-order` once implemented.
// import { adminUpdateOrderStatusAction } from "@/lib/actions/admin-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ORDER_TRANSITIONS, type OrderStatus } from "@/lib/constants";

// TODO(backend): import real action signature from `@/lib/actions/admin-order`.
type AdminUpdateOrderStatusInput = {
  orderId: string;
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
  courier?: string;
};
type AdminUpdateOrderStatusResult =
  | { ok: true; data: { id: string; orderStatus: OrderStatus } }
  | { ok: false; error: { code: string; message: string } };

// Local placeholder — orchestrator reconciles once backend lane lands the action.
async function adminUpdateOrderStatusAction(
  input: AdminUpdateOrderStatusInput,
): Promise<AdminUpdateOrderStatusResult> {
  const res = await fetch(`/api/admin/orders/${input.orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: input.status,
      ...(input.note ? { note: input.note } : {}),
      ...(input.trackingNumber ? { trackingNumber: input.trackingNumber } : {}),
      ...(input.courier ? { courier: input.courier } : {}),
    }),
    credentials: "same-origin",
  });
  return (await res.json()) as AdminUpdateOrderStatusResult;
}

export interface AdminOrderStatusFormProps {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  /** Disables the form — e.g. while a parent is reloading. */
  disabled?: boolean;
}

/**
 * Client form to advance an order status. Filters target statuses to only those
 * reachable from `currentStatus` per ORDER_TRANSITIONS. Emits aria-live messages
 * for success/failure and refreshes the route on success.
 */
export default function AdminOrderStatusForm({
  orderId,
  orderNumber,
  currentStatus,
  disabled,
}: AdminOrderStatusFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const valid = ORDER_TRANSITIONS[currentStatus];

  const [status, setStatus] = React.useState<OrderStatus | "">("");
  const [note, setNote] = React.useState("");
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [courier, setCourier] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (valid.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--bg-alt)]/40 p-4 text-sm text-[var(--ink-soft)]">
        Order is in a terminal state ({currentStatus}). No further transitions available.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!status) return;
    setSubmitting(true);
    try {
      const result = await adminUpdateOrderStatusAction({
        orderId,
        status,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(trackingNumber.trim() ? { trackingNumber: trackingNumber.trim() } : {}),
        ...(courier.trim() ? { courier: courier.trim() } : {}),
      });
      if (!result.ok) {
        toast({
          title: "Update failed",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: `Order #${orderNumber} updated`,
        description: `Status is now ${result.data.orderStatus}.`,
      });
      setStatus("");
      setNote("");
      setTrackingNumber("");
      setCourier("");
      router.refresh();
    } catch (err) {
      toast({
        title: "Network error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const showShipping = status === "shipped";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5"
      aria-busy={submitting}
      aria-live="polite"
    >
      <div>
        <Label htmlFor="admin-order-status">Next status</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as OrderStatus)}
          disabled={disabled || submitting}
        >
          <SelectTrigger id="admin-order-status">
            <SelectValue placeholder="Select next status" />
          </SelectTrigger>
          <SelectContent>
            {valid.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showShipping ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="admin-order-tracking">Tracking number</Label>
            <Input
              id="admin-order-tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              disabled={disabled || submitting}
            />
          </div>
          <div>
            <Label htmlFor="admin-order-courier">Courier</Label>
            <Input
              id="admin-order-courier"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              disabled={disabled || submitting}
              placeholder="Pathao / RedX / Sundarban…"
            />
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="admin-order-note">Note (optional)</Label>
        <textarea
          id="admin-order-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={disabled || submitting}
          className="mt-2 flex min-h-16 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-none disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!status || submitting || disabled}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
          ) : null}
          Update status
        </Button>
      </div>
    </form>
  );
}
