import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { formatBDT } from "@/lib/constants";
import logger from "@/lib/utils/logger";
import { PasswordReset } from "@/emails/PasswordReset";
import { VerifyEmail } from "@/emails/VerifyEmail";
import { OrderPlacedEmail } from "@/emails/OrderPlacedEmail";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import { OrderDeliveredEmail } from "@/emails/OrderDeliveredEmail";
import { OrderCancelledEmail } from "@/emails/OrderCancelledEmail";
import { AccountDeletedEmail } from "@/emails/AccountDeletedEmail";
import type { OrderDetail } from "@/types/api/order";

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

/* ----------------------------------------------------------------------------
 * Order lifecycle senders.
 *
 * Each helper derives display-ready strings from the Order DTO (money via formatBDT,
 * URLs anchored to the public app origin) so the templates themselves stay presentational.
 * When RESEND_API_KEY is missing (dev/test), `sendEmail` already falls back to a logger
 * write — callers never need to guard.
 * -------------------------------------------------------------------------- */

function orderUrl(order: Pick<OrderDetail, "id">): string {
  return `${appUrl()}/account/orders/${order.id}`;
}

function reviewUrlForOrder(order: Pick<OrderDetail, "id">): string {
  return `${appUrl()}/account/orders/${order.id}/review`;
}

type OrderEmailInput = Pick<
  OrderDetail,
  "id" | "orderNumber" | "total" | "trackingNumber" | "courier"
>;

export async function sendOrderPlacedEmail(
  to: string,
  order: OrderEmailInput,
  customerName = "there",
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Order ${order.orderNumber} confirmed`,
    react: OrderPlacedEmail({
      orderNumber: order.orderNumber,
      customerName,
      total: formatBDT(order.total),
      orderUrl: orderUrl(order),
    }),
  });
}

export async function sendOrderShippedEmail(
  to: string,
  order: OrderEmailInput,
  customerName = "there",
): Promise<SendEmailResult> {
  const props: Parameters<typeof OrderShippedEmail>[0] = {
    orderNumber: order.orderNumber,
    customerName,
    orderUrl: orderUrl(order),
  };
  if (order.trackingNumber) props.trackingNumber = order.trackingNumber;
  if (order.courier) props.courier = order.courier;
  return sendEmail({
    to,
    subject: `Order ${order.orderNumber} has shipped`,
    react: OrderShippedEmail(props),
  });
}

export async function sendOrderDeliveredEmail(
  to: string,
  order: OrderEmailInput,
  customerName = "there",
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Order ${order.orderNumber} delivered`,
    react: OrderDeliveredEmail({
      orderNumber: order.orderNumber,
      customerName,
      orderUrl: orderUrl(order),
      reviewUrl: reviewUrlForOrder(order),
    }),
  });
}

export async function sendOrderCancelledEmail(
  to: string,
  order: OrderEmailInput,
  reason: string,
  customerName = "there",
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Order ${order.orderNumber} cancelled`,
    react: OrderCancelledEmail({
      orderNumber: order.orderNumber,
      customerName,
      reason,
      orderUrl: orderUrl(order),
    }),
  });
}

export async function sendAccountDeletedEmail(
  to: string,
  customerName: string,
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: "Your GlowCart account has been deleted",
    react: AccountDeletedEmail({ customerName: customerName || "there" }),
  });
}
