import type { Page } from "@playwright/test";

export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Submits the credentials login form on `/login`. Waits for navigation away
 * from `/login` or for a visible error toast. Caller is expected to assert the
 * final URL / state.
 */
export async function loginViaCredentials(
  page: Page,
  { email, password }: LoginCredentials,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}
