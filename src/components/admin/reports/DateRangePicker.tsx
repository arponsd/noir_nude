"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export interface DateRangePickerProps {
  /** Query param name for the start date (default: "from"). */
  fromParam?: string;
  /** Query param name for the end date (default: "to"). */
  toParam?: string;
  className?: string;
}

/**
 * Minimal HTML5 date range picker. Emits URL query updates via `next/navigation`.
 * No extra dependency surface; keyboard/mobile-friendly via native `<input type="date">`.
 */
export default function DateRangePicker({
  fromParam = "from",
  toParam = "to",
  className,
}: DateRangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [from, setFrom] = React.useState(searchParams?.get(fromParam) ?? "");
  const [to, setTo] = React.useState(searchParams?.get(toParam) ?? "");

  React.useEffect(() => {
    setFrom(searchParams?.get(fromParam) ?? "");
    setTo(searchParams?.get(toParam) ?? "");
  }, [searchParams, fromParam, toParam]);

  const apply = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (from) params.set(fromParam, from);
    else params.delete(fromParam);
    if (to) params.set(toParam, to);
    else params.delete(toParam);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  };

  const clear = () => {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete(fromParam);
    params.delete(toParam);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className={cn("flex flex-wrap items-end gap-3", className)}
    >
      <div>
        <Label htmlFor="range-from">From</Label>
        <Input
          id="range-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          max={to || undefined}
        />
      </div>
      <div>
        <Label htmlFor="range-to">To</Label>
        <Input
          id="range-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          min={from || undefined}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        {from || to ? (
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  );
}
