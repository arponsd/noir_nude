"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import ChipInput from "@/components/admin/ChipInput";
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
import { formatBDT } from "@/lib/constants";

// TODO(backend): reconcile with shared validator from `@/lib/validators/coupon`.
const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[A-Z0-9_-]+$/i, "Only letters, digits, hyphen, underscore."),
    type: z.enum(["percent", "flat", "free_shipping"]),
    value: z.coerce.number().int().nonnegative(),
    minOrderAmount: z.union([z.coerce.number().int().nonnegative(), z.literal("")]).optional(),
    maxDiscount: z.union([z.coerce.number().int().nonnegative(), z.literal("")]).optional(),
    usageLimit: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
    perUserLimit: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
    validFrom: z.string().min(1, "Required"),
    validUntil: z.string().min(1, "Required"),
    applicableCategories: z.array(z.string()).default([]),
    applicableProducts: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
  })
  .refine(
    (v) => {
      if (v.type === "percent") return v.value >= 0 && v.value <= 100;
      return true;
    },
    { path: ["value"], message: "Percent must be 0–100." },
  )
  .refine(
    (v) => {
      try {
        return new Date(v.validFrom).getTime() <= new Date(v.validUntil).getTime();
      } catch {
        return false;
      }
    },
    { path: ["validUntil"], message: "validUntil must be on/after validFrom." },
  );

type CouponFormValues = z.infer<typeof couponSchema>;

export interface CouponFormProps {
  mode: "create" | "edit";
  couponId?: string;
  initial?: Partial<CouponFormValues>;
  /** All categories, for the multi-select chip field. Frontend passes `{id,name}` objects. */
  categoryOptions?: { id: string; name: string }[];
}

const defaultsFor = (initial?: Partial<CouponFormValues>): CouponFormValues => ({
  code: initial?.code ?? "",
  type: initial?.type ?? "percent",
  value: initial?.value ?? 0,
  minOrderAmount: initial?.minOrderAmount ?? "",
  maxDiscount: initial?.maxDiscount ?? "",
  usageLimit: initial?.usageLimit ?? "",
  perUserLimit: initial?.perUserLimit ?? "",
  validFrom: initial?.validFrom ?? "",
  validUntil: initial?.validUntil ?? "",
  applicableCategories: initial?.applicableCategories ?? [],
  applicableProducts: initial?.applicableProducts ?? [],
  isActive: initial?.isActive ?? true,
});

/**
 * Create/edit form for coupons. RHF + Zod.
 * - `type` switches the `value` semantic (percent / paisa / free_shipping).
 * - multi-select category/product use `ChipInput` for minimal dependency surface;
 *   backend expects arrays of category slugs and product ids respectively.
 */
