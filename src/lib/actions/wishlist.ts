"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { cartLimiter, checkLimit } from "@/lib/rate-limit";
import { wishlistToggleSchema } from "@/lib/validators/commerce";
import { toggleWishlist } from "@/lib/services/wishlist";

/**
 * Wishlist toggle. Rate-limited on the shared cartLimiter bucket — wishlist traffic
 * patterns match cart adds closely enough that a separate bucket isn't warranted yet.
 */
export const toggleWishlistAction = safeAction(
  async (input: { productId: string; variantId?: string }): Promise<{ added: boolean }> => {
    const session = await requireAuth();
    await checkLimit(cartLimiter, session.user.id);
    const parsed = wishlistToggleSchema.parse(input);
    const result = await toggleWishlist(session.user.id, parsed.productId, parsed.variantId);
    revalidatePath("/wishlist");
    revalidatePath(`/products/${parsed.productId}`);
    return result;
  },
);
