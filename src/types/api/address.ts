/**
 * Address API DTOs.
 *
 * `country` defaults to "BD" in validators. `phone` is stored in E.164 (e.g. +8801XXXXXXXXX).
 * Addresses are soft-deleted server-side; list endpoints filter out deleted rows.
 */
export type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
};

export type AddressInput = {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
};
