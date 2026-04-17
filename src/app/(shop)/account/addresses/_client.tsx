"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import AddressCard from "@/components/commerce/AddressCard";
import AddressForm from "@/components/commerce/AddressForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "@/lib/actions/address";
import type { Address, AddressInput } from "@/types/api/address";
import type { AddressLabel } from "@/lib/validators/commerce";

export interface AddressesClientProps {
  initialAddresses: Address[];
}

type DialogMode =
  | { mode: "create" }
  | { mode: "edit"; address: Address }
  | { mode: "delete"; address: Address }
  | { mode: "closed" };

export default function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [addresses, setAddresses] = React.useState<Address[]>(initialAddresses);
  const [dialog, setDialog] = React.useState<DialogMode>({ mode: "closed" });
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const close = () => setDialog({ mode: "closed" });

  const handleCreate = async (values: AddressInput) => {
    const payload = { ...values, label: (values.label as AddressLabel) ?? "home" };
    const res = await createAddressAction(payload);
    if (res.ok) {
      setAddresses((prev) => [res.data, ...prev]);
      close();
      toast({ title: "Address added", variant: "success" });
      router.refresh();
    } else {
      toast({
        title: "Could not add address",
        description: res.error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (values: AddressInput) => {
    if (dialog.mode !== "edit") return;
    const payload = { ...values, label: (values.label as AddressLabel) ?? "home" };
    const res = await updateAddressAction(dialog.address.id, payload);
    if (res.ok) {
      setAddresses((prev) => prev.map((a) => (a.id === res.data.id ? res.data : a)));
      close();
      toast({ title: "Address updated", variant: "success" });
      router.refresh();
    } else {
      toast({
        title: "Could not update",
        description: res.error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (dialog.mode !== "delete") return;
    setPendingId(dialog.address.id);
    const res = await deleteAddressAction(dialog.address.id);
    setPendingId(null);
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== res.data.id));
      close();
      toast({ title: "Address deleted" });
      router.refresh();
    } else {
      toast({
        title: "Could not delete",
        description: res.error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (address: Address) => {
    setPendingId(address.id);
    const res = await setDefaultAddressAction(address.id);
    setPendingId(null);
    if (res.ok) {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === res.data.id })));
      toast({ title: "Default address updated", variant: "success" });
      router.refresh();
    } else {
      toast({
        title: "Could not set default",
        description: res.error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => setDialog({ mode: "create" })}>
          <Plus className="size-4" strokeWidth={1.5} /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--ink-soft)]">
          No addresses yet.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} aria-busy={pendingId === address.id}>
              <AddressCard
                address={address}
                onEdit={() => setDialog({ mode: "edit", address })}
                onDelete={() => setDialog({ mode: "delete", address })}
                onSetDefault={() => handleSetDefault(address)}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialog.mode === "create" || dialog.mode === "edit"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog.mode === "edit" ? "Edit address" : "Add address"}</DialogTitle>
          </DialogHeader>
          {dialog.mode === "edit" ? (
            <AddressForm
              defaultValues={{
                label: (dialog.address.label as AddressLabel) ?? "home",
                recipientName: dialog.address.recipientName,
                phone: dialog.address.phone,
                addressLine1: dialog.address.addressLine1,
                addressLine2: dialog.address.addressLine2 ?? "",
                city: dialog.address.city,
                district: dialog.address.district,
                postalCode: dialog.address.postalCode,
                country: dialog.address.country,
              }}
              onSubmit={handleEdit}
              submitLabel="Save changes"
            />
          ) : dialog.mode === "create" ? (
            <AddressForm onSubmit={handleCreate} submitLabel="Add address" />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog.mode === "delete"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this address?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. Orders already placed will keep their snapshotted address.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              Keep address
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pendingId !== null}>
              {pendingId ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Deleting
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
