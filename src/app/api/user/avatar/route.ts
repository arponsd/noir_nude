// e2e: tag=account
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { checkLimit, profileLimiter } from "@/lib/rate-limit";
import { avatarUpdateSchema } from "@/lib/validators/user";
import { updateAvatar } from "@/lib/services/profile";

/**
 * Avatar write endpoint. The actual upload happens client-side via the Cloudinary signed
 * upload flow from `/api/uploads/sign`; this endpoint just persists the returned URL.
 * The service layer re-validates that the URL points to our Cloudinary host.
 */
export const POST = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  await checkLimit(profileLimiter, session.user.id);
  const raw: unknown = await req.json().catch(() => ({}));
  const { url } = avatarUpdateSchema.parse(raw);
  const profile = await updateAvatar(session.user.id, url);
  return NextResponse.json(ok(profile));
});
