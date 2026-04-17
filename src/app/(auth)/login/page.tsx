"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { googleSignInAction, loginAction } from "../actions";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);

  const callbackUrl = params.get("next") ?? params.get("callbackUrl") ?? "/account";
  const resetFlag = params.get("reset") === "1";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  React.useEffect(() => {
    if (resetFlag) {
      toast({
        title: "Password reset",
        description: "Your password has been updated. Sign in to continue.",
      });
    }
  }, [resetFlag, toast]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await loginAction({
      email: values.email,
      password: values.password,
      callbackUrl,
    });
    if (!result.ok) {
      toast({
        title: "Sign in failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    router.push(result.redirectTo);
    router.refresh();
  });

  async function handleGoogle() {
    try {
      await googleSignInAction(callbackUrl);
    } catch {
      toast({
        title: "Sign in failed",
        description: "Could not start Google sign-in. Try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Welcome back</h1>
        <p className="text-sm text-[var(--ink-soft)]">Sign in to continue to your account.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" role="alert" className="text-xs text-[var(--danger)]">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs tracking-[0.04em] text-[var(--accent)] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border-[var(--line)] text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          />
          Remember me
        </label>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="relative text-center">
        <span className="relative z-10 bg-[var(--bg)] px-3 text-xs tracking-[0.08em] text-[var(--muted)] uppercase">
          or
        </span>
        <span className="absolute inset-x-0 top-1/2 -z-0 block h-px bg-[var(--line)]" aria-hidden />
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogle}
        className="w-full"
        aria-label="Sign in with Google"
      >
        <GoogleIcon />
        Sign in with Google
      </Button>

      <p className="text-center text-sm text-[var(--ink-soft)]">
        New to Cosmetic?{" "}
        <Link
          href="/register"
          className="text-[var(--accent)] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
