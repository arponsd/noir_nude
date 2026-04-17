/**
 * Coupon validation preview DTO.
 *
 * Returned by the cart-page "apply coupon" preview — does NOT increment usage.
 * Usage is incremented only inside the place-order transaction.
 */
export type CouponValidation = {
  ok: boolean;
  code?: string;
  /** Reason code when ok === false. Example: "EXPIRED", "MIN_SPEND_NOT_MET", "USER_LIMIT_REACHED". */
  reason?: string;
  /** Computed discount in paisa when applicable. */
  discount?: number;
  /** If true, this coupon grants free shipping on top of (or instead of) a money discount. */
  freeShipping?: boolean;
};