export default function CouponForm({ mode, couponId, initial, categoryOptions }: CouponFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: defaultsFor(initial),
  });

  const watchedType = watch("type");
  const watchedValue = watch("value");
  const watchedCategories = watch("applicableCategories");
  const watchedProducts = watch("applicableProducts");
  const watchedIsActive = watch("isActive");

  const valueHelper = React.useMemo(() => {
    if (watchedType === "percent") return `${Number(watchedValue) || 0}% off`;
    if (watchedType === "flat") return formatBDT(Number(watchedValue) || 0);
    return "Free shipping";
  }, [watchedType, watchedValue]);

  const onSubmit: SubmitHandler<CouponFormValues> = async (data) => {
    // TODO(backend): swap to adminUpsertCouponAction once available.
    const payload: Record<string, unknown> = {
      code: data.code.trim().toUpperCase(),
      type: data.type,
      value: data.type === "free_shipping" ? 0 : Number(data.value),
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      applicableCategories: data.applicableCategories,
      applicableProducts: data.applicableProducts,
      isActive: data.isActive,
    };
    if (data.minOrderAmount !== "" && data.minOrderAmount !== undefined)
      payload.minOrderAmount = Number(data.minOrderAmount);
    if (data.maxDiscount !== "" && data.maxDiscount !== undefined)
      payload.maxDiscount = Number(data.maxDiscount);
    if (data.usageLimit !== "" && data.usageLimit !== undefined)
      payload.usageLimit = Number(data.usageLimit);
    if (data.perUserLimit !== "" && data.perUserLimit !== undefined)
      payload.perUserLimit = Number(data.perUserLimit);

    const url = mode === "create" ? "/api/admin/coupons" : `/api/admin/coupons/${couponId}`;
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
        title: mode === "create" ? "Coupon created" : "Coupon updated",
        description: payload.code as string,
      });
      router.push("/admin/coupons");
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
      <section className="grid gap-5 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6 md:grid-cols-2">
        <div>
          <Label htmlFor="coupon-code">Code</Label>
          <Input id="coupon-code" aria-invalid={Boolean(errors.code)} {...register("code")} />
          {errors.code ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{errors.code.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="coupon-type">Type</Label>
          <Select
            value={watchedType}
            onValueChange={(v) =>
              setValue("type", v as CouponFormValues["type"], { shouldValidate: true })
            }
          >
            <SelectTrigger id="coupon-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent</SelectItem>
              <SelectItem value="flat">Flat amount</SelectItem>
              <SelectItem value="free_shipping">Free shipping</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {watchedType !== "free_shipping" ? (
          <div>
            <Label htmlFor="coupon-value">Value {watchedType === "flat" ? "(paisa)" : "(%)"}</Label>
            <Input
              id="coupon-value"
              type="number"
              inputMode="numeric"
              aria-invalid={Boolean(errors.value)}
              {...register("value")}
            />
            <p className="mt-1 text-xs text-[var(--muted)] tabular-nums">{valueHelper}</p>
            {errors.value ? (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.value.message}</p>
            ) : null}
          </div>
        ) : null}
        <div>
          <Label htmlFor="coupon-min">Min order (paisa, optional)</Label>
          <Input
            id="coupon-min"
            type="number"
            inputMode="numeric"
            {...register("minOrderAmount")}
          />
        </div>
        <div>
          <Label htmlFor="coupon-max">Max discount (paisa, optional)</Label>
          <Input id="coupon-max" type="number" inputMode="numeric" {...register("maxDiscount")} />
        </div>
        <div>
          <Label htmlFor="coupon-usage">Usage limit (optional)</Label>
          <Input id="coupon-usage" type="number" inputMode="numeric" {...register("usageLimit")} />
        </div>
        <div>
          <Label htmlFor="coupon-per-user">Per-user limit (optional)</Label>
          <Input
            id="coupon-per-user"
            type="number"
            inputMode="numeric"
            {...register("perUserLimit")}
          />
        </div>
        <div>
          <Label htmlFor="coupon-from">Valid from</Label>
          <Input
            id="coupon-from"
            type="datetime-local"
            aria-invalid={Boolean(errors.validFrom)}
            {...register("validFrom")}
          />
          {errors.validFrom ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{errors.validFrom.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="coupon-until">Valid until</Label>
          <Input
            id="coupon-until"
            type="datetime-local"
            aria-invalid={Boolean(errors.validUntil)}
            {...register("validUntil")}
          />
          {errors.validUntil ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{errors.validUntil.message}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="font-display text-lg tracking-[-0.01em]">Applicability</h2>
        <div>
          <Label>Categories (slugs — leave empty for all)</Label>
          <ChipInput
            value={watchedCategories}
            onChange={(v) => setValue("applicableCategories", v, { shouldValidate: true })}
          />
          {categoryOptions && categoryOptions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categoryOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (watchedCategories.includes(c.id)) return;
                    setValue("applicableCategories", [...watchedCategories, c.id], {
                      shouldValidate: true,
                    });
                  }}
                  className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  + {c.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <Label>Product IDs (leave empty for all)</Label>
          <ChipInput
            value={watchedProducts}
            onChange={(v) => setValue("applicableProducts", v, { shouldValidate: true })}
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6">
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
          {mode === "create" ? "Create coupon" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/coupons")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
