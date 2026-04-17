import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { env } from "@/lib/env";
import logger from "@/lib/utils/logger";
import { PasswordReset } from "@/emails/PasswordReset";
import { VerifyEmail } from "@/emails/VerifyEmail";

export type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
  text?: string;
};

export type SendEmailResult = {
  delivered: boolean;
  provider: "resend" | "logger";
  id?: string;
};

const DEFAULT_FROM = "GlowCart <noreply@glowcart.local>";

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!cachedResend) {
    cachedResend = new Resend(env.RESEND_API_KEY);
  }
  return cachedResend;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const html = await render(input.react);
  const text = input.text ?? (await render(input.react, { plainText: true }));
  const from = env.EMAIL_FROM ?? DEFAULT_FROM;
  const replyTo = env.EMAIL_REPLY_TO;

  const client = getResend();
  if (!client) {
    // reason: in dev/test without Resend credentials we log instead of silently dropping.
    logger.info(
      { to: input.to, subject: input.subject, provider: "logger", preview: text.slice(0, 200) },
      "email suppressed (RESEND_API_KEY missing) — logging only",
    );
    return { delivered: true, provider: "logger" };
  }

  const payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text: string;
    replyTo?: string[];
  } = {
    from,
    to: [input.to],
    subject: input.subject,
    html,
    text,
  };
  if (replyTo) payload.replyTo = [replyTo];

  const result = await client.emails.send(payload);
  if (result.error) {
    logger.error({ err: result.error, to: input.to }, "resend send failed");
    throw new Error("Email provider error");
  }
  return { delivered: true, provider: "resend", id: result.data?.id };
}

function appUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export async function sendVerificationEmail(
  to: string,
  rawToken: string,
  name?: string,
): Promise<SendEmailResult> {
  const verifyUrl = `${appUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
  return sendEmail({
    to,
    subject: "Verify your GlowCart email",
    react: VerifyEmail({ verifyUrl, name }),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  rawToken: string,
  name?: string,
): Promise<SendEmailResult> {
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  return sendEmail({
    to,
    subject: "Reset your GlowCart password",
    react: PasswordReset({ resetUrl, name }),
  });
}
