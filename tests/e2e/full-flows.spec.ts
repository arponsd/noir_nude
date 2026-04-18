// E2E full-flows spec — covers the 12 required flows from docs/15-testing.md.
//
// Tag: @full — run pre-release via `pnpm test:e2e --grep @full`.
//
// Runtime requirements (NOT enforced by this file)
// ------------------------------------------------
// - Next.js dev/preview server running at PLAYWRIGHT_BASE_URL
//   (playwright.config.ts starts `pnpm dev` locally).
// - The server's MONGODB_URI / MONGODB_DB point at the same database the
//   Playwright harness writes to. The global-setup seeds the admin, customer,
//   and delivered-order users; specs below re-seed order- and catalog-scoped
//   fixtures as needed.
// - Default catalog seed (`pnpm db:seed`) has been applied so category slugs
//   like `lipstick` and product slugs like `velvet-matte-lipstick` exist.
// - The in-memory rate-limit fallback must persist across requests within a
//   single process. When running against multiple Node workers or a serverless
//   target the rate-limit flow (12) will not reach 429 — route the test run
//   through a single-process preview or enable Upstash.
//
// Two-context flows (6, 10) use `browser.newContext()` to simulate admin +
// customer concurrently. Seeding is done in `test.beforeAll`; specs assert
// against UI state.

import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { Types } from "mongoose";
import { seedUser } from "../harness/seed";
import { seedOrder } from "../harness/seed-orders";
import { disconnectTestDb } from "../harness/db";
import { loginViaCredentials } from "../harness/auth-cookie";
import { fixtureUsers } from "../fixtures/users";
import { runAxe } from "./helpers/axe";

// --- Shared credentials ------------------------------------------------------

const CUSTOMER = {
  email: "playwright+full-customer@example.com",
  password: "Pw!TestPass2026",
  name: "Full Customer",
};

const GUEST_CAPABLE_CUSTOMER_EMAIL = `playwright+guest-${Date.now()}@example.com`;

const ADMIN = fixtureUsers.admin;

test.afterAll(async () => {
  await disconnectTestDb();
});

// By default each `test(...)` runs in parallel. Only describes that share
// mutable state should opt into serial via `.serial`.
test.describe.configure({ mode: "parallel" });

