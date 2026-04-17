import RoleBadge from "@/components/admin/roles/RoleBadge";
import { auth } from "@/lib/auth";

export const metadata = { title: "Roles — Admin" };
export const dynamic = "force-dynamic";

/**
 * Role management placeholder. The full mutation surface (promote/demote users,
 * filter by role) is scoped to Phase 7 with the security lane; for MVP we surface
 * the viewer's own role plus a "coming soon" panel so admins know the route works.
 *
 * reason: `listAllUsersWithRoles` is not yet owned by the backend lane. Rather than
 * shim a service from the frontend, we degrade gracefully.
 */
export default async function AdminRolesPage() {
  const session = await auth();
  const role = session?.user.role ?? "customer";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Roles</h1>
        <p className="text-sm text-[var(--ink-soft)]">Role-based access control overview.</p>
      </header>

      <section className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display mb-3 text-lg tracking-[-0.01em] text-[var(--ink)]">You</h2>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-[var(--ink)]">
              {session?.user.name ?? session?.user.email ?? "Unknown"}
            </p>
            <p className="text-xs text-[var(--muted)]">{session?.user.email}</p>
          </div>
          <RoleBadge role={role} />
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Role changes take effect on next sign-in.
        </p>
      </section>

      <section className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Coming soon
        </p>
        <h2 className="font-display mt-2 text-2xl tracking-[-0.01em] text-[var(--ink)]">
          Full role management
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-soft)]">
          Promote, demote, and audit admin users directly from this page. Planned for Phase 7 with
          the security lane.
        </p>
      </section>
    </div>
  );
}
