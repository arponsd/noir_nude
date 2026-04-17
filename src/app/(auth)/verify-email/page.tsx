"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailSchema } from "@/lib/validators/auth";

type Status = "loading" | "success" | "error" | "invalid";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = React.useState<Status>("loading");
  const [message, setMessage] = React.useState<string>("");

  React.useEffect(() => {
    const parsed = verifyEmailSchema.shape.token.safeParse(token);
    if (!parsed.success) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = (await res.json().catch(() => null)) as
          | { ok: true; data: unknown }
          | { ok: false; error: { code: string; message: string } }
          | null;
        if (cancelled) return;
        if (res.ok && body?.ok === true) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(
            body && body.ok === false
              ? body.error.message
              : "We couldn't verify this link. It may have expired.",
          );
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Network error. Try the link again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-8 animate-spin text-[var(--accent)]" strokeWidth={1.5} />
        <p className="text-sm text-[var(--ink-soft)]">Verifying your email…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <CheckCircle2 className="size-10 text-[var(--success)]" strokeWidth={1.5} />
        <div className="space-y-2">
          <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
            Email verified
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Your account is ready. Sign in to continue.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Continue to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <XCircle className="size-10 text-[var(--danger)]" strokeWidth={1.5} />
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">
          Verification failed
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          {status === "invalid"
            ? "This verification link is missing or malformed."
            : message || "This link is no longer valid."}
        </p>
      </div>
      <Button asChild variant="secondary" className="w-full">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
