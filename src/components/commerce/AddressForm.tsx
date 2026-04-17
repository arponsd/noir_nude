"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import type { AddressInput } from "@/types/api/address";
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
import { cn } from "@/lib/utils/cn";

// TODO: swap to imported schema when backend lands: `import { addressInputSchema } from "@/lib/validators/commerce";`
const fallbackAddressSchema = z.object({
  label: z.enum(["home", "office", "other"]),
  recipientName: z.string().min(2, "Enter recipient name").max(80),
  phone: z
    .string()
    .min(6, "Enter a valid phone")
    .max(20)
    .regex(/^[+0-9\s-]+$/, "Digits, spaces, + and - only"),
  addressLine1: z.string().min(3, "Address line 1 is required").max(120),
  addressLine2: z.string().max(120).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(60),
  district: z.string().min(2, "District is required").max(60),
  postalCode: z
    .string()
    .min(3, "Postal code is required")
    .max(12)
    .regex(/^[A-Za-z0-9\s-]+$/, "Invalid postal code"),
  country: z.string().min(2).max(2),
});

export type AddressFormValues = z.infer<typeof fallbackAddressSchema>;

export interface AddressFormProps {
  onSubmit: (values: AddressInput) => Promise<void> | void;
  defaultValues?: Partial<AddressFormValues>;
  submitLabel?: string;
  className?: string;
}

const DEFAULTS: AddressFormValues = {
  label: "home",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  postalCode: "",
  country: "BD",
};

export default function AddressForm({
  onSubmit,
  defaultValues,
  submitLabel = "Save address",
  className,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(fallbackAddressSchema),
    defaultValues: { ...DEFAULTS, ...defaultValues },
  });

  const submit = handleSubmit(async (values) => {
    const payload: AddressInput = {
      label: values.label,
      recipientName: values.recipientName,
      phone: values.phone,
      addressLine1: values.addressLine1,
      ...(values.addressLine2 ? { addressLine2: values.addressLine2 } : {}),
      city: values.city,
      district: values.district,
      postalCode: values.postalCode,
      country: values.country,
    };
    await onSubmit(payload);
  });

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-6", className)}>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Label" htmlFor="addr-label" error={errors.label?.message}>
          <Controller
            control={control}
            name="label"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="addr-label" aria-invalid={errors.label ? true : undefined}>
                  <SelectValue placeholder="Select label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Recipient name"
          htmlFor="addr-recipient"
          error={errors.recipientName?.message}
        >
          <Input
            id="addr-recipient"
            autoComplete="name"
            aria-invalid={errors.recipientName ? true : undefined}
            {...register("recipientName")}
          />
        </Field>

        <Field label="Phone" htmlFor="addr-phone" error={errors.phone?.message}>
          <Input
            id="addr-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+8801XXXXXXXXX"
            aria-invalid={errors.phone ? true : undefined}
            {...register("phone")}
          />
        </Field>

        <Field label="Country" htmlFor="addr-country" error={errors.country?.message}>
          <Input
            id="addr-country"
            readOnly
            aria-readonly
            autoComplete="country"
            {...register("country")}
          />
        </Field>

        <Field
          label="Address line 1"
          htmlFor="addr-line1"
          error={errors.addressLine1?.message}
          fullWidth
        >
          <Input
            id="addr-line1"
            autoComplete="address-line1"
            aria-invalid={errors.addressLine1 ? true : undefined}
            {...register("addressLine1")}
          />
        </Field>

        <Field
          label="Address line 2 (optional)"
          htmlFor="addr-line2"
          error={errors.addressLine2?.message}
          fullWidth
        >
          <Input id="addr-line2" autoComplete="address-line2" {...register("addressLine2")} />
        </Field>

        <Field label="City" htmlFor="addr-city" error={errors.city?.message}>
          <Input
            id="addr-city"
            autoComplete="address-level2"
            aria-invalid={errors.city ? true : undefined}
            {...register("city")}
          />
        </Field>

        <Field label="District" htmlFor="addr-district" error={errors.district?.message}>
          <Input
            id="addr-district"
            autoComplete="address-level1"
            aria-invalid={errors.district ? true : undefined}
            {...register("district")}
          />
        </Field>

        <Field label="Postal code" htmlFor="addr-postal" error={errors.postalCode?.message}>
          <Input
            id="addr-postal"
            autoComplete="postal-code"
            aria-invalid={errors.postalCode ? true : undefined}
            {...register("postalCode")}
          />
        </Field>
      </div>

      <Button type="submit" disabled={isSubmitting} className="sm:self-start">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Saving
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  fullWidth,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", fullWidth ? "md:col-span-2" : undefined)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" aria-live="polite" className="text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
