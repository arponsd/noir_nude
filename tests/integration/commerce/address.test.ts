import { describe, it, expect, beforeEach } from "vitest";
import { seedUser } from "../../harness/seed";
import {
  createAddress,
  deleteAddress,
  getAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/lib/services/address";
import { Address } from "@/lib/db/models/Address";

const baseAddress = () => ({
  label: "home" as const,
  recipientName: "Alia Ahmed",
  phone: "+8801712345678",
  addressLine1: "House 12, Road 4",
  city: "Dhaka",
  district: "Dhaka",
  postalCode: "1212",
  country: "BD",
});

describe("address service", () => {
  let userId: string;

  beforeEach(async () => {
    const user = await seedUser({
      email: "address+tester@example.com",
      password: "Zx!9aQpm.Vr34K",
    });
    userId = user.userId;
  });

  it("create → list returns it", async () => {
    const created = await createAddress(userId, baseAddress());
    expect(created.id).toBeTypeOf("string");
    const list = await listAddresses(userId);
    expect(list.length).toBe(1);
    expect(list[0]!.id).toBe(created.id);
    expect(list[0]!.recipientName).toBe("Alia Ahmed");
  });

  it("get returns the created address", async () => {
    const created = await createAddress(userId, baseAddress());
    const got = await getAddress(userId, created.id);
    expect(got.city).toBe("Dhaka");
  });

  it("update modifies the matching fields", async () => {
    const created = await createAddress(userId, baseAddress());
    const updated = await updateAddress(userId, created.id, { city: "Chattogram" });
    expect(updated.city).toBe("Chattogram");
    const reloaded = await getAddress(userId, created.id);
    expect(reloaded.city).toBe("Chattogram");
  });

  it("delete soft-deletes (sets deletedAt, removes from list)", async () => {
    const created = await createAddress(userId, baseAddress());
    await deleteAddress(userId, created.id);
    const list = await listAddresses(userId);
    expect(list.find((a) => a.id === created.id)).toBeUndefined();

    // Confirm soft-delete (withDeleted escape-hatch) via raw model lookup.
    const raw = await Address.findOne({ _id: created.id }, null, {
      withDeleted: true,
    } as unknown as Record<string, unknown>).lean<{ deletedAt: Date | null } | null>();
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });

  it("setDefault clears siblings' isDefault flag atomically", async () => {
    const first = await createAddress(userId, baseAddress());
    const second = await createAddress(userId, {
      ...baseAddress(),
      addressLine1: "House 99, Road 9",
    });

    // Promote first → default, then promote second → default.
    const firstDefault = await setDefaultAddress(userId, first.id);
    expect(firstDefault.isDefault).toBe(true);

    const secondDefault = await setDefaultAddress(userId, second.id);
    expect(secondDefault.isDefault).toBe(true);

    // Re-fetch first: it must no longer be default.
    const reloadedFirst = await getAddress(userId, first.id);
    expect(reloadedFirst.isDefault).toBe(false);

    // And the listing shows exactly one default.
    const list = await listAddresses(userId);
    const defaults = list.filter((a) => a.isDefault);
    expect(defaults.length).toBe(1);
    expect(defaults[0]!.id).toBe(second.id);
  });
});
