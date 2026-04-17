"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginActionResult = { ok: true; redirectTo: string } | { ok: false; error: string };

/**
 * Server action that authenticates via Credentials. We use `redirect: false` so the
 * action can return a typed result to the client form (error toast, field state) and
 * the client performs the redirect after a successful sign-in.
 */
export async function loginAction(input: {
  email: string;
  password: string;
  callbackUrl?: string;
}): Promise<LoginActionResult> {
  const target = sanitizeCallback(input.callbackUrl) ?? "/account";
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });
    return { ok: true, redirectTo: target };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Invalid credentials" };
    }
    throw err;
  }
}

export async function googleSignInAction(callbackUrl?: string): Promise<void> {
  const target = sanitizeCallback(callbackUrl) ?? "/account";
  await signIn("google", { redirectTo: target });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

/** Only allow same-origin relative paths as redirect targets. */
function sanitizeCallback(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
