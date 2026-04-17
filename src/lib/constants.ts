export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  COUPON_INVALID: "COUPON_INVALID",
  COUPON_EXPIRED: "COUPON_EXPIRED",
  ORDER_NOT_CANCELLABLE: "ORDER_NOT_CANCELLABLE",
  CSRF_FAILED: "CSRF_FAILED",
  CLOUDINARY_SIGN_FAILED: "CLOUDINARY_SIGN_FAILED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const CURRENCY = "BDT" as const;
export const CURRENCY_SUBUNITS = 100;

const bdtFormatter = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBDT(paisa: number): string {
  const amount = paisa / CURRENCY_SUBUNITS;
  // reason: some runtimes lack BDT locale data; prepend symbol manually for consistency.
  return `\u09F3${bdtFormatter.format(amount)}`;
}

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
} as const;

export const SKIN_TYPES = [
  "normal",
  "dry",
  "oily",
  "combination",
  "sensitive",
  "acne-prone",
  "mature",
] as const;

export type SkinType = (typeof SKIN_TYPES)[number];

export const USER_ROLES = ["customer", "admin", "manager", "support"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const BADGES = [
  "new",
  "bestseller",
  "sale",
  "limited",
  "vegan",
  "cruelty-free",
  "organic",
] as const;

export type Badge = (typeof BADGES)[number];
