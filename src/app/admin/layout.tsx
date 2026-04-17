import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = new Set(["admin", "manager", "support"]);

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?next=/admin");
  if (!ADMIN_ROLES.has(session.user.role)) redirect("/403");

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="flex w-60 flex-col border-r border-[var(--line)] bg-[var(--surface)]">
        <div className="flex h-16 items-center border-b border-[var(--line)] px-5">
          <Link
            href="/admin"
            className="font-display text-xl leading-none tracking-[-0.02em] text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Cosmetic
            <span className="ml-2 align-middle text-[10px] font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
              Admin
            </span>
          </Link>
        </div>
        <AdminSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-6">
          <span className="text-sm text-[var(--ink-soft)]">
            Signed in as{" "}
            <span className="text-[var(--ink)]">{session.user.email ?? session.user.name}</span>
          </span>
          <span className="rounded-full bg-[var(--bg-alt)] px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-[var(--ink)] uppercase">
            {session.user.role}
          </span>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
