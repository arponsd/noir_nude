"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { moderateReviewAction } from "@/lib/actions/review";

export default function AdminReviewModeration({ reviewId }: { reviewId: string }) {
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function decide(isApproved: boolean) {
    startTransition(async () => {
      const result = await moderateReviewAction({
        reviewId,
        isApproved,
        adminReply: reply.trim() || undefined,
      });
      if (!result.ok) {
        toast({
          title: "Moderation failed",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: isApproved ? "Review approved" : "Review rejected" });
      router.push("/admin/reviews");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-reply">Admin reply (optional)</Label>
        <textarea
          id="admin-reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Thanks for the detailed review..."
          className="w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-3 py-2 text-sm focus-visible:border-[var(--accent)] focus-visible:outline-none"
        />
        <span className="text-xs text-[var(--ink-soft)]">{reply.length}/2000</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => decide(true)} disabled={pending}>
          {pending ? "Saving…" : "Approve"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => decide(false)} disabled={pending}>
          Reject
        </Button>
      </div>
    </form>
  );
}
