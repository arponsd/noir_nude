// E2E auth spec.
//
// Runtime requirements (NOT enforced by this file):
//  - A dev server running on PLAYWRIGHT_BASE_URL (playwright.config.ts starts `pnpm dev`).
//  - That dev server must be pointed at a MongoDB the test harness can also reach
//    (same MONGODB_URI / MONGODB_DB). In CI we run against a preview deploy with a
//    dedicated test database; locally the developer wires `.env.local` to an Atlas
//    test cluster or `mongodb-memory-server` started out-of-band.
//
// The seedUser helper imports Mongoose models directly, so the Node process running
// Playwright connects to the same DB as the Next.js server. If these diverge the
// seeded user will not be visible to the login form.

import { expect, test } from "@playwright/test";
import { seedUser } from "../harness/seed";
import { loginViaCredentials } from "../harness/auth-cookie";
import { disconnectTestDb } from "../harness/db";

const VERIFIED = {
  email: "playwright+verified@example.com",
  password: "Zx!9aQpm.Vr34K",
  name: "Playwright Verified",
};

test.afterAll(async () => {
  await disconnectTestDb();
});

test("@auth register shows the check-your-email confirmation", async ({ page }) => {
  const freshEmail = `playwright+new-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Fresh Playwright");
  await page.getByLabel("Email").fill(freshEmail);
  await page.getByLabel("Password", { exact: true }).fill("Zx!9aQpm.Vr34K");
  await page.getByRole("button", { name: /create account/i }).click();

  // Confirmation screen replaces the form.
  await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
  await expect(page.getByText(freshEmail)).toBeVisible();
});

test("@auth login redirects verified user to /account with their name in view", async ({
  page,
}) => {
  await seedUser({ ...VERIFIED, emailVerified: true });

  await loginViaCredentials(page, {
    email: VERIFIED.email,
    password: VERIFIED.password,
  });

  await page.waitForURL("**/account", { timeout: 10_000 });
  expect(page.url()).toContain("/account");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(VERIFIED.name);
});

test("@auth sign out from the account sidebar returns the user to / or /login", async ({
  page,
}) => {
  await seedUser({ ...VERIFIED, emailVerified: true });

  await loginViaCredentials(page, {
    email: VERIFIED.email,
    password: VERIFIED.password,
  });
  await page.waitForURL("**/account");

  await page.getByRole("button", { name: /sign out/i }).click();

  await page.waitForURL(
    (url) => {
      const path = url.pathname;
      return path === "/" || path.startsWith("/login");
    },
    { timeout: 10_000 },
  );
});

test("@auth login with wrong password shows an error toast and stays on /login", async ({
  page,
}) => {
  await seedUser({ ...VERIFIED, emailVerified: true });

  await loginViaCredentials(page, {
    email: VERIFIED.email,
    password: "wrong-wrong-wrong",
  });

  // Toast uses role="status" via Radix; the title "Sign in failed" must be visible.
  await expect(page.getByText(/sign in failed/i)).toBeVisible({ timeout: 5_000 });
  expect(page.url()).toContain("/login");
});

test("@auth unauthenticated visit to /account redirects to /login?next=/account", async ({
  page,
}) => {
  // Fresh context — no cookies.
  await page.context().clearCookies();
  await page.goto("/account");
  await page.waitForURL(/\/login\?.*next=/, { timeout: 10_000 });
  const url = new URL(page.url());
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("next")).toBe("/account");
});
