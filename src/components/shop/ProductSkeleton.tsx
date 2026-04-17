import { cn } from "@/lib/utils/cn";

export interface ProductSkeletonProps {
  className?: string;
}

export default function ProductSkeleton({ className }: ProductSkeletonProps) {
  return (
    <div className={cn("animate-pulse motion-reduce:animate-none", className)} aria-hidden>
      <div className="aspect-[4/5] w-full rounded-[var(--radius-md)] bg-[var(--bg-alt)]" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-20 rounded-sm bg-[var(--bg-alt)]" />
        <div className="h-4 w-full rounded-sm bg-[var(--bg-alt)]" />
        <div className="h-4 w-24 rounded-sm bg-[var(--bg-alt)]" />
        <div className="flex gap-1.5 pt-1">
          <span className="size-4 rounded-full bg-[var(--bg-alt)]" />
          <span className="size-4 rounded-full bg-[var(--bg-alt)]" />
          <span className="size-4 rounded-full bg-[var(--bg-alt)]" />
        </div>
      </div>
    </div>
  );
}
