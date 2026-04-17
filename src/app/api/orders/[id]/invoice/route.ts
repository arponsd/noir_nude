// e2e: tag=commerce
import { NextResponse } from "next/server";
import { fail, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { ERROR_CODES } from "@/lib/constants";
import { objectIdRouteParamsSchema } from "@/lib/utils/object-id";
import { getUserOrder } from "@/lib/services/order";
import { renderOrderInvoicePdf } from "@/lib/services/invoice";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Invoice download. Phase 7 swaps the text stub for real PDF bytes (see
 * `src/lib/services/invoice.ts`). Until then we still advertise
 * `application/pdf` + attachment disposition so the UI link behaves correctly,
 * and downstream users can diff against the text payload for MVP.
 */
export const GET = safeRoute(async (_req: Request, context: RouteContext) => {
  const session = await requireAuth();
  const { id } = objectIdRouteParamsSchema.parse(await context.params);
  const order = await getUserOrder(session.user.id, id);
  if (!order) {
    return NextResponse.json(fail(ERROR_CODES.NOT_FOUND, "Order not found"), { status: 404 });
  }

  const bytes = await renderOrderInvoicePdf(order);
  // reason: lib.dom's BodyInit doesn't include Node's Buffer or Uint8Array directly in
  // this TS config. Wrap in a Blob which is a first-class BodyInit member and survives
  // the switch to real PDF bytes in Phase 7 without further type gymnastics.
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});
