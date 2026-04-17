import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { listLowStockVariants, adjustVariantStock } from "@/lib/db/queries/admin-products";
import { ValidationError, NotFoundError } from "@/lib/api/response";
import { ERROR_CODES, type UserRole } from "@/lib/constants";
import type { AdminInventoryAdjustInput } from "@/lib/validators/admin";

export type LowStockVariantDTO = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  stock: number;
  reservedStock: number;
  available: number;
};

export async function listLowStockService(
  threshold = 5,
  limit = 50,
): Promise<LowStockVariantDTO[]> {
  await connectDb();
  const rows = await listLowStockVariants(threshold, limit);
  return rows.map((r) => ({
    productId: r.productId,
    productSlug: r.productSlug,
    productName: r.productName,
    variantId: r.variantId,
    variantName: r.variantName,
    stock: r.stock,
    reservedStock: r.reservedStock,
    available: r.stock - r.reservedStock,
  }));
}

export type AdjustInventoryResult = {
  productId: string;
  variantId: string;
  stock: number;
  reservedStock: number;
  available: number;
};

/**
 * Adjust a variant's on-hand stock by `delta`. The underlying DB helper writes
 * its own ActivityLog entry (keyed on `product.stock_adjust`) so we do not double-log.
 */
export async function adjustInventoryService(
  input: AdminInventoryAdjustInput,
  actor: { id: string; role: UserRole },
): Promise<AdjustInventoryResult> {
  await connectDb();
  if (!Types.ObjectId.isValid(input.productId) || !Types.ObjectId.isValid(input.variantId)) {
    throw new NotFoundError("Variant not found");
  }

  try {
    const result = await adjustVariantStock(input.productId, input.variantId, input.delta, {
      actorId: actor.id,
      actorRole: actor.role,
      reason: input.reason,
    });
    return {
      ...result,
      available: result.stock - result.reservedStock,
    };
  } catch (err) {
    // The DB helper throws a plain Error when the adjustment would go below zero
    // or the variant is missing — map to a ValidationError so the API surfaces 400.
    const message = err instanceof Error ? err.message : "Inventory adjustment failed";
    throw new ValidationError(message, ERROR_CODES.VALIDATION_FAILED);
  }
}
