import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export const metadata = { title: "Profile" };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login?next=/account");

  const name = session.user.name ?? "there";
  const email = session.user.email ?? "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
          Welcome, {name}
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">Manage your account and orders.</p>
      </header>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Profile
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--muted)]">Name</dt>
            <dd className="mt-1 text-sm text-[var(--ink)]">{name}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">Email</dt>
            <dd className="mt-1 text-sm text-[var(--ink)]">{email}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <Button asChild variant="secondary" size="sm">
            <Link href="/account/profile">Edit profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
