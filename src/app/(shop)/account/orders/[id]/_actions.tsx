"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ReorderButton from "@/components/commerce/ReorderButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cancelOrderAction, reorderAction } from "@/lib/actions/order";

export interface OrderDetailActionsProps {
  orderId: string;
  canCancel: boolean;
}

export default function OrderDetailActions({ orderId, canCancel }: OrderDetailActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const handleReorder = async () => {
    const res = await reorderAction({ orderId });
    if (!res.ok) throw new Error(res.error.message);
    router.refresh();
    return { skipped: res.data.skipped };
  };

  const handleCancel = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      toast({
        title: "Please add a reason",
        description: "Reason must be at least 5 characters.",
        variant: "destructive",
      });
      return;
    }
    setPending(true);
    try {
      const res = await cancelOrderAction({ orderId, reason: trimmed });
      if (res.ok) {
        toast({ title: "Order cancelled", variant: "success" });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Could not cancel order",
          description: res.error.message,
          variant: "destructive",
        });
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <ReorderButton onReorder={handleReorder} label="Reorder" size="default" />
      {canCancel ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="default">
              Cancel order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel this order?</DialogTitle>
              <DialogDescription>
                You can only cancel within 2 hours of placing. Let us know why so we can improve.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cancel-reason">Reason</Label>
              <textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={4}
                className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={pending}
              >
                Keep order
              </Button>
              <Button variant="destructive" type="button" onClick={handleCancel} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Cancelling
                  </>
                ) : (
                  "Confirm cancel"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
