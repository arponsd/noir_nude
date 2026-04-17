import { test, expect } from "@playwright/test";
import { runAxe } from "./helpers/axe";

test("@smoke homepage renders and is accessible", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1").first();
  await expect(h1).toContainText(/Cosmetic/i);
  await runAxe(page);
});
