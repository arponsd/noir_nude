"use client";

import * as React from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface HelpfulVoteProps {
  count: number;
  voted: boolean;
  onToggle: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function HelpfulVote({ count, voted, onToggle, disabled, className }: HelpfulVoteProps) {
  const [pending, setPending] = React.useState(false);

  const handleClick = async () => {
    if (disabled || pending) return;
    setPending(true);
    try {
      await onToggle();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={voted}
      disabled={disabled || pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] transition-colors duration-200",
        "hover:bg-[var(--bg-alt)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-60",
        voted && "border-[var(--accent)] text-[var(--accent)]",
        "motion-reduce:transition-none",
        className,
      )}
    >
      <ThumbsUp
        className={cn("size-3.5", voted && "fill-[var(--accent)]")}
        strokeWidth={1.5}
        aria-hidden
      />
      <span>
        Helpful
        <span className="ml-1 tabular-nums">({count})</span>
      </span>
    </button>
  );
}

export default HelpfulVote;
