/**
 * Playwright global setup.
 *
 * Runs once before the full e2e test run (Playwright invokes the default export
 * with the resolved FullConfig). Seeds a known fixture set the e2e specs rely on:
 *
 *   1. Admin fixture user    — `admin@example.com` (role=admin)
 *   2. Customer fixture user — `playwright+customer@example.com` (role=customer)
 *   3. Delivered-order user  — `playwright+delivered@example.com` with a
 *      delivered order seeded so review flow specs can post a review without
 *      going through full checkout.
 *
 * Environment prerequisites
 * -------------------------
 * - `MONGODB_URI`  — the connection string; MUST match the DB the Next.js server
 *   is talking to. If this diverges from the app's runtime env the seeded
 *   fixtures are invisible to the UI.
 * - `MONGODB_DB`   — the database name (e.g. `cosmetic_e2e`).
 * - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` — required by the
 *   app module graph when harness files transitively import `@/lib/env`.
 *
 * We intentionally do NOT start the Next.js server here; that's owned by the
 * `webServer` block in `playwright.config.ts`. Global setup assumes the server
 * is (or will be) online at `PLAYWRIGHT_BASE_URL`.
 *
 * Failure policy: if the seed throws, the whole run aborts — missing fixtures
 * would cause misleading spec failures downstream.
 */

import type { FullConfig } from "@playwright/test";
import { seedUser } from "../harness/seed";
import { seedOrder } from "../harness/seed-orders";
import { disconnectTestDb } from "../harness/db";
import { fixtureUsers } from "../fixtures/users";
import { Types } from "mongoose";

export const DELIVERED_FIXTURE = {
  email: "playwright+delivered@example.com",
  password: "Pw!TestPass2026",
  name: "Playwright Delivered",
};

async function globalSetup(_config: FullConfig): Promise<void> {
  try {
    // 1. Admin fixture.
    await seedUser({
      email: fixtureUsers.admin.email,
      password: fixtureUsers.admin.password,
      name: fixtureUsers.admin.name,
      role: "admin",
      emailVerified: true,
    });

    // 2. Customer fixture.
    await seedUser({
      email: fixtureUsers.customer.email,
      password: fixtureUsers.customer.password,
      name: fixtureUsers.customer.name,
      role: "customer",
      emailVerified: true,
    });

    // 3. Delivered-order customer.
    const delivered = await seedUser({
      email: DELIVERED_FIXTURE.email,
      password: DELIVERED_FIXTURE.password,
      name: DELIVERED_FIXTURE.name,
      role: "customer",
      emailVerified: true,
    });

    // Seed one delivered order tied to a synthetic product id so review flows
    // have something to post against. The review service validates existence
    // against the real catalog — specs that need a live product id can re-seed
    // via the database seed or override `productId` before submitting a review.
    await seedOrder({
      userId: delivered.userId,
      items: [
        {
          productId: new Types.ObjectId(),
          variantId: new Types.ObjectId(),
          name: "E2E Fixture Product",
          sku: "E2E-FIX-01",
          price: 50000,
          quantity: 1,
        },
      ],
      status: "delivered",
      deliveredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      isTest: true,
    });
  } finally {
    await disconnectTestDb();
  }
}

export default globalSetup;
