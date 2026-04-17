"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CloudinaryUploader, { type UploadedImage } from "@/components/admin/CloudinaryUploader";
import { SKIN_TYPES, type SkinType } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { StarRatingInput } from "./StarRatingInput";
import type { ReviewSubmitValues } from "./types";

// TODO import when backend lands: `import { reviewSubmitSchema } from "@/lib/validators/user";`
const fallbackReviewSchema = z.object({
  rating: z.number().int().min(1, "Please choose a rating").max(5),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  body: z.string().trim().min(10, "Review must be at least 10 characters").max(4000),
  skinTypeAtReview: z.enum(SKIN_TYPES).optional(),
});

type ReviewFormSchemaValues = z.infer<typeof fallbackReviewSchema>;

export interface ReviewFormProps {
  onSubmit: (values: ReviewSubmitValues) => Promise<void> | void;
  defaultValues?: Partial<ReviewSubmitValues>;
  submitLabel?: string;
  className?: string;
}

const MAX_IMAGES = 3;
const BODY_MAX = 4000;

export function ReviewForm({
  onSubmit,
  defaultValues,
  submitLabel = "Submit review",
  className,
}: ReviewFormProps) {
  const [images, setImages] = React.useState<UploadedImage[]>(
    (defaultValues?.images ?? []).map((img, i) => ({
      url: img.url,
      alt: img.alt,
      order: i,
    })),
  );
  const [asyncError, setAsyncError] = React.useState<string | null>(null);
  const [asyncStatus, setAsyncStatus] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormSchemaValues>({
    resolver: zodResolver(fallbackReviewSchema),
    defaultValues: {
      rating: defaultValues?.rating ?? 0,
      title: defaultValues?.title ?? "",
      body: defaultValues?.body ?? "",
      skinTypeAtReview: defaultValues?.skinTypeAtReview,
    },
  });

  const bodyValue = watch("body") ?? "";

  const submit = handleSubmit(async (values) => {
    setAsyncError(null);
    setAsyncStatus("Submitting review…");
    try {
      const payload: ReviewSubmitValues = {
        rating: values.rating,
        title: values.title.trim(),
        body: values.body.trim(),
        images: images.slice(0, MAX_IMAGES).map(({ url, alt }) => ({ url, alt })),
        ...(values.skinTypeAtReview ? { skinTypeAtReview: values.skinTypeAtReview } : {}),
      };
      await onSubmit(payload);
      setAsyncStatus("Thanks for your review!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not submit review.";
      setAsyncError(message);
      setAsyncStatus(null);
    }
  });

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="review-rating">Rating</Label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRatingInput
              id="review-rating"
              value={field.value}
              onChange={field.onChange}
              size="lg"
              aria-invalid={errors.rating ? true : undefined}
              aria-describedby={errors.rating ? "review-rating-error" : undefined}
            />
          )}
        />
        {errors.rating ? (
          <p
            id="review-rating-error"
            role="alert"
            aria-live="polite"
            className="text-xs text-[var(--danger)]"
          >
            {errors.rating.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="review-title">Title</Label>
        <Input
          id="review-title"
          maxLength={120}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "review-title-error" : undefined}
          {...register("title")}
        />
        {errors.title ? (
          <p
            id="review-title-error"
            role="alert"
            aria-live="polite"
            className="text-xs text-[var(--danger)]"
          >
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="review-body">Your review</Label>
        <textarea
          id="review-body"
          rows={6}
          maxLength={BODY_MAX}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "review-body-error" : "review-body-hint"}
          className={cn(
            "w-full resize-y border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] transition-colors duration-200",
            "rounded-[var(--radius-sm)] placeholder:font-light placeholder:text-[var(--muted)]",
            "focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20 focus-visible:outline-none",
          )}
          {...register("body")}
        />
        <div className="flex items-center justify-between">
          <p id="review-body-hint" className="text-[11px] text-[var(--muted)] tabular-nums">
            {bodyValue.length} / {BODY_MAX}
          </p>
          {errors.body ? (
            <p
              id="review-body-error"
              role="alert"
              aria-live="polite"
              className="text-xs text-[var(--danger)]"
            >
              {errors.body.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="review-skin-type">Skin type (optional)</Label>
        <Controller
          control={control}
          name="skinTypeAtReview"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v as SkinType)}>
              <SelectTrigger id="review-skin-type">
                <SelectValue placeholder="Select your skin type" />
              </SelectTrigger>
              <SelectContent>
                {SKIN_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Photos (up to {MAX_IMAGES})</Label>
        <CloudinaryUploader
          images={images.slice(0, MAX_IMAGES)}
          onChange={(next) => setImages(next.slice(0, MAX_IMAGES))}
          folder="reviews"
        />
      </div>

      <div
        role="status"
        aria-live="polite"
        className="min-h-[1.25rem] text-xs text-[var(--ink-soft)]"
      >
        {asyncError ? (
          <span className="text-[var(--danger)]">{asyncError}</span>
        ) : asyncStatus ? (
          asyncStatus
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="sm:self-start">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Submitting
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

export default ReviewForm;
