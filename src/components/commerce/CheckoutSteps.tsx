import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type CheckoutStep = "address" | "review" | "placed";

export interface CheckoutStepsProps {
  current: CheckoutStep;
  className?: string;
}

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "address", label: "Address" },
  { id: "review", label: "Review" },
  { id: "placed", label: "Placed" },
];

const ORDER: Record<CheckoutStep, number> = { address: 0, review: 1, placed: 2 };

export default function CheckoutSteps({ current, className }: CheckoutStepsProps) {
  const currentIdx = ORDER[current];

  return (
    <ol className={cn("flex w-full items-center gap-0", className)} aria-label="Checkout progress">
      {STEPS.map((step, idx) => {
        const state = idx < currentIdx ? "done" : idx === currentIdx ? "active" : "upcoming";
        const isLast = idx === STEPS.length - 1;
        return (
          <li
            key={step.id}
            className="flex flex-1 items-center last:flex-none"
            aria-current={state === "active" ? "step" : undefined}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors duration-200 motion-reduce:transition-none",
                  state === "done" && "border-[var(--accent)] bg-[var(--accent)] text-white",
                  state === "active" &&
                    "border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)]",
                  state === "upcoming" &&
                    "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
                )}
              >
                {state === "done" ? <Check className="size-3.5" strokeWidth={2} /> : idx + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium tracking-[0.02em] whitespace-nowrap",
                  state === "upcoming" ? "text-[var(--muted)]" : "text-[var(--ink)]",
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "mx-4 h-px flex-1 transition-colors duration-200 motion-reduce:transition-none",
                  idx < currentIdx ? "bg-[var(--accent)]" : "bg-[var(--line)]",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
