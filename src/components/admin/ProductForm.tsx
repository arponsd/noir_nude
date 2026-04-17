"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import ChipInput from "@/components/admin/ChipInput";
import CloudinaryUploader from "@/components/admin/CloudinaryUploader";
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
import { useToast } from "@/hooks/use-toast";
import { BADGES, SKIN_TYPES, formatBDT, type Badge, type SkinType } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types/api/categories";
import type { ProductDetail } from "@/types/api/products";

const imageSchema = z.object({
  url: z.string().url().max(2048),
  alt: z.string().trim().max(200).default(""),
  order: z.number().int().min(0).max(1000).default(0),
});

const variantSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    sku: z.string().trim().min(1).max(64),
    price: z.coerce.number().int().positive(),
    comparePrice: z.union([z.coerce.number().int().nonnegative(), z.literal("")]).optional(),
    stock: z.coerce.number().int().min(0).default(0),
    reservedStock: z.coerce.number().int().min(0).default(0),
    image: z.union([z.string().url(), z.literal("")]).optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (v) =>
      v.comparePrice === undefined || v.comparePrice === "" || Number(v.comparePrice) >= v.price,
    {
      message: "comparePrice must be >= price",
      path: ["comparePrice"],
    },
  );

const formSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(120)
      .optional()
      .refine((v) => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), "Invalid slug"),
    description: z.string().trim().min(10),
    shortDescription: z.string().trim().max(280).optional(),
    categoryId: z.string().min(1, "Category is required"),
    brand: z.string().trim().min(1).max(120),
    basePrice: z.coerce.number().int().positive(),
    comparePrice: z.union([z.coerce.number().int().nonnegative(), z.literal("")]).optional(),
    ingredients: z.array(z.string()).default([]),
    allergens: z.array(z.string()).default([]),
    skinTypes: z.array(z.enum(SKIN_TYPES)).default([]),
    badges: z.array(z.enum(BADGES)).default([]),
    tags: z.array(z.string()).default([]),
    images: z.array(imageSchema).min(1, "At least one image is required"),
    variants: z.array(variantSchema).min(1, "At least one variant is required"),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine(
    (d) =>
      d.comparePrice === undefined ||
      d.comparePrice === "" ||
      Number(d.comparePrice) >= d.basePrice,
    { message: "comparePrice must be >= basePrice", path: ["comparePrice"] },
  );

type FormValues = z.infer<typeof formSchema>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

function toFormDefaults(
  product: ProductDetail | undefined,
  fallbackCategoryId: string | null,
): FormValues {
  if (!product) {
    return {
      name: "",
      slug: "",
      description: "",
      shortDescription: "",
      categoryId: fallbackCategoryId ?? "",
      brand: "",
      basePrice: 0,
      comparePrice: "",
      ingredients: [],
      allergens: [],
      skinTypes: [],
      badges: [],
      tags: [],
      images: [],
      variants: [
        {
          name: "Default",
          sku: "",
          price: 0,
          comparePrice: "",
          stock: 0,
          reservedStock: 0,
          image: "",
          isActive: true,
        },
      ],
      isFeatured: false,
      isActive: true,
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription ?? "",
    categoryId: product.category ? (fallbackCategoryId ?? "") : "",
    brand: product.brand,
    basePrice: product.basePrice,
    comparePrice: product.comparePrice ?? "",
    ingredients: product.ingredients,
    allergens: product.allergens,
    skinTypes: (product.skinTypes as SkinType[]) ?? [],
    badges: (product.badges as Badge[]) ?? [],
    tags: product.tags,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt, order: i.order })),
    variants: product.fullVariants.map((v) => ({
      name: v.name,
      sku: v.sku,
      price: v.price,
      comparePrice: v.comparePrice ?? "",
      stock: v.stock,
      reservedStock: v.reservedStock,
      image: v.image ?? "",
      isActive: v.isActive,
    })),
    isFeatured: product.isFeatured,
    isActive: true,
  };
}

export interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialProduct?: ProductDetail;
  categories: Category[];
  initialCategoryId?: string;
}

