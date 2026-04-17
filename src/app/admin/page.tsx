import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const session = await auth();
  if (!session) redirect("/login?next=/admin");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
            Welcome, {session.user.name ?? "admin"}
          </h1>
          <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-[var(--accent)] uppercase">
            {session.user.role}
          </span>
        </div>
        <p className="text-sm text-[var(--ink-soft)]">
          Here&apos;s the control center. Catalog, orders, and reports will appear here.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Orders today", "Revenue (30d)", "New customers", "Low stock"].map((title) => (
          <div
            key={title}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
              {title}
            </p>
            <p className="font-display mt-3 text-2xl text-[var(--ink)]">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
