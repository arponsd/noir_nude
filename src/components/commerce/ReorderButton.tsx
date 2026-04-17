"use client";

import * as React from "react";
import { Loader2, RotateCw } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface ReorderResult {
  skipped: string[];
}

export interface ReorderButtonProps extends Omit<ButtonProps, "onClick" | "disabled"> {
  onReorder: () => Promise<ReorderResult>;
  label?: string;
}

export default function ReorderButton({
  onReorder,
  label = "Reorder",
  variant = "secondary",
  size = "sm",
  ...rest
}: ReorderButtonProps) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      const result = await onReorder();
      const skipped = result.skipped.length;
      toast({
        title: "Added to cart",
        description:
          skipped > 0
            ? `${skipped} ${skipped === 1 ? "item" : "items"} unavailable and skipped.`
            : "All items added to your cart.",
        variant: skipped > 0 ? "default" : "success",
      });
    } catch (err) {
      toast({
        title: "Could not reorder",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={pending}
      {...rest}
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Adding
        </>
      ) : (
        <>
          <RotateCw className="size-3.5" strokeWidth={1.5} /> {label}
        </>
      )}
    </Button>
  );
}
