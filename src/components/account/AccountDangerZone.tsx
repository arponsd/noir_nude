"use client";

import * as React from "react";
import { AlertTriangle, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export interface AccountDangerZoneProps {
  /** Handler to delete the account. Called after the user types the literal confirmation phrase. */
  onDelete: () => Promise<void> | void;
  /**
   * Endpoint for GDPR data export. Defaults to `/api/user/export` per the API contract.
   */
  exportUrl?: string;
  className?: string;
}

const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

export function AccountDangerZone({
  onDelete,
  exportUrl = "/api/user/export",
  className,
}: AccountDangerZoneProps) {
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const matches = confirmText === CONFIRM_PHRASE;

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(exportUrl, {
        method: "GET",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `glowcart-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!matches || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
      setDialogOpen(false);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/[0.03] p-6",
        className,
      )}
      aria-labelledby="danger-zone-heading"
    >
      <header className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 size-5 text-[var(--danger)]"
          strokeWidth={1.5}
          aria-hidden
        />
        <div>
          <h2
            id="danger-zone-heading"
            className="font-display text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]"
          >
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Export your data or permanently delete your account. Deletion cannot be undone.
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-medium text-[var(--ink)]">Download my data</h3>
          <p className="text-xs text-[var(--ink-soft)]">
            Get a JSON export of your profile, orders, and reviews.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="self-start"
          >
            {exporting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Preparing
              </>
            ) : (
              <>
                <Download className="size-4" strokeWidth={1.5} aria-hidden /> Download my data
              </>
            )}
          </Button>
          <div
            role="status"
            aria-live="polite"
            className="min-h-[1rem] text-[11px] text-[var(--danger)]"
          >
            {exportError ?? ""}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-medium text-[var(--ink)]">Delete account</h3>
          <p className="text-xs text-[var(--ink-soft)]">
            Your profile is removed. Orders are retained per accounting requirements.
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive" size="sm" className="self-start">
                <Trash2 className="size-4" strokeWidth={1.5} aria-hidden /> Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Your orders will be retained for accounting
                  purposes, but your profile, reviews, and saved data will be removed.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-delete">
                  Type <span className="font-semibold text-[var(--danger)]">{CONFIRM_PHRASE}</span>{" "}
                  to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  aria-invalid={confirmText.length > 0 && !matches ? true : undefined}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <div
                  role="status"
                  aria-live="polite"
                  className="min-h-[1rem] text-xs text-[var(--danger)]"
                >
                  {deleteError ?? ""}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDialogOpen(false);
                    setConfirmText("");
                    setDeleteError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!matches || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Deleting
                    </>
                  ) : (
                    "Delete permanently"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}

export default AccountDangerZone;
