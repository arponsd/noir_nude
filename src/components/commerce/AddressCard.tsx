import type { Address } from "@/types/api/address";
import { cn } from "@/lib/utils/cn";

export interface AddressCardProps {
  address: Address;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  className?: string;
}

const LABEL_COPY: Record<string, string> = {
  home: "Home",
  office: "Office",
  other: "Other",
};

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  className,
}: AddressCardProps) {
  const labelText = LABEL_COPY[address.label] ?? address.label;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--bg-alt)] px-2.5 py-0.5 text-xs font-medium tracking-[0.04em] text-[var(--ink-soft)] uppercase">
            {labelText}
          </span>
          {address.isDefault ? (
            <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-medium tracking-[0.04em] text-[var(--accent)] uppercase">
              Default
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-0.5 text-sm">
        <p className="font-medium text-[var(--ink)]">{address.recipientName}</p>
        <p className="text-[var(--ink-soft)] tabular-nums">{address.phone}</p>
        <address className="mt-1 text-[var(--ink-soft)] not-italic">
          <span className="block">{address.addressLine1}</span>
          {address.addressLine2 ? <span className="block">{address.addressLine2}</span> : null}
          <span className="block">
            {address.city}, {address.district}{" "}
            <span className="tabular-nums">{address.postalCode}</span>
          </span>
          <span className="block">{address.country}</span>
        </address>
      </div>

      <footer className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-[var(--ink)] underline-offset-4 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
          >
            Edit
          </button>
        ) : null}
        {onDelete ? (
          <>
            <span className="text-[var(--line)]" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={onDelete}
              className="text-[var(--danger)] underline-offset-4 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              Delete
            </button>
          </>
        ) : null}
        {!address.isDefault && onSetDefault ? (
          <>
            <span className="text-[var(--line)]" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={onSetDefault}
              className="text-[var(--accent)] underline-offset-4 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              Set as default
            </button>
          </>
        ) : null}
      </footer>
    </article>
  );
}
