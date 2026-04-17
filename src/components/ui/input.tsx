import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full border-0 border-b border-[var(--line)] bg-transparent px-0 py-2 text-sm text-[var(--ink)] transition-colors duration-200",
          "placeholder:font-light placeholder:text-[var(--muted)]",
          "focus-visible:border-b-2 focus-visible:border-[var(--accent)] focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
