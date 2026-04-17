/**
 * Review API DTOs.
 *
 * Reviews are verified-buyer only (the submit path loads the originating Order and
 * asserts the user owns it, it is in `delivered` state, and it contains the product).
 * Newly-submitted reviews start with `isApproved: false`; the admin moderation route
 * flips the flag and the DB-layer transaction recomputes Product.rating atomically.
 */
import type { SkinType } from "@/lib/constants";
import type { Paginated } from "./index";

export type ReviewImage = {
  url: string;
  alt: string;
};

export type ReviewAdminReply = {
  body: string;
  repliedAt: string;
};

export type ReviewDTO = {
  id: string;
  productId: string;
  /** Optional slug — populated when the caller listed reviews by slug. */
  productSlug?: string;
  rating: number;
  title: string;
  body: string;
  images: ReviewImage[];
  /** Reviewer's self-reported skin type at review time, when known. */
  skinTypeAtReview?: SkinType;
  helpfulCount: number;
  isVerified: boolean;
  authorName: string;
  createdAt: string;
  adminReply?: ReviewAdminReply;
};

export type ReviewListPage = Paginated<ReviewDTO>;

/**
 * Client-submittable review input. `orderId` is required for the verified-buyer check —
 * the service validates the order belongs to the caller, is delivered, and contains the
 * product. `images` are Cloudinary URLs previously obtained via `/api/uploads/sign`.
 */
export type ReviewSubmitInput = {
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  skinTypeAtReview?: SkinType | null;
};

export type ReviewHelpfulToggleResult = {
  helpfulCount: number;
  userVoted: boolean;
};
