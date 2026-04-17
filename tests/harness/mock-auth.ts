import { vi } from "vitest";
import type { Session } from "next-auth";
import type { UserRole } from "@/lib/constants";

/**
 * Shared in-memory session state used by `vi.mock("@/lib/auth", ...)`.
 *
 * Tests adjust the mock session via `setMockSession({ role, userId, email, name })`
 * or clear it with `clearMockSession()` to simulate an anonymous visitor.
 *
 * NOTE: the test file must top-level call `installAuthMock()` BEFORE any
 * `import` that transitively loads `@/lib/auth`. Vitest hoists `vi.mock`, so
 * the clean pattern is:
 *
 *   import { installAuthMock, setMockSession } from "../../harness/mock-auth";
 *   installAuthMock();
 *   // ...then import route handlers etc.
 */

type SessionOverrides = {
  userId?: string;
  role?: UserRole;
  email?: string;
  name?: string;
};

type MockSessionState = {
  session: Session | null;
};

const state: MockSessionState = { session: null };

export function setMockSession(overrides: SessionOverrides = {}): Session {
  const userId = overrides.userId ?? "507f1f77bcf86cd799439011";
  const role: UserRole = overrides.role ?? "admin";
  const email = overrides.email ?? `mock+${role}@example.com`;
  const name = overrides.name ?? `Mock ${role}`;
  const session = {
    user: {
      id: userId,
      email,
      name,
      role,
    },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  } as unknown as Session;
  state.session = session;
  return session;
}

export function clearMockSession(): void {
  state.session = null;
}

export function currentMockSession(): Session | null {
  return state.session;
}

/**
 * Install `vi.mock("@/lib/auth", ...)` such that `auth()` returns the current
 * session held in `state`. This must be called at the top of a test file,
 * before importing any module that references `@/lib/auth`.
 *
 * We do the hoist by passing the factory inline; Vitest hoists `vi.mock` to
 * the top of the transformed file, so the resolution always wins.
 */
export function installAuthMock(): void {
  vi.mock("@/lib/auth", () => ({
    auth: async () => state.session,
    handlers: { GET: async () => new Response(), POST: async () => new Response() },
    signIn: async () => undefined,
    signOut: async () => undefined,
  }));
}
