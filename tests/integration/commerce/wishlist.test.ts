import { describe, it, expect, beforeEach } from "vitest";
import { seedCatalog, type SeededCatalog } from "../../harness/seed-catalog";
import { seedUser } from "../../harness/seed";
import { getWishlist, toggleWishlist } from "@/lib/services/wishlist";

describe("wishlist service — toggleWishlist", () => {
  let catalog: SeededCatalog;
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    catalog = await seedCatalog();
    const user = await seedUser({
      email: "wishlist+tester@example.com",
      password: "Zx!9aQpm.Vr34K",
    });
    userId = user.userId;
    const lipstick = catalog.productBySlug.get("velvet-matte-lipstick");
    if (!lipstick) throw new Error("seedCatalog missing product");
    productId = lipstick.id;
  });

  it("first toggle adds, second toggle removes", async () => {
    const first = await toggleWishlist(userId, productId);
    expect(first.added).toBe(true);

    const list1 = await getWishlist(userId);
    expect(list1.items.length).toBe(1);
    expect(list1.items[0]!.productId).toBe(productId);

    const second = await toggleWishlist(userId, productId);
    expect(second.added).toBe(false);

    const list2 = await getWishlist(userId);
    expect(list2.items.length).toBe(0);
  });

  it("toggle persists across separate queries", async () => {
    await toggleWishlist(userId, productId);
    const reloaded = await getWishlist(userId);
    expect(reloaded.items[0]!.slug).toBe("velvet-matte-lipstick");
  });
});
