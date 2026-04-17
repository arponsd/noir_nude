"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">Error</p>
      <h1 className="font-display mt-3 text-4xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        We&apos;ve been notified. Try again in a moment.
      </p>
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </main>
  );
}
