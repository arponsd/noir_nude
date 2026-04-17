"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
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
import { SKIN_TYPES, type SkinType } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { AvatarUploader } from "./AvatarUploader";
import type { ProfileFormValues } from "./types";

// TODO import when backend lands: `import { profileUpdateSchema } from "@/lib/validators/user";`
const fallbackProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\+?[1-9]\d{1,14}$/.test(v), {
      message: "Phone must be in E.164 format (e.g. +8801XXXXXXXXX)",
    }),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: "Invalid date" }),
  skinType: z.enum(SKIN_TYPES).optional(),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
});

type ProfileFormSchemaValues = z.infer<typeof fallbackProfileSchema>;

export interface ProfileFormProps {
  onSubmit: (values: ProfileFormValues) => Promise<void> | void;
  defaultValues?: Partial<ProfileFormValues>;
  submitLabel?: string;
  className?: string;
}

export function ProfileForm({
  onSubmit,
  defaultValues,
  submitLabel = "Save changes",
  className,
}: ProfileFormProps) {
  const [asyncStatus, setAsyncStatus] = React.useState<string | null>(null);
  const [asyncError, setAsyncError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormSchemaValues>({
    resolver: zodResolver(fallbackProfileSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      dateOfBirth: defaultValues?.dateOfBirth ?? "",
      skinType: defaultValues?.skinType,
      avatarUrl: defaultValues?.avatarUrl ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    setAsyncError(null);
    setAsyncStatus("Saving…");
    try {
      const payload: ProfileFormValues = {
        name: values.name,
        ...(values.phone ? { phone: values.phone } : {}),
        ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
        ...(values.skinType ? { skinType: values.skinType } : {}),
        ...(values.avatarUrl ? { avatarUrl: values.avatarUrl } : {}),
      };
      await onSubmit(payload);
      setAsyncStatus("Profile updated.");
    } catch (e) {
      setAsyncError(e instanceof Error ? e.message : "Could not save profile.");
      setAsyncStatus(null);
    }
  });

  return (
    <form onSubmit={submit} noValidate className={cn("flex flex-col gap-6", className)}>
      <Controller
        control={control}
        name="avatarUrl"
        render={({ field }) => (
          <AvatarUploader
            value={field.value || null}
            name={defaultValues?.name}
            onChange={(url) => field.onChange(url ?? "")}
          />
        )}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Name" htmlFor="profile-name" error={errors.name?.message}>
          <Input
            id="profile-name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
        </Field>

        <Field label="Phone" htmlFor="profile-phone" error={errors.phone?.message}>
          <Input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+8801XXXXXXXXX"
            aria-invalid={errors.phone ? true : undefined}
            {...register("phone")}
          />
        </Field>

        <Field label="Date of birth" htmlFor="profile-dob" error={errors.dateOfBirth?.message}>
          <Input
            id="profile-dob"
            type="date"
            autoComplete="bday"
            aria-invalid={errors.dateOfBirth ? true : undefined}
            {...register("dateOfBirth")}
          />
        </Field>

        <Field label="Skin type" htmlFor="profile-skin-type" error={errors.skinType?.message}>
          <Controller
            control={control}
            name="skinType"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v as SkinType)}
              >
                <SelectTrigger id="profile-skin-type">
                  <SelectValue placeholder="Select skin type" />
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
        </Field>
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
            <Loader2 className="size-4 animate-spin" aria-hidden /> Saving
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
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
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

export default ProfileForm;
