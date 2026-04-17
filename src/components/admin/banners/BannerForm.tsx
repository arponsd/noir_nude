"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import CloudinaryUploader, { type UploadedImage } from "@/components/admin/CloudinaryUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// TODO(backend): reconcile with `@/lib/validators/banner` once backend ships it.
const bannerSchema = z.object({
  imageUrl: z.string().url("Image is required").max(2048),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(240).optional(),
  href: z.union([z.string().url(), z.string().regex(/^\/[^\s]*$/), z.literal("")]).optional(),
  cta: z.string().trim().max(40).optional(),
  order: z.coerce.number().int().min(0).default(0),
  publishFrom: z.string().optional(),
  publishUntil: z.string().optional(),
  isActive: z.boolean().default(true),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export interface BannerFormProps {
  mode: "create" | "edit";
  bannerId?: string;
  initial?: Partial<BannerFormValues>;
}

const defaultsFor = (initial?: Partial<BannerFormValues>): BannerFormValues => ({
  imageUrl: initial?.imageUrl ?? "",
  title: initial?.title ?? "",
  subtitle: initial?.subtitle ?? "",
  href: initial?.href ?? "",
  cta: initial?.cta ?? "",
  order: initial?.order ?? 0,
  publishFrom: initial?.publishFrom ?? "",
  publishUntil: initial?.publishUntil ?? "",
  isActive: initial?.isActive ?? true,
});

/**
 * Banner create/edit form. Reuses CloudinaryUploader in single-image mode
 * (the first uploaded image becomes `imageUrl`; extras are ignored).
 */
export default function BannerForm({ mode, bannerId, initial }: BannerFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: defaultsFor(initial),
  });

  const watchedImageUrl = watch("imageUrl");
  const watchedIsActive = watch("isActive");

  const uploaderImages = React.useMemo<UploadedImage[]>(
    () => (watchedImageUrl ? [{ url: watchedImageUrl, alt: "Banner", order: 0 }] : []),
    [watchedImageUrl],
  );

  const onUploaderChange = (next: UploadedImage[]) => {
    const first = next[0];
    setValue("imageUrl", first?.url ?? "", { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<BannerFormValues> = async (data) => {
    const payload: Record<string, unknown> = {
      imageUrl: data.imageUrl,
      title: data.title,
      order: data.order,
      isActive: data.isActive,
    };
    if (data.subtitle) payload.subtitle = data.subtitle;
    if (data.href) payload.href = data.href;
    if (data.cta) payload.cta = data.cta;
    if (data.publishFrom) payload.publishFrom = data.publishFrom;
    if (data.publishUntil) payload.publishUntil = data.publishUntil;

    const url = mode === "create" ? "/api/admin/banners" : `/api/admin/banners/${bannerId}`;
    const method = mode === "create" ? "POST" : "PATCH";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const json = (await res.json()) as
        | { ok: true; data: { id: string } }
        | { ok: false; error: { code: string; message: string } };
      if (!json.ok) {
        toast({
          title: "Save failed",
          description: json.error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: mode === "create" ? "Banner created" : "Banner updated",
        description: data.title,
      });
      router.push("/admin/banners");
      router.refresh();
    } catch (err) {
      toast({
        title: "Network error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate aria-live="polite">
      <section className="grid gap-5 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg tracking-[-0.01em]">Image</h2>
        <CloudinaryUploader images={uploaderImages} onChange={onUploaderChange} folder="banners" />
        {errors.imageUrl ? (
          <p className="text-xs text-[var(--danger)]">{errors.imageUrl.message}</p>
        ) : null}
      </section>

      <section className="grid gap-5 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6 md:grid-cols-2">
        <div>
          <Label htmlFor="banner-title">Title</Label>
          <Input id="banner-title" aria-invalid={Boolean(errors.title)} {...register("title")} />
          {errors.title ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{errors.title.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="banner-subtitle">Subtitle</Label>
          <Input id="banner-subtitle" {...register("subtitle")} />
        </div>
        <div>
          <Label htmlFor="banner-href">Link URL</Label>
          <Input id="banner-href" placeholder="/shop or https://…" {...register("href")} />
        </div>
        <div>
          <Label htmlFor="banner-cta">CTA label</Label>
          <Input id="banner-cta" placeholder="Shop now" {...register("cta")} />
        </div>
        <div>
          <Label htmlFor="banner-order">Display order</Label>
          <Input id="banner-order" type="number" inputMode="numeric" {...register("order")} />
        </div>
        <div />
        <div>
          <Label htmlFor="banner-from">Publish from (optional)</Label>
          <Input id="banner-from" type="datetime-local" {...register("publishFrom")} />
        </div>
        <div>
          <Label htmlFor="banner-until">Publish until (optional)</Label>
          <Input id="banner-until" type="datetime-local" {...register("publishUntil")} />
        </div>
      </section>

      <section className="flex items-center gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <label className="flex items-center gap-3 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={watchedIsActive}
            onChange={(e) => setValue("isActive", e.target.checked)}
          />
          Active
        </label>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
          ) : null}
          {mode === "create" ? "Create banner" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/banners")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