export default function ProductForm({
  mode,
  productId,
  initialProduct,
  categories,
  initialCategoryId,
}: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaults = React.useMemo(() => {
    const base = toFormDefaults(initialProduct, initialCategoryId ?? null);
    if (initialProduct?.category) {
      const match = categories.find((c) => c.slug === initialProduct.category!.slug);
      if (match) base.categoryId = match.id;
    }
    return base;
  }, [initialProduct, categories, initialCategoryId]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const watchedName = watch("name");
  const watchedImages = watch("images");
  const watchedBasePrice = watch("basePrice");
  const watchedIngredients = watch("ingredients");
  const watchedAllergens = watch("allergens");
  const watchedTags = watch("tags");
  const watchedBadges = watch("badges");
  const watchedSkinTypes = watch("skinTypes");
  const watchedSlug = watch("slug");
  const watchedCategoryId = watch("categoryId");
  const watchedIsFeatured = watch("isFeatured");
  const watchedIsActive = watch("isActive");

  // Auto-slug when creating and user hasn't touched slug.
  React.useEffect(() => {
    if (mode === "create" && (!watchedSlug || watchedSlug.length === 0) && watchedName) {
      setValue("slug", slugify(watchedName), { shouldDirty: false });
    }
  }, [mode, watchedName, watchedSlug, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      brand: data.brand,
      basePrice: data.basePrice,
      ingredients: data.ingredients,
      allergens: data.allergens,
      skinTypes: data.skinTypes,
      badges: data.badges,
      tags: data.tags,
      images: data.images.map((img, i) => ({ url: img.url, alt: img.alt, order: i })),
      variants: data.variants.map((v) => {
        const out: Record<string, unknown> = {
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          reservedStock: v.reservedStock,
          isActive: v.isActive,
        };
        if (v.comparePrice !== "" && v.comparePrice !== undefined)
          out.comparePrice = Number(v.comparePrice);
        if (v.image && v.image !== "") out.image = v.image;
        return out;
      }),
      isFeatured: data.isFeatured,
      isActive: data.isActive,
    };
    if (data.slug) payload.slug = data.slug;
    if (data.shortDescription && data.shortDescription.length > 0)
      payload.shortDescription = data.shortDescription;
    if (data.comparePrice !== "" && data.comparePrice !== undefined)
      payload.comparePrice = Number(data.comparePrice);

    try {
      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const json = (await res.json()) as
        | { ok: true; data: { id: string; slug: string } }
        | { ok: false; error: { code: string; message: string; details?: unknown } };
      if (!json.ok) {
        toast({
          title: "Save failed",
          description: json.error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: mode === "create" ? "Product created" : "Product updated",
        description: json.data.slug,
      });
      router.push("/admin/products");
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
      {/* Basics */}
      <section className="grid gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-xl tracking-[-0.01em]">Basics</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
            {errors.name ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.name.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" aria-invalid={Boolean(errors.slug)} {...register("slug")} />
            {errors.slug ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.slug.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" aria-invalid={Boolean(errors.brand)} {...register("brand")} />
            {errors.brand ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.brand.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select
              value={watchedCategoryId}
              onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.categoryId.message}</p>
            ) : null}
          </div>
        </div>
        <div>
          <Label htmlFor="shortDescription">Short description</Label>
          <textarea
            id="shortDescription"
            rows={2}
            {...register("shortDescription")}
            className="mt-2 flex min-h-16 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-none"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={6}
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
            className="mt-2 flex min-h-32 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-none"
          />
          {errors.description ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{errors.description.message}</p>
          ) : null}
        </div>
      </section>

      {/* Pricing */}
      <section className="grid gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-xl tracking-[-0.01em]">Pricing</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="basePrice">Base price (paisa)</Label>
            <Input
              id="basePrice"
              type="number"
              inputMode="numeric"
              aria-invalid={Boolean(errors.basePrice)}
              {...register("basePrice")}
            />
            <p className="mt-1 text-xs text-[var(--muted)] tabular-nums">
              {formatBDT(Number(watchedBasePrice) || 0)}
            </p>
            {errors.basePrice ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.basePrice.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="comparePrice">Compare price (paisa, optional)</Label>
            <Input
              id="comparePrice"
              type="number"
              inputMode="numeric"
              {...register("comparePrice")}
            />
            {errors.comparePrice ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.comparePrice.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Attributes */}
      <section className="grid gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-xl tracking-[-0.01em]">Attributes</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="ingredients">Ingredients</Label>
            <ChipInput
              id="ingredients"
              value={watchedIngredients}
              onChange={(v) => setValue("ingredients", v, { shouldValidate: true })}
            />
          </div>
          <div>
            <Label htmlFor="allergens">Allergens</Label>
            <ChipInput
              id="allergens"
              value={watchedAllergens}
              onChange={(v) => setValue("allergens", v, { shouldValidate: true })}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <ChipInput
              id="tags"
              value={watchedTags}
              onChange={(v) => setValue("tags", v, { shouldValidate: true })}
            />
          </div>
          <div>
            <Label>Skin types</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SKIN_TYPES.map((s) => {
                const checked = watchedSkinTypes.includes(s);
                return (
                  <label
                    key={s}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                      checked
                        ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                        : "border-[var(--line)] text-[var(--ink-soft)]",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? watchedSkinTypes.filter((x) => x !== s)
                          : [...watchedSkinTypes, s];
                        setValue("skinTypes", next, { shouldValidate: true });
                      }}
                    />
                    {s}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Badges</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {BADGES.map((b) => {
                const checked = watchedBadges.includes(b);
                return (
                  <label
                    key={b}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                      checked
                        ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                        : "border-[var(--line)] text-[var(--ink-soft)]",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? watchedBadges.filter((x) => x !== b)
                          : [...watchedBadges, b];
                        setValue("badges", next, { shouldValidate: true });
                      }}
                    />
                    {b}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-xl tracking-[-0.01em]">Images</h2>
        <CloudinaryUploader
          images={watchedImages}
          onChange={(next) => setValue("images", next, { shouldValidate: true })}
        />
        {errors.images ? (
          <p className="mt-1 text-xs text-[var(--danger)]">
            {errors.images.message ?? "Add at least one image."}
          </p>
        ) : null}
      </section>

      {/* Variants */}
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-[-0.01em]">Variants</h2>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              append({
                name: "",
                sku: "",
                price: watchedBasePrice || 0,
                comparePrice: "",
                stock: 0,
                reservedStock: 0,
                image: "",
                isActive: true,
              })
            }
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            Add variant
          </Button>
        </div>

        <ul className="space-y-4">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--bg)] p-4 md:grid-cols-6"
            >
              <div className="md:col-span-2">
                <Label htmlFor={`variants.${index}.name`}>Name</Label>
                <Input id={`variants.${index}.name`} {...register(`variants.${index}.name`)} />
              </div>
              <div>
                <Label htmlFor={`variants.${index}.sku`}>SKU</Label>
                <Input id={`variants.${index}.sku`} {...register(`variants.${index}.sku`)} />
              </div>
              <div>
                <Label htmlFor={`variants.${index}.price`}>Price (paisa)</Label>
                <Input
                  id={`variants.${index}.price`}
                  type="number"
                  {...register(`variants.${index}.price`)}
                />
              </div>
              <div>
                <Label htmlFor={`variants.${index}.comparePrice`}>Compare (paisa)</Label>
                <Input
                  id={`variants.${index}.comparePrice`}
                  type="number"
                  {...register(`variants.${index}.comparePrice`)}
                />
              </div>
              <div>
                <Label htmlFor={`variants.${index}.stock`}>Stock</Label>
                <Input
                  id={`variants.${index}.stock`}
                  type="number"
                  {...register(`variants.${index}.stock`)}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor={`variants.${index}.image`}>Image URL (optional)</Label>
                <Input id={`variants.${index}.image`} {...register(`variants.${index}.image`)} />
              </div>
              <div className="flex items-end gap-3 md:col-span-3">
                <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <input type="checkbox" {...register(`variants.${index}.isActive`)} />
                  Active
                </label>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(index)}
                    aria-label={`Remove variant ${index + 1}`}
                    className="ml-auto"
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {errors.variants && typeof errors.variants.message === "string" ? (
          <p className="text-xs text-[var(--danger)]">{errors.variants.message}</p>
        ) : null}
      </section>

      {/* Flags */}
      <section className="flex flex-wrap items-center gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <label className="flex items-center gap-3 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={watchedIsFeatured}
            onChange={(e) => setValue("isFeatured", e.target.checked)}
          />
          Featured on homepage
        </label>
        <label className="flex items-center gap-3 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={watchedIsActive}
            onChange={(e) => setValue("isActive", e.target.checked)}
          />
          Active
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
          ) : null}
          {mode === "create" ? "Create product" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
