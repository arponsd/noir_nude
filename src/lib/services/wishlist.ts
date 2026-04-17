import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/Product";
import { Wishlist, type WishlistItemDoc } from "@/lib/db/models/Wishlist";
import type { Wishlist as WishlistDTO, WishlistItem } from "@/types/api/wishlist";

/* ----------------------------------------------------------------------------
 * Wishlist service — single-doc-per-user. The DB agent has not exposed dedicated
 * query helpers yet; writes and reads go through the Wishlist model directly.
 * This is the narrowest possible access: add/remove and list-plus-product-join.
 * -------------------------------------------------------------------------- */

type LeanWishlist = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: WishlistItemDoc[];
};

type LeanProduct = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  images?: { url: string; alt?: string; order?: number }[];
  isActive: boolean;
  deletedAt: Date | null;
};

async function loadProducts(ids: Types.ObjectId[]): Promise<Map<string, LeanProduct>> {
  if (ids.length === 0) return new Map();
  const docs = await Product.find({ _id: { $in: ids } })
    .select({ slug: 1, name: 1, brand: 1, images: { $slice: 1 }, isActive: 1, deletedAt: 1 })
    .lean<LeanProduct[]>();
  const map = new Map<string, LeanProduct>();
  for (const d of docs) map.set(d._id.toString(), d);
  return map;
}

export async function getWishlist(userId: string): Promise<WishlistDTO> {
  await connectDb();
  const doc = await Wishlist.findOne({ userId }).lean<LeanWishlist | null>();
  if (!doc || doc.items.length === 0) return { items: [] };

  const productIds = doc.items.map((i) => i.productId);
  const productMap = await loadProducts(productIds);

  const items: WishlistItem[] = [];
  for (const entry of doc.items) {
    const product = productMap.get(entry.productId.toString());
    if (!product || !product.isActive || product.deletedAt) continue;
    const item: WishlistItem = {
      productId: product._id.toString(),
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      addedAt: (entry.addedAt ?? new Date(0)).toISOString(),
    };
    if (entry.variantId) item.variantId = entry.variantId.toString();
    const thumb = product.images?.[0]?.url;
    if (thumb) item.thumbUrl = thumb;
    items.push(item);
  }

  return { items };
}

export async function toggleWishlist(
  userId: string,
  productId: string,
  variantId?: string,
): Promise<{ added: boolean }> {
  await connectDb();

  const pid = new Types.ObjectId(productId);
  const vid = variantId ? new Types.ObjectId(variantId) : null;

  const existing = await Wishlist.findOne({ userId }).lean<LeanWishlist | null>();
  const hasEntry = (existing?.items ?? []).some(
    (e) =>
      e.productId.toString() === pid.toString() &&
      (vid ? e.variantId?.toString() === vid.toString() : !e.variantId),
  );

  if (hasEntry) {
    await Wishlist.updateOne(
      { userId },
      {
        $pull: {
          items: {
            productId: pid,
            ...(vid ? { variantId: vid } : { variantId: null }),
          },
        },
      },
    );
    return { added: false };
  }

  await Wishlist.updateOne(
    { userId },
    {
      $setOnInsert: { userId: new Types.ObjectId(userId) },
      $push: {
        items: {
          productId: pid,
          variantId: vid,
          addedAt: new Date(),
        },
      },
    },
    { upsert: true },
  );
  return { added: true };
}
