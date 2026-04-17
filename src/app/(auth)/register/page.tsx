"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

type ZxcvbnResult = {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: { warning: string; suggestions: string[] };
};
type ZxcvbnFn = (password: string) => ZxcvbnResult;

export default function RegisterPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  const [strength, setStrength] = React.useState<ZxcvbnResult | null>(null);
  const zxcvbnRef = React.useRef<ZxcvbnFn | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", referralCode: "" },
  });

  const password = watch("password");

  React.useEffect(() => {
    let cancelled = false;
    async function evaluate() {
      if (!password) {
        setStrength(null);
        return;
      }
      if (!zxcvbnRef.current) {
        const mod = await import("zxcvbn");
        zxcvbnRef.current = (mod.default ?? mod) as unknown as ZxcvbnFn;
      }
      if (!cancelled && zxcvbnRef.current) {
        setStrength(zxcvbnRef.current(password));
      }
    }
    void evaluate();
    return () => {
      cancelled = true;
    };
  }, [password]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: RegisterInput = {
      name: values.name,
      email: values.email,
      password: values.password,
      ...(values.referralCode ? { referralCode: values.referralCode } : {}),
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; data: { email: string } }
        | { ok: false; error: { code: string; message: string } }
        | null;

      if (!res.ok || !body || body.ok !== true) {
        const message =
          body && body.ok === false ? body.error.message : "Could not create account.";
        toast({ title: "Sign up failed", description: message, variant: "destructive" });
        return;
      }
      setSubmitted(body.data.email);
    } catch {
      toast({
        title: "Network error",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  });

  if (submitted) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
          Check your email
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          We sent a verification link to <strong className="text-[var(--ink)]">{submitted}</strong>.
          Click the link to activate your account.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
          Create account
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">Join Cosmetic in under a minute.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="name-error" role="alert" className="text-xs text-[var(--danger)]">
              {errors.name.message}
            </p>
          ) : null}
        </div>

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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? "password-error" : strength ? "password-strength" : undefined
              }
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
          {strength ? <PasswordStrength result={strength} /> : null}
          {errors.password ? (
            <p id="password-error" role="alert" className="text-xs text-[var(--danger)]">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="referralCode">Referral code (optional)</Label>
          <Input
            id="referralCode"
            type="text"
            autoComplete="off"
            aria-invalid={errors.referralCode ? true : undefined}
            aria-describedby={errors.referralCode ? "referral-error" : undefined}
            {...register("referralCode")}
          />
          {errors.referralCode ? (
            <p id="referral-error" role="alert" className="text-xs text-[var(--danger)]">
              {errors.referralCode.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--ink-soft)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--accent)] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function PasswordStrength({ result }: { result: ZxcvbnResult }) {
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;
  const colors = [
    "bg-[var(--danger)]",
    "bg-[var(--danger)]",
    "bg-[var(--warn)]",
    "bg-[var(--success)]",
    "bg-[var(--success)]",
  ] as const;
  return (
    <div id="password-strength" className="mt-1 flex flex-col gap-1.5" aria-live="polite">
      <div className="flex h-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={
              "h-full flex-1 rounded-full " +
              (i < result.score ? colors[result.score] : "bg-[var(--line)]")
            }
          />
        ))}
      </div>
      <p className="text-xs text-[var(--ink-soft)]">
        Strength: <span className="text-[var(--ink)]">{labels[result.score]}</span>
        {result.feedback.warning ? (
          <span className="text-[var(--muted)]"> — {result.feedback.warning}</span>
        ) : null}
      </p>
    </div>
  );
}
