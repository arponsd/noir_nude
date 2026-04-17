"use server";

import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/api/response";
import { requireAuth, requireRole } from "@/lib/auth/require-role";
import { checkLimit, reviewLimiter } from "@/lib/rate-limit";
import {
  adminReviewModerationSchema,
  reviewSubmitSchema,
  type AdminReviewModerationInput,
  type ReviewSubmitInputSchema,
} from "@/lib/validators/user";
import { objectIdParamSchema } from "@/lib/utils/object-id";
import { adminModerateReview, submitReview, toggleReviewHelpful } from "@/lib/services/review";
import type { ReviewDTO, ReviewHelpfulToggleResult } from "@/types/api/review";

const ADMIN_ROLES = ["admin", "manager", "support"] as const;

export const submitReviewAction = safeAction(
  async (input: ReviewSubmitInputSchema): Promise<ReviewDTO> => {
    const session = await requireAuth();
    await checkLimit(reviewLimiter, session.user.id);
    const parsed = reviewSubmitSchema.parse(input);
    const review = await submitReview(session.user.id, parsed);
    revalidatePath(`/products/[slug]`, "page");
    revalidatePath("/account/orders");
    return review;
  },
);

export const toggleReviewHelpfulAction = safeAction(
  async (input: { reviewId: string }): Promise<ReviewHelpfulToggleResult> => {
    const session = await requireAuth();
    const reviewId = objectIdParamSchema.parse(input.reviewId);
    const result = await toggleReviewHelpful(session.user.id, reviewId);
    return result;
  },
);

export const moderateReviewAction = safeAction(
  async (input: { reviewId: string } & AdminReviewModerationInput): Promise<ReviewDTO> => {
    const session = await requireRole(ADMIN_ROLES);
    const reviewId = objectIdParamSchema.parse(input.reviewId);
    const parsed = adminReviewModerationSchema.parse({
      isApproved: input.isApproved,
      ...(input.adminReply !== undefined ? { adminReply: input.adminReply } : {}),
    });
    const review = await adminModerateReview(reviewId, session.user.id, parsed);
    revalidatePath("/admin/reviews");
    return review;
  },
);
