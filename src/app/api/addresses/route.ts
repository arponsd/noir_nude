// e2e: tag=commerce
// TODO(security): enforce x-csrf-token double-submit once middleware is wired into /api/**.
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
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
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = addressInputSchema.parse(raw);
  const address = await createAddress(session.user.id, parsed);
  return NextResponse.json(ok(address), { status: 201 });
});
