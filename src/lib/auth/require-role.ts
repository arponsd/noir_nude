import type { Session } from "next-auth";
import { auth } from "./index";
import { AuthError, ForbiddenError } from "@/lib/api/response";
import { ERROR_CODES, type UserRole } from "@/lib/constants";

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new AuthError("Authentication required", ERROR_CODES.UNAUTHORIZED);
  }
  return session;
}

export async function requireRole(roles: UserRole | readonly UserRole[]): Promise<Session> {
  const session = await requireAuth();
  const allowed = Array.isArray(roles) ? roles : [roles as UserRole];
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError("Insufficient permissions", ERROR_CODES.FORBIDDEN);
  }
  return session;
}
