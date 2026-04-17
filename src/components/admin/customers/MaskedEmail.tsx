"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface MaskedEmailProps {
  email: string;
  className?: string;
}

function mask(email: string): string {
  const at = email.indexOf("@");
  if (at <= 1) return "•••";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.max(1, Math.min(2, local.length - 1)));
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}${domain}`;
}

/**
 * Shows a masked email by default; reveals the full address on hover/focus.
 * Keyboard-focusable so admins using tab-nav can reveal without a pointer.
 */
export default function MaskedEmail({ email, className }: MaskedEmailProps) {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <span
      tabIndex={0}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
      className={cn(
        "cursor-help rounded focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none",
        className,
      )}
      aria-label={revealed ? email : `Hidden email for privacy — focus or hover to reveal`}
      title={revealed ? email : "Hover to reveal"}
    >
      {revealed ? email : mask(email)}
    </span>
  );
}
