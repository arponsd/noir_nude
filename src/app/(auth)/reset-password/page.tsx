"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { resetPasswordSchema } from "@/lib/validators/auth";

const clientSchema = z
  .object({
    password: z.string().min(10).max(256),
    confirm: z.string().min(1),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ClientInput = z.infer<typeof clientSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);

  const token = params.get("token") ?? "";
  const tokenValid = resetPasswordSchema.shape.token.safeParse(token).success;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; data: unknown }
        | { ok: false; error: { code: string; message: string } }
        | null;
      if (!res.ok || !body || body.ok !== true) {
        const message =
          body && body.ok === false
            ? body.error.message
            : "Could not reset password. The link may have expired.";
        toast({ title: "Reset failed", description: message, variant: "destructive" });
        return;
      }
      router.push("/login?reset=1");
    } catch {
      toast({
        title: "Network error",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  });

  if (!tokenValid) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Invalid link</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          This reset link is missing or malformed. Request a new one to continue.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
          Set a new password
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          Choose a password with at least 10 characters.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-0 -translate-y-1/2 p-2 text-[var(--ink-soft)] hover:text-[var(--ink)] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" strokeWidth={1.5} />
              ) : (
                <Eye className="size-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" role="alert" className="text-xs text-[var(--danger)]">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={errors.confirm ? true : undefined}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            {...register("confirm")}
          />
          {errors.confirm ? (
            <p id="confirm-error" role="alert" className="text-xs text-[var(--danger)]">
              {errors.confirm.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}