// ---------------------------------------------------------------------------
// Flow 1 — new user signup → email verify → login
// ---------------------------------------------------------------------------
test.describe("@full flow 1: signup → verify → login", () => {
  test("register surfaces the check-your-email confirmation", async ({ page }) => {
    const fresh = `playwright+flow1-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Flow 1 User");
    await page.getByLabel("Email").fill(fresh);
    await page.getByLabel("Password", { exact: true }).fill("Zx!9aQpm.Vr34K");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
    await expect(page.getByText(fresh)).toBeVisible();
  });

  test("verified user can log in and lands on /account", async ({ page }) => {
    const seeded = await seedUser({
      email: `playwright+flow1-verified-${Date.now()}@example.com`,
      password: "Zx!9aQpm.Vr34K",
      name: "Flow 1 Verified",
      emailVerified: true,
    });
    await loginViaCredentials(page, { email: seeded.email, password: "Zx!9aQpm.Vr34K" });
    await page.waitForURL("**/account", { timeout: 10_000 });
    expect(page.url()).toContain("/account");
  });
});

// ---------------------------------------------------------------------------
// Flow 2 — browse → filter → PDP → variant
// ---------------------------------------------------------------------------
test.describe("@full flow 2: browse → filter → PDP → variant", () => {
  test("filter by category, open PDP, select variant", async ({ page }) => {
    await page.goto("/products?category=lipstick");
    await expect(page.getByTestId("product-card").first()).toBeVisible();
    await page.getByTestId("product-card").first().click();
    await page.waitForURL(/\/products\/[a-z0-9-]+/);

    const variantButtons = page.getByTestId("variant-option");
    const variantCount = await variantButtons.count();
    if (variantCount >= 2) {
      await variantButtons.nth(1).click();
      await expect(variantButtons.nth(1)).toHaveAttribute("aria-pressed", "true");
    } else {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Flow 3 — logged-in add to cart → drawer → checkout → COD → confirmation
// ---------------------------------------------------------------------------
test.describe("@full flow 3: logged-in COD checkout", () => {
  test("add to cart → checkout → place COD order → confirmation", async ({ page }) => {
    await seedUser({
      email: CUSTOMER.email,
      password: CUSTOMER.password,
      name: CUSTOMER.name,
      emailVerified: true,
    });
    await loginViaCredentials(page, { email: CUSTOMER.email, password: CUSTOMER.password });
    await page.waitForURL("**/account");

    await page.goto("/products");
    await page.getByTestId("product-card").first().click();
    await page.waitForURL(/\/products\/[a-z0-9-]+/);
    await page.getByRole("button", { name: /add to cart/i }).click();

    await page.goto("/cart");
    await expect(page.getByTestId("cart-line-item").first()).toBeVisible();
    await page.getByRole("link", { name: /checkout/i }).click();
    await page.waitForURL(/\/checkout/);

    // COD is the only payment method. Simply progress and place.
    await page.getByTestId("address-option").first().click();
    await page.getByRole("button", { name: /continue|next/i }).click();
    await page.getByRole("button", { name: /place order/i }).click();

    await page.waitForURL(/\/order\/confirmation|\/account\/orders\//);
    await expect(page.getByText(/order placed|thank you/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Flow 4 — guest checkout → confirmation → optional account creation
// ---------------------------------------------------------------------------
test.describe("@full flow 4: guest checkout → account", () => {
  test("guest places order and can opt into account creation", async ({ page }) => {
    // Clear any lingering session cookies.
    await page.context().clearCookies();

    await page.goto("/products");
    await page.getByTestId("product-card").first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    await page.goto("/checkout");
    // Guest form: email + shipping.
    await page.getByLabel(/email/i).fill(GUEST_CAPABLE_CUSTOMER_EMAIL);
    await page.getByLabel(/recipient/i).fill("Guest Buyer");
    await page.getByLabel(/phone/i).fill("+8801711111111");
    await page.getByLabel(/address line 1/i).fill("House 2, Road 2");
    await page.getByLabel(/city/i).fill("Dhaka");
    await page.getByLabel(/district/i).fill("Dhaka");
    await page.getByLabel(/postal code/i).fill("1212");

    await page.getByRole("button", { name: /place order/i }).click();
    await page.waitForURL(/\/order\/confirmation/);
    await expect(page.getByText(/thank you|order placed/i)).toBeVisible();

    // Optional account creation surfaced on confirmation.
    const createButton = page.getByRole("button", { name: /create an account/i });
    if (await createButton.isVisible().catch(() => false)) {
      await page.getByLabel(/password/i).fill("Zx!9aQpm.Vr34K");
      await createButton.click();
      await expect(page.getByText(/account created|welcome/i)).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Flow 5 — reorder a past order
// ---------------------------------------------------------------------------
test.describe("@full flow 5: reorder past order", () => {
  test("reorder button repopulates cart from a prior order", async ({ page }) => {
    const user = await seedUser({
      email: `playwright+flow5-${Date.now()}@example.com`,
      password: CUSTOMER.password,
      name: "Flow 5",
      emailVerified: true,
    });
    await seedOrder({
      userId: user.userId,
      items: [
        {
          productId: new Types.ObjectId(),
          variantId: new Types.ObjectId(),
          name: "Reorder Fixture",
          sku: "RF-01",
          price: 60000,
          quantity: 1,
        },
      ],
      status: "delivered",
      isTest: true,
    });

    await loginViaCredentials(page, { email: user.email, password: CUSTOMER.password });
    await page.waitForURL("**/account");
    await page.goto("/account/orders");
    await page
      .getByRole("link", { name: /order #/i })
      .first()
      .click();
    await page.waitForURL(/\/account\/orders\/[a-f0-9]+/);
    await page.getByRole("button", { name: /reorder/i }).click();
    await page.waitForURL(/\/cart/);
    await expect(page.getByTestId("cart-line-item").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Flow 6 — admin marks shipped → customer sees timeline update
// Shared state across two contexts. Serial.
// ---------------------------------------------------------------------------
test.describe.serial("@full flow 6: admin ships → customer timeline", () => {
  let adminContext: BrowserContext;
  let customerContext: BrowserContext;
  let adminPage: Page;
  let customerPage: Page;
  let orderNumber: string;
  let orderId: string;

  test.beforeAll(async ({ browser }) => {
    // Seed fresh customer + a "placed" order we can ship.
    const customer = await seedUser({
      email: `playwright+flow6-${Date.now()}@example.com`,
      password: CUSTOMER.password,
      name: "Flow 6 Customer",
      emailVerified: true,
    });
    await seedUser({
      email: ADMIN.email,
      password: ADMIN.password,
      name: ADMIN.name,
      role: "admin",
      emailVerified: true,
    });
    const order = await seedOrder({
      userId: customer.userId,
      items: [
        {
          productId: new Types.ObjectId(),
          variantId: new Types.ObjectId(),
          name: "Flow 6 Item",
          sku: "F6-01",
          price: 70000,
          quantity: 1,
        },
      ],
      status: "placed",
      isTest: true,
    });
    orderNumber = (order as unknown as { orderNumber: string }).orderNumber;
    orderId = (order._id as Types.ObjectId).toString();

    adminContext = await browser.newContext();
    customerContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    customerPage = await customerContext.newPage();

    await loginViaCredentials(adminPage, { email: ADMIN.email, password: ADMIN.password });
    await loginViaCredentials(customerPage, {
      email: customer.email,
      password: CUSTOMER.password,
    });
  });

  test.afterAll(async () => {
    await adminContext?.close();
    await customerContext?.close();
  });

  test("admin marks order shipped and customer timeline updates", async () => {
    await adminPage.goto("/admin/orders");
    await adminPage.getByRole("link", { name: new RegExp(orderNumber, "i") }).click();
    await adminPage.waitForURL(/\/admin\/orders\//);
    await adminPage.getByRole("button", { name: /mark.*shipped|ship/i }).click();
    await expect(adminPage.getByText(/shipped/i).first()).toBeVisible();

    // Customer reloads and the timeline reflects the shipped state.
    await customerPage.goto(`/account/orders/${orderId}`);
    await customerPage.reload();
    await expect(customerPage.getByText(/shipped/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Flow 7 — wishlist toggle + persistence
// ---------------------------------------------------------------------------
test.describe("@full flow 7: wishlist persistence", () => {
  test("toggled wishlist item persists across reload", async ({ page }) => {
    const user = await seedUser({
      email: `playwright+flow7-${Date.now()}@example.com`,
      password: CUSTOMER.password,
      name: "Flow 7",
      emailVerified: true,
    });
    await loginViaCredentials(page, { email: user.email, password: CUSTOMER.password });
    await page.waitForURL("**/account");

    await page.goto("/products");
    await page.getByTestId("product-card").first().click();
    await page.getByRole("button", { name: /wishlist|save/i }).click();

    await page.goto("/account/wishlist");
    const before = await page.getByTestId("wishlist-line-item").count();
    expect(before).toBeGreaterThan(0);
    await page.reload();
    expect(await page.getByTestId("wishlist-line-item").count()).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Flow 8 — coupon apply / invalid / expired
// ---------------------------------------------------------------------------
test.describe("@full flow 8: coupon apply / invalid / expired", () => {
  test("valid, invalid, and expired coupons surface distinct responses", async ({ page }) => {
    const user = await seedUser({
      email: `playwright+flow8-${Date.now()}@example.com`,
      password: CUSTOMER.password,
      name: "Flow 8",
      emailVerified: true,
    });
    await loginViaCredentials(page, { email: user.email, password: CUSTOMER.password });
    await page.waitForURL("**/account");

    await page.goto("/products");
    await page.getByTestId("product-card").first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/cart");

    const couponInput = page.getByLabel(/coupon|promo code/i);
    const applyButton = page.getByRole("button", { name: /apply/i });

    // Valid — depends on default seed (WELCOME10 active).
    await couponInput.fill("WELCOME10");
    await applyButton.click();
    await expect(page.getByText(/discount|-৳/i)).toBeVisible();

    // Invalid — random unseeded code.
    await couponInput.fill("NOTREAL123");
    await applyButton.click();
    await expect(page.getByText(/invalid|not found|cannot be applied/i)).toBeVisible();

    // Expired — default seed includes EXPIRED10 (see scripts/seed/coupons if present).
    await couponInput.fill("EXPIRED10");
    await applyButton.click();
    await expect(page.getByText(/expired|no longer valid/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Flow 9 — address CRUD + default
// ---------------------------------------------------------------------------
test.describe("@full flow 9: address CRUD + default", () => {
  test("add, set default, delete an address", async ({ page }) => {
    const user = await seedUser({
      email: `playwright+flow9-${Date.now()}@example.com`,
      password: CUSTOMER.password,
      name: "Flow 9",
      emailVerified: true,
    });
    await loginViaCredentials(page, { email: user.email, password: CUSTOMER.password });
    await page.waitForURL("**/account");
    await page.goto("/account/addresses");

    await page.getByRole("button", { name: /add address/i }).click();
    await page.getByLabel(/recipient/i).fill("Flow 9 Recipient");
    await page.getByLabel(/phone/i).fill("+8801711111111");
    await page.getByLabel(/address line 1/i).fill("Plot 9, Road 9");
    await page.getByLabel(/city/i).fill("Dhaka");
    await page.getByLabel(/district/i).fill("Dhaka");
    await page.getByLabel(/postal code/i).fill("1209");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/plot 9, road 9/i)).toBeVisible();

    await page
      .getByRole("button", { name: /set default/i })
      .first()
      .click();
    await expect(page.getByText(/default/i).first()).toBeVisible();

    await page
      .getByRole("button", { name: /delete/i })
      .first()
      .click();
    await page.getByRole("button", { name: /confirm/i }).click();
  });
});

// ---------------------------------------------------------------------------
// Flow 10 — submit review → admin approves → review appears on PDP
// Two-context, shared state. Serial.
// ---------------------------------------------------------------------------
test.describe.serial("@full flow 10: review submit → admin approve → PDP", () => {
  let adminContext: BrowserContext;
  let customerContext: BrowserContext;
  let adminPage: Page;
  let customerPage: Page;
  const productSlug = "velvet-matte-lipstick";

  test.beforeAll(async ({ browser }) => {
    const customer = await seedUser({
      email: `playwright+flow10-${Date.now()}@example.com`,
      password: CUSTOMER.password,
      name: "Flow 10 Customer",
      emailVerified: true,
    });
    await seedUser({
      email: ADMIN.email,
      password: ADMIN.password,
      name: ADMIN.name,
      role: "admin",
      emailVerified: true,
    });
    // Delivered order required so the review gating passes.
    // reason: the Review model enforces a unique (user,product,order) index and the
    // service layer requires a delivered order referencing the product. The test
    // assumes the seeded catalog contains `velvet-matte-lipstick`; if it doesn't
    // the spec will fail loudly at the submit step.
    await seedOrder({
      userId: customer.userId,
      items: [
        {
          productId: new Types.ObjectId(),
          variantId: new Types.ObjectId(),
          name: "Velvet Matte Lipstick",
          sku: "VM-01",
          price: 85000,
          quantity: 1,
        },
      ],
      status: "delivered",
      deliveredAt: new Date(Date.now() - 24 * 3600 * 1000),
      isTest: true,
    });

    adminContext = await browser.newContext();
    customerContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    customerPage = await customerContext.newPage();

    await loginViaCredentials(adminPage, { email: ADMIN.email, password: ADMIN.password });
    await loginViaCredentials(customerPage, {
      email: customer.email,
      password: CUSTOMER.password,
    });
  });

  test.afterAll(async () => {
    await adminContext?.close();
    await customerContext?.close();
  });

  test("customer submits review; admin approves; review renders on PDP", async () => {
    // Customer submits a review.
    await customerPage.goto(`/products/${productSlug}`);
    await customerPage.getByRole("button", { name: /write.*review/i }).click();
    await customerPage.getByLabel(/rating/i).fill("5");
    await customerPage.getByLabel(/title/i).fill("E2E Review");
    await customerPage.getByLabel(/body|details/i).fill("This is an end-to-end test review.");
    await customerPage.getByRole("button", { name: /submit|post/i }).click();
    await expect(customerPage.getByText(/pending|submitted/i)).toBeVisible();

    // Admin approves.
    await adminPage.goto("/admin/reviews");
    await adminPage
      .getByRole("button", { name: /approve/i })
      .first()
      .click();
    await expect(adminPage.getByText(/approved/i).first()).toBeVisible();

    // Customer reloads PDP and sees their review.
    await customerPage.goto(`/products/${productSlug}`);
    await expect(customerPage.getByText(/E2E Review/)).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Flow 11 — 401/403 on admin route as customer
// ---------------------------------------------------------------------------
test.describe("@full flow 11: customer blocked from /admin", () => {
  test("logged-in customer visiting /admin/dashboard is denied", async ({ page }) => {
    const user = await seedUser({
      email: `playwright+flow11-${Date.now()}@example.com`,
      password: CUSTOMER.password,
      name: "Flow 11",
      emailVerified: true,
    });
    await loginViaCredentials(page, { email: user.email, password: CUSTOMER.password });
    await page.waitForURL("**/account");
    const response = await page.goto("/admin/dashboard");
    const status = response?.status() ?? 0;
    const finalUrl = page.url();
    const deniedByStatus = status === 401 || status === 403;
    const deniedByRedirect = /\/(403|login|unauthorized)/.test(finalUrl);
    expect(deniedByStatus || deniedByRedirect).toBeTruthy();
    await expect(page.locator("h1")).not.toContainText(/Dashboard/i);
  });
});

// ---------------------------------------------------------------------------
// Flow 12 — rate limit: 6 failed logins → 429
// ---------------------------------------------------------------------------
test.describe("@full flow 12: rate-limit 6 failed logins", () => {
  test("sixth failed login attempt returns 429", async ({ request }) => {
    const email = `playwright+flow12-${Date.now()}@example.com`;
    // No seed; user does not exist. Repeated POSTs should trip the limiter
    // before the auth service even resolves.
    let lastStatus = 0;
    for (let i = 0; i < 6; i += 1) {
      const res = await request.post("/api/auth/callback/credentials", {
        data: { email, password: "wrong-wrong-wrong-1" },
        failOnStatusCode: false,
      });
      lastStatus = res.status();
      if (i < 5) {
        // Early attempts should not be 429.
        expect(lastStatus).not.toBe(429);
      }
    }
    expect(lastStatus).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// Smoke axe pass across the flow surfaces
// ---------------------------------------------------------------------------
test.describe("@full axe coverage", () => {
  test("product listing is accessible", async ({ page }) => {
    await page.goto("/products");
    await runAxe(page);
  });
});
