// e2e: tag=account
import { safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { getUserDataExport } from "@/lib/services/account";

/**
 * GDPR right-to-access export. Returns the payload as an application/json attachment
 * so browsers trigger a download flow rather than render the blob inline.
 */
export const GET = safeRoute(async () => {
  const session = await requireAuth();
  const { filename, payload } = await getUserDataExport(session.user.id);
  const body = JSON.stringify(payload, null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // reason: exports contain PII; never cache at the edge or in shared proxies.
      "Cache-Control": "private, no-store",
    },
  });
});
