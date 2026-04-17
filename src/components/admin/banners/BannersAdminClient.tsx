"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import BannerForm from "./BannerForm";
import BannersGrid, { type AdminBannerRow } from "./BannersGrid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface BannersAdminClientProps {
  banners: AdminBannerRow[];
}

function toFormInitial(b: AdminBannerRow) {
  const init: Record<string, unknown> = {
    imageUrl: b.imageUrl,
    title: b.title,
    order: b.order,
    isActive: b.isActive,
  };
  if (b.subtitle) init.subtitle = b.subtitle;
  if (b.href) init.href = b.href;
  if (b.cta) init.cta = b.cta;
  if (b.publishFrom) init.publishFrom = b.publishFrom.slice(0, 16);
  if (b.publishUntil) init.publishUntil = b.publishUntil.slice(0, 16);
  return init;
}

/**
 * Client-side wrapper for the banners admin page: owns the Dialog state used by
 * both the "Add banner" button and inline edit affordances on each card.
 */
export default function BannersAdminClient({ banners }: BannersAdminClientProps) {
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminBannerRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" strokeWidth={1.5} aria-hidden />
          Add banner
        </Button>
      </div>

      <BannersGrid banners={banners} onEdit={(b) => setEditing(b)} />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New banner</DialogTitle>
            <DialogDescription>Upload an image and set the hero copy.</DialogDescription>
          </DialogHeader>
          <BannerForm mode="create" onSuccess={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit banner</DialogTitle>
            <DialogDescription>Update the hero banner contents.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <BannerForm
              mode="edit"
              bannerId={editing.id}
              // reason: form schema expects Partial<BannerFormValues>; narrowed at use.
              initial={toFormInitial(editing) as Parameters<typeof BannerForm>[0]["initial"]}
              onSuccess={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
