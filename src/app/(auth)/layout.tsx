import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl leading-none tracking-[-0.02em] text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Cosmetic — Home"
        >
          Cosmetic
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="mx-auto w-full max-w-7xl px-4 py-6 text-xs text-[var(--muted)] sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} Cosmetic. All rights reserved.
      </footer>
    </div>
  );
}
