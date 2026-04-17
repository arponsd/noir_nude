export const metadata = { title: "Dashboard — Admin" };

const CARDS = ["Revenue", "Orders", "Top products", "Low stock"] as const;

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Phase 5 · Coming soon
        </p>
        <h1 className="font-display mt-2 text-3xl tracking-[-0.01em] text-[var(--ink)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Live metrics will land with the reporting backend.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((title) => (
          <div
            key={title}
            className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
              {title}
            </p>
            <p className="font-display mt-3 text-3xl text-[var(--ink)]">—</p>
            <p className="mt-2 text-xs text-[var(--muted)]">Phase 5</p>
          </div>
        ))}
      </div>
    </div>
  );
}
