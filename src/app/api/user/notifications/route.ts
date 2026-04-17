// e2e: tag=account
import { NextResponse } from "next/server";
import { ok, safeRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/require-role";
import { notificationPrefsSchema } from "@/lib/validators/user";
import { updateNotificationPrefs } from "@/lib/services/profile";

export const PATCH = safeRoute(async (req: Request) => {
  const session = await requireAuth();
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = notificationPrefsSchema.parse(raw);
  const profile = await updateNotificationPrefs(session.user.id, parsed);
  return NextResponse.json(ok(profile));
});
