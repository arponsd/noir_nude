import type { Types } from "mongoose";
import { Product } from "@/lib/db/models/Product";
import { createActivityLog } from "@/lib/db/models/ActivityLog";

export type LowStockVariantRow = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  stock: number;
  reservedStock: number;
};

export type AdjustStockOpts = {
  actorId: Types.ObjectId | string;
  actorRole?: string;
  reason: string;
};

export type AdjustStockResult = {
  productId: string;
  variantId: string;
  stock: number;
  reservedStock: number;
};

type LeanLowStockProduct = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  variants?: Array<{
    _id: Types.ObjectId;
    name: string;
    stock: number;
    reservedStock: number;
    isActive: boolean;
  }>;
};

type LeanVariantUpdated = {
  _id: Types.ObjectId;
  variants?: Array<{
    _id: Types.ObjectId;
    stock: number;
    reservedStock: number;
  }>;
};

/**
 * Flat list of low-stock active variants across active, non-deleted products.
 * "Low" = available (stock - reservedStock) < threshold.
 */
export async function listLowStockVariants(
  threshold = 5,
  limit = 50,
): Promise<LowStockVariantRow[]> {
  // reason: $expr cannot be nested inside $elemMatch on a subdoc array — fetch any
  // product with an active variant and filter available (stock - reservedStock) in JS.
  const docs = await Product.find({
    isActive: true,
    deletedAt: null,
    "variants.isActive": true,
  })
    .select({ slug: 1, name: 1, variants: 1 })
    .lean<LeanLowStockProduct[]>();

  const out: LowStockVariantRow[] = [];
  for (const p of docs) {
    for (const v of p.variants ?? []) {
      if (!v.isActive) continue;
      if (v.stock - v.reservedStock >= threshold) continue;
      out.push({
        productId: p._id.toString(),
        productSlug: p.slug,
        productName: p.name,
        variantId: v._id.toString(),
        variantName: v.name,
        stock: v.stock,
        reservedStock: v.reservedStock,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Atomically adjust a variant's stock by `delta` (positive or negative).
 * Rejects when the resulting stock would drop below zero. Emits an ActivityLog
 * entry on success.
 *
 * Returns the fresh `stock` + `reservedStock` on the updated variant, or throws
 * when the product/variant is missing or the adjustment would go negative.
 */
export async function adjustVariantStock(
  productId: Types.ObjectId | string,
  variantId: Types.ObjectId | string,
  delta: number,
  opts: AdjustStockOpts,
): Promise<AdjustStockResult> {
  if (!Number.isInteger(delta)) {
    throw new Error("adjustVariantStock: delta must be an integer");
  }
  if (delta === 0) {
    throw new Error("adjustVariantStock: delta must be non-zero");
  }

  const variantMatch: Record<string, unknown> = { "variants._id": variantId };
  // reason: guard against going below zero via conditional filter — if stock+delta < 0,
  // the filter misses and the update returns null.
  if (delta < 0) {
    variantMatch["variants.stock"] = { $gte: -delta };
  }

  const updated = await Product.findOneAndUpdate(
    {
      _id: productId,
      deletedAt: null,
      ...variantMatch,
    },
    { $inc: { "variants.$.stock": delta } },
    { new: true, projection: { variants: 1 } },
  ).lean<LeanVariantUpdated | null>();

  if (!updated) {
    throw new Error(
      "adjustVariantStock: variant not found, product deleted, or adjustment would go below zero",
    );
  }

  const variant = (updated.variants ?? []).find((v) => v._id.toString() === String(variantId));
  if (!variant) {
    throw new Error("adjustVariantStock: variant vanished after update");
  }

  await createActivityLog({
    actorId: opts.actorId,
    actorRole: opts.actorRole ?? "admin",
    event: "product.stock_adjust",
    entity: "product",
    entityId: updated._id,
    summary: `Adjusted variant ${String(variantId)} stock by ${delta > 0 ? "+" : ""}${delta}`,
    details: {
      productId: updated._id.toString(),
      variantId: variant._id.toString(),
      delta,
      newStock: variant.stock,
      reason: opts.reason,
    },
  });

  return {
    productId: updated._id.toString(),
    variantId: variant._id.toString(),
    stock: variant.stock,
    reservedStock: variant.reservedStock,
  };
}
