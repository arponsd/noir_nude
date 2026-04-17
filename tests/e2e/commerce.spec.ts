// E2E commerce spec.
//
// Tagged @commerce — not run in the standard CI matrix (no dev server wired in
// this environment). Executes against a running Next.js dev server with the
// default seeded catalog + a known test account:
//
//   - MONGODB_URI points to a DB seeded via `pnpm db:seed`
//   - A customer user "customer+e2e@example.com" / "Zx!9aQpm.Vr34K" exists
//     (or the signup flow is used to create them before running this spec).
//   - Test orders are flagged `isTest: true` and excluded from admin dashboards.
//
// Flows covered (map to docs/15-testing.md):
//   1. Logged-in browse → PDP → add to cart → checkout → confirmation.
//   2. Apply valid coupon (WELCOME10) then invalid coupon.
//   3. Cancel an order within the window.
//   4. Reorder a past order.
//   5. Wishlist toggle persists across reload.
//   6. Address book CRUD + set default.
//
// Axe pass on /cart, /checkout, /account/orders.

import { expect, test } from "@playwright/test";
import type { Page as PlaywrightPage } from "@playwright/test";
import { runAxe } from "./helpers/axe";

const TEST_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? "customer+e2e@example.com";
const TEST_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD ?? "Zx!9aQpm.Vr34K";

async function login(page: PlaywrightPage): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("@commerce checkout & cart", () => {
  test("flow 1: browse → PDP → add to cart → checkout → confirmation", async ({ page }) => {
    await login(page);

    await page.goto("/products");
    const firstCard = page.getByTestId("product-card").first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await page.waitForURL(/\/products\/[a-z0-9-]+/);

    await page.getByRole("button", { name: /add to cart/i }).click();

    await page.goto("/cart");
    await expect(page.getByTestId("cart-line-item").first()).toBeVisible();

    await page.getByRole("link", { name: /checkout/i }).click();
    await page.waitForURL(/\/checkout/);

    // Checkout flow: address → review → place.
    await page.getByTestId("address-option").first().click();
    await page.getByRole("button", { name: /continue|next/i }).click();
    await page.getByRole("button", { name: /place order/i }).click();

    await page.waitForURL(/\/order\/confirmation|\/account\/orders\//);
    await expect(page.getByText(/order placed|thank you/i)).toBeVisible();
  });

  test("flow 2: apply valid coupon then invalid coupon", async ({ page }) => {
    await login(page);
    await page.goto("/products");
    await page.getByTestId("product-card").first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/cart");

    const couponInput = page.getByLabel(/coupon|promo code/i);
    await couponInput.fill("WELCOME10");
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page.getByText(/discount/i)).toBeVisible();

    await couponInput.fill("NOTREAL123");
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page.getByText(/invalid|not found|cannot be applied/i)).toBeVisible();
  });

  test("flow 3: cancel an order within the window", async ({ page }) => {
    await login(page);
    await page.goto("/account/orders");
    const orderLink = page.getByRole("link", { name: /order #GC-/i }).first();
    await orderLink.click();
    await page.waitForURL(/\/account\/orders\/[a-f0-9]+/);
    await page.getByRole("button", { name: /cancel order/i }).click();
    await page.getByLabel(/reason/i).fill("Testing cancellation window");
    await page.getByRole("button", { name: /confirm|submit/i }).click();
    await expect(page.getByText(/cancelled/i)).toBeVisible();
  });

  test("flow 4: reorder a past order populates cart", async ({ page }) => {
    await login(page);
    await page.goto("/account/orders");
    const orderLink = page.getByRole("link", { name: /order #GC-/i }).first();
    await orderLink.click();
    await page.getByRole("button", { name: /reorder/i }).click();
    await page.waitForURL(/\/cart/);
    await expect(page.getByTestId("cart-line-item").first()).toBeVisible();
  });

  test("flow 5: wishlist toggle persists across reload", async ({ page }) => {
    await login(page);
    await page.goto("/products");
    await page.getByTestId("product-card").first().click();
    await page.getByRole("button", { name: /wishlist|save/i }).click();

    await page.goto("/account/wishlist");
    const before = await page.getByTestId("wishlist-line-item").count();
    expect(before).toBeGreaterThan(0);

    await page.reload();
    const after = await page.getByTestId("wishlist-line-item").count();
    expect(after).toBe(before);
  });

  test("flow 6: address book CRUD + set default", async ({ page }) => {
    await login(page);
    await page.goto("/account/addresses");
    await page.getByRole("button", { name: /add address/i }).click();
    await page.getByLabel(/recipient/i).fill("E2E Tester");
    await page.getByLabel(/phone/i).fill("+8801700000000");
    await page.getByLabel(/address line 1/i).fill("Plot 1, Road 1");
    await page.getByLabel(/city/i).fill("Dhaka");
    await page.getByLabel(/district/i).fill("Dhaka");
    await page.getByLabel(/postal code/i).fill("1200");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/plot 1, road 1/i)).toBeVisible();

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

test.describe("@commerce axe audits", () => {
  test("/cart is accessible (no serious/critical violations)", async ({ page }) => {
    await login(page);
    await page.goto("/cart");
    await runAxe(page);
  });

  test("/checkout is accessible", async ({ page }) => {
    await login(page);
    // Ensure a cart item exists so /checkout renders.
    await page.goto("/products");
    await page.getByTestId("product-card").first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/checkout");
    await runAxe(page);
  });

  test("/account/orders is accessible", async ({ page }) => {
    await login(page);
    await page.goto("/account/orders");
    await runAxe(page);
  });
});
