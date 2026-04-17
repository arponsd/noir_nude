"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { NotificationPreferences } from "./types";

export interface NotificationsFormProps {
  defaultValues?: Partial<NotificationPreferences>;
  onSubmit: (values: NotificationPreferences) => Promise<void> | void;
  className?: string;
}

const TOGGLES: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "orderUpdates",
    label: "Order updates",
    description: "Get emails when your order ships, arrives, or changes status.",
  },
  {
    key: "promos",
    label: "Promotions",
    description: "Occasional sales, coupon codes, and product launches.",
  },
  {
    key: "newsletter",
    label: "Newsletter",
    description: "Monthly editorial on skincare, routines, and product picks.",
  },
];

export function NotificationsForm({ defaultValues, onSubmit, className }: NotificationsFormProps) {
  const [values, setValues] = React.useState<NotificationPreferences>({
    orderUpdates: defaultValues?.orderUpdates ?? true,
    promos: defaultValues?.promos ?? false,
    newsletter: defaultValues?.newsletter ?? false,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = (key: keyof NotificationPreferences) =>
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus("Saving…");
    setSubmitting(true);
    try {
      await onSubmit(values);
      setStatus("Preferences updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences.");
      setStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-6", className)}>
      <ul className="flex flex-col divide-y divide-[var(--line)] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
        {TOGGLES.map(({ key, label, description }) => {
          const checked = values[key];
          const id = `notif-${key}`;
          return (
            <li key={key} className="flex items-start justify-between gap-4 px-4 py-4">
              <div className="flex flex-col gap-1">
                <label htmlFor={id} className="text-sm font-medium text-[var(--ink)]">
                  {label}
                </label>
                <p className="text-xs text-[var(--ink-soft)]">{description}</p>
              </div>
              <button
                type="button"
                id={id}
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={() => toggle(key)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
                  "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none",
                  "motion-reduce:transition-none",
                  checked ? "bg-[var(--accent)]" : "bg-[var(--line)]",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-5 translate-x-0.5 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-200",
                    "motion-reduce:transition-none",
                    checked && "translate-x-[22px]",
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div
        role="status"
        aria-live="polite"
        className="min-h-[1.25rem] text-xs text-[var(--ink-soft)]"
      >
        {error ? <span className="text-[var(--danger)]">{error}</span> : status ? status : null}
      </div>

      <Button type="submit" disabled={submitting} className="sm:self-start">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Saving
          </>
        ) : (
          "Save preferences"
        )}
      </Button>
    </form>
  );
}

export default NotificationsForm;
