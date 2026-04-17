/**
 * Wishlist API DTOs.
 *
 * Wishlist lines do not carry price — they resolve on the product page when the
 * shopper moves the item to the cart.
 */
export type WishlistItem = {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  brand: string;
  thumbUrl?: string;
  addedAt: string;
};

export type Wishlist = {
  items: WishlistItem[];
};
