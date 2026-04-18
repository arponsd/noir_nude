// e2e: tag=account
// CSRF: enforcement opt-in via requireCsrf() (Phase 8 migration). Middleware
// now issues the csrf-token cookie for every response.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { checkLimit, profileLimiter } from "@/lib/rate-limit";
import { deleteAccountSchema } from "@/lib/validators/user";
import { deleteUserAccount } from "@/lib/services/account";

/**
 * GDPR account delete. The confirmation literal (`"DELETE MY ACCOUNT"`) is enforced at
 * the Zod schema level — requests without it are rejected with 400 before any work
 * happens. The cascade transaction runs inside the service. Client-side is responsible
 * for calling signOut() and redirecting after a 200.
 */
export const DELETE = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(profileLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  deleteAccountSchema.parse(raw);
  const result = await deleteUserAccount(session.user.id);
  return NextResponse.json(ok(result));
});
