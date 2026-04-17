import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs font-medium tracking-[0.18em] text-[var(--accent)] uppercase">
        403 · Forbidden
      </p>
      <h1 className="font-display text-4xl tracking-[-0.01em] text-[var(--ink)]">Access denied</h1>
      <p className="text-sm text-[var(--ink-soft)]">
        You don&apos;t have permission to view this page. If you think this is a mistake, contact
        support.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/account">My account</Link>
        </Button>
      </div>
    </main>
  );
}
