import { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Cart } from "@/lib/db/models/Cart";
import { Product, type ProductVariantDoc } from "@/lib/db/models/Product";

/**
 * Seed a user's cart directly via the Cart model (bypasses rate limits and auth
 * wrapping the service layer would otherwise apply). Reads the live variant
 * price to populate `priceSnapshot` so the cart reflects what a real user would
 * have saved at add-time.
 *
 * Usage:
 *   await seedCart({
 *     userId,
 *     lines: [{ productId, variantId, quantity: 2 }],
 *     couponCode: "WELCOME10",
 *   });
 */
export type SeedCartLine = {
  productId: string;
  variantId: string;
  quantity: number;
  /** Override the per-unit price snapshot. Defaults to the live variant price. */
  priceSnapshot?: number;
};

export type SeedCartInput = {
  userId: string;
  lines: SeedCartLine[];
  couponCode?: string;
};

export async function seedCart(input: SeedCartInput): Promise<void> {
  await connectDb();

  const productIds = Array.from(new Set(input.lines.map((l) => l.productId))).map(
    (id) => new Types.ObjectId(id),
  );
  const products = await Product.find({ _id: { $in: productIds } })
    .select({ variants: 1 })
    .lean<
      {
        _id: Types.ObjectId;
        variants: ProductVariantDoc[];
      }[]
    >();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = input.lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) {
      throw new Error(`seedCart: product ${line.productId} not found`);
    }
    const variant = product.variants.find((v) => v._id.toString() === line.variantId);
    if (!variant) {
      throw new Error(`seedCart: variant ${line.variantId} not found on product ${line.productId}`);
    }
    return {
      productId: new Types.ObjectId(line.productId),
      variantId: new Types.ObjectId(line.variantId),
      quantity: line.quantity,
      priceSnapshot: line.priceSnapshot ?? variant.price,
    };
  });

  const update: Record<string, unknown> = { items };
  if (input.couponCode) {
    update.couponCode = input.couponCode.toUpperCase();
  } else {
    update.$unset = { couponCode: 1 };
  }

  await Cart.findOneAndUpdate({ userId: input.userId }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
}
