// e2e: tag=account
// CSRF: enforcement opt-in via requireCsrf() (Phase 8 migration).
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { checkLimit, profileLimiter } from "@/lib/rate-limit";
import { profileUpdateSchema } from "@/lib/validators/user";
import { getProfile, updateProfile } from "@/lib/services/profile";

export const dynamic = "force-dynamic";

export const GET = safeRoute(async () => {
  const session = await requireAuth();
  const profile = await getProfile(session.user.id);
  return NextResponse.json(ok(profile));
});

export const PATCH = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(profileLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = profileUpdateSchema.parse(raw);
  const profile = await updateProfile(session.user.id, parsed);
  return NextResponse.json(ok(profile));
});
