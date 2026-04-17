"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // reason: surface listing failures to console in dev; Sentry hook is server-side only.
    console.error("products listing error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-medium tracking-[0.12em] text-[var(--danger)] uppercase">
        Something went wrong
      </p>
      <h1 className="font-display mt-3 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-4xl">
        We couldn&apos;t load the catalog.
      </h1>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        This is usually temporary. You can retry, or head home.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
