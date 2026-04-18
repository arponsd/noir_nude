// Admin accessibility spot-checks.
//
// Tag: @admin-a11y. Walks the admin surface area and runs @axe-core/playwright
// on each page; fails only on serious or critical violations (see helpers/axe.ts).
//
// Runtime requirements
// --------------------
// - Next.js server running at PLAYWRIGHT_BASE_URL.
// - MongoDB reachable by the server *and* by the harness (same MONGODB_URI).
// - Admin fixture user seeded by `tests/e2e/global-setup.ts`.
//
// If the admin fixture cannot log in (e.g. running in isolation without the
// global-setup hook) individual tests will fail at the login step — that is the
// expected signal, not a spec bug.

import { test } from "@playwright/test";
import { loginViaCredentials } from "../harness/auth-cookie";
import { fixtureUsers } from "../fixtures/users";
import { runAxe } from "./helpers/axe";

const ADMIN_PAGES: { path: string; label: string }[] = [
  { path: "/admin/dashboard", label: "dashboard" },
  { path: "/admin/orders", label: "orders" },
  { path: "/admin/products", label: "products" },
  { path: "/admin/reviews", label: "reviews" },
  { path: "/admin/coupons", label: "coupons" },
  { path: "/admin/banners", label: "banners" },
  { path: "/admin/customers", label: "customers" },
  { path: "/admin/reports", label: "reports" },
  { path: "/admin/activity", label: "activity" },
];

test.describe.serial("@admin-a11y admin surface axe sweep", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaCredentials(page, {
      email: fixtureUsers.admin.email,
      password: fixtureUsers.admin.password,
    });
    // Allow the post-login redirect to settle before any admin navigation.
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 10_000 });
  });

  for (const { path, label } of ADMIN_PAGES) {
    test(`${label} page has no serious/critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      await runAxe(page);
    });
  }
});
