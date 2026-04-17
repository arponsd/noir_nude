"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ChipInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function ChipInput({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
  className,
}: ChipInputProps) {
  const [draft, setDraft] = React.useState("");

  const push = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      push(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5",
        "focus-within:border-[var(--accent)]",
        className,
      )}
    >
      {value.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-alt)] px-2.5 py-0.5 text-xs text-[var(--ink)]"
        >
          {v}
          <button
            type="button"
            onClick={() => remove(v)}
            aria-label={`Remove ${v}`}
            className="inline-flex size-4 items-center justify-center rounded-full text-[var(--ink-soft)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
          >
            <X className="size-3" strokeWidth={1.5} aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim().length > 0) {
            push(draft);
            setDraft("");
          }
        }}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
      />
    </div>
  );
}
