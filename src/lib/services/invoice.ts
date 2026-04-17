import { formatBDT } from "@/lib/constants";
import type { OrderDetail } from "@/types/api/order";

/**
 * Invoice rendering.
 *
 * MVP stub: returns a plain-text representation of the order wrapped as a Buffer so the route
 * handler can stream it. The handler returns `application/pdf` with a filename header — even
 * though the bytes are text, this keeps the URL and caller contract stable.
 *
 * TODO: wire pdfkit/puppeteer in Phase 7 and replace `renderOrderInvoicePdf` with a real PDF.
 * See `docs/17-tasks.md` phase-7 backlog. Do not inline an HTML-to-PDF dependency earlier — the
 * DX/serverless tradeoff for pdfkit vs puppeteer needs a devops call first.
 */
export async function renderOrderInvoicePdf(order: OrderDetail): Promise<Buffer> {
  const lines: string[] = [];
  lines.push(`INVOICE — ${order.orderNumber}`);
  lines.push(`Placed: ${order.placedAt}`);
  lines.push(`Status: ${order.orderStatus} (payment: ${order.paymentStatus})`);
  lines.push("");
  lines.push("Ship to:");
  lines.push(`  ${order.shippingAddress.recipientName}`);
  lines.push(`  ${order.shippingAddress.addressLine1}`);
  if (order.shippingAddress.addressLine2) {
    lines.push(`  ${order.shippingAddress.addressLine2}`);
  }
  lines.push(
    `  ${order.shippingAddress.city}, ${order.shippingAddress.district} ${order.shippingAddress.postalCode}`,
  );
  lines.push(`  ${order.shippingAddress.country}`);
  lines.push(`  ${order.shippingAddress.phone}`);
  lines.push("");
  lines.push("Items:");
  for (const it of order.items) {
    lines.push(
      `  ${it.quantity} x ${it.name} (${it.sku}) — ${formatBDT(it.price)} = ${formatBDT(it.subtotal)}`,
    );
  }
  lines.push("");
  lines.push(`Subtotal:  ${formatBDT(order.subtotal)}`);
  lines.push(`Discount:  -${formatBDT(order.discount)}`);
  lines.push(`Shipping:  ${formatBDT(order.shippingFee)}`);
  lines.push(`Tax:       ${formatBDT(order.tax)}`);
  lines.push(`TOTAL:     ${formatBDT(order.total)}`);
  if (order.couponCode) lines.push(`Coupon:    ${order.couponCode}`);
  lines.push("");
  lines.push("Thank you for shopping with GlowCart.");
  lines.push("");
  lines.push("--- PDF RENDER STUB ---");
  lines.push("TODO: Phase 7 replaces this with pdfkit/puppeteer output.");

  return Buffer.from(lines.join("\n"), "utf8");
}
