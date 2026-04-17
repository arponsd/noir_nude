"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export default function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const confirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = (await res.json()) as
        | { ok: true; data: unknown }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        toast({
          title: "Delete failed",
          description: json.error.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Product deleted", description: productName });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Network error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Delete ${productName}`}>
          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete product?</DialogTitle>
          <DialogDescription>
            This will soft-delete <strong>{productName}</strong>. Orders referencing this product
            keep their snapshot.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
            ) : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
