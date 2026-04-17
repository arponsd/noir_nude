import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AccountSidebar from "@/components/shared/AccountSidebar";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?next=/account");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display mb-4 text-xl tracking-[-0.01em] text-[var(--ink)]">
            My account
          </h2>
          <AccountSidebar />
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
