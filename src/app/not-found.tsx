import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">404</p>
      <h1 className="font-display mt-3 text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        The page you were looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
