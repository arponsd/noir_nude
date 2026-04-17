import { describe, it, expect, vi, afterEach } from "vitest";

// GAP / MOCK: `src/emails/VerifyEmail.tsx` and `src/emails/PasswordReset.tsx` use JSX
// without importing React. Next.js' build transform adds the automatic JSX runtime,
// but vitest's default esbuild transform does not — so importing those components
// under test throws `ReferenceError: React is not defined`. We stub the email
// components + the `@react-email/render` helper so we can exercise the service's
// silent-mode code path (which is the actual contract under test). Fix belongs in
// the backend lane (add `import * as React from "react"` to the *.tsx email
// templates, or switch vitest's JSX runtime).
vi.mock("@/emails/VerifyEmail", () => ({
  VerifyEmail: (_props: unknown) => null,
  default: (_props: unknown) => null,
}));
vi.mock("@/emails/PasswordReset", () => ({
  PasswordReset: (_props: unknown) => null,
  default: (_props: unknown) => null,
}));
vi.mock("@react-email/render", () => ({
  render: async (_node: unknown) => "stubbed email body",
}));

import logger from "@/lib/utils/logger";
import { env } from "@/lib/env";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/services/email";

/**
 * Contract: when RESEND_API_KEY is missing the email service must NOT throw.
 * It must log an info-level message indicating the email was suppressed and
 * return { delivered: true, provider: "logger" }. The calling route handlers
 * rely on this to keep registration + password-reset working in dev/test
 * without creds.
 */
describe("email service silent-mode (no RESEND_API_KEY)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pre-check: env snapshot has no RESEND_API_KEY in the test environment", () => {
    expect(env.RESEND_API_KEY).toBeFalsy();
  });

  it("sendVerificationEmail resolves without throwing and logs the suppression", async () => {
    const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);

    const result = await sendVerificationEmail(
      "silent+verify@example.com",
      "a".repeat(64),
      "Silent User",
    );

    expect(result.delivered).toBe(true);
    expect(result.provider).toBe("logger");

    const suppressionCall = infoSpy.mock.calls.find((args) =>
      args.some((a) => typeof a === "string" && a.includes("email suppressed")),
    );
    expect(suppressionCall, "expected a logger.info suppression call").toBeDefined();
  });

  it("sendPasswordResetEmail resolves without throwing and logs the suppression", async () => {
    const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => logger);

    const result = await sendPasswordResetEmail(
      "silent+reset@example.com",
      "b".repeat(64),
      "Silent User",
    );

    expect(result.delivered).toBe(true);
    expect(result.provider).toBe("logger");
    expect(infoSpy).toHaveBeenCalled();
  });
});
