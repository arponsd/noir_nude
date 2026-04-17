"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useToast } from "@/hooks/use-toast";
import { submitReviewAction } from "@/lib/actions/review";

export default function WriteReviewDialog({
  productId,
  orderId,
}: {
  productId: string;
  orderId: string;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
          Write a review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>
            Share how this product worked for you. Your review goes live after moderation.
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          onSubmit={async (values) => {
            const result = await submitReviewAction({
              productId,
              orderId,
              rating: values.rating,
              title: values.title,
              body: values.body,
              images: values.images?.map((img) => img.url) ?? [],
              skinTypeAtReview: values.skinTypeAtReview,
            });
            if (!result.ok) throw new Error(result.error.message);
            toast({
              title: "Review submitted",
              description: "We'll publish it after a quick moderation pass.",
            });
            setOpen(false);
            router.refresh();
          }}
        />
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
