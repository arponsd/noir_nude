/**
 * Banner API DTO — shown on the storefront hero carousel.
 *
 * `order` controls visual ordering (low number first). `publishFrom`/`publishUntil`
 * are optional ISO bounds; absent = always published while `isActive` is true.
 */
export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href?: string;
  cta?: string;
  order: number;
  isActive: boolean;
  publishFrom?: string;
  publishUntil?: string;
  createdAt: string;
  updatedAt: string;
};

export type BannerListPayload = {
  items: Banner[];
};
