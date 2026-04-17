// TODO import when backend ships `@/types/api/review` and `@/types/api/user`.
// These are local fallbacks used by the review primitives; the shapes mirror
// what the backend is expected to return per `docs/06-api-contract.md`.

import type { SkinType } from "@/lib/constants";

export interface ReviewImage {
  url: string;
  alt: string;
}

export interface ReviewAuthor {
  id?: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ReviewAdminReply {
  body: string;
  author?: string;
  repliedAt: string;
}

export interface ReviewDTO {
  id: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  author: ReviewAuthor;
  verified: boolean;
  createdAt: string;
  images?: ReviewImage[];
  skinTypeAtReview?: SkinType | null;
  helpfulCount: number;
  adminReply?: ReviewAdminReply | null;
  /** Whether the current viewer has voted this review helpful. */
  userVoted?: boolean;
}

export interface ReviewStatsDTO {
  avg: number;
  count: number;
  byStar: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewSubmitValues {
  rating: number;
  title: string;
  body: string;
  images: ReviewImage[];
  skinTypeAtReview?: SkinType;
}
