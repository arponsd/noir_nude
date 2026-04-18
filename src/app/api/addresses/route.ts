// e2e: tag=commerce
// CSRF: enforcement is middleware-driven once routes opt in via requireCsrf();
// see src/middleware.ts + src/lib/csrf/index.ts. Phase 7 ships cookie issuance
// + opt-in helper; enforcement across /api/** is the Phase 8 migration step.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { addressLimiter, checkLimit } from "@/lib/rate-limit";
import { addressInputSchema } from "@/lib/validators/commerce";
import { createAddress, listAddresses } from "@/lib/services/address";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async () => {
  const session = await requireAuth();
  const addresses = await listAddresses(session.user.id);
  return NextResponse.json(ok(addresses));
});

export const POST = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(addressLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = addressInputSchema.parse(raw);
  const address = await createAddress(session.user.id, parsed);
  return NextResponse.json(ok(address), { status: 201 });
});
