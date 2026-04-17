import { describe, it, expect } from "vitest";
import { generateOrderNumber } from "@/lib/db/models/Order";

/**
 * `generateOrderNumber` produces strings of the form `GC-YYYYMMDD-XXXXX` where
 * the 5-char suffix is uppercase base36. The unit test asserts format +
 * best-effort uniqueness across 1000 calls — with 36^5 (~60M) suffix space per
 * day the collision probability is negligible and any collision would signal a
 * regression in the RNG path.
 */
const ORDER_NUMBER_REGEX = /^GC-\d{8}-[A-Z0-9]{5}$/;

describe("generateOrderNumber", () => {
  it("matches the documented format GC-YYYYMMDD-XXXXX", () => {
    const sample = generateOrderNumber(new Date("2026-04-17T12:00:00Z"));
    expect(sample).toMatch(ORDER_NUMBER_REGEX);
    expect(sample.startsWith("GC-20260417-")).toBe(true);
  });

  it("respects an explicit date and uses UTC segments", () => {
    // reason: date segments are UTC-based so tests stay stable across CI TZs.
    const jan1 = generateOrderNumber(new Date(Date.UTC(2026, 0, 1, 0, 0, 0)));
    expect(jan1).toMatch(/^GC-20260101-[A-Z0-9]{5}$/);

    const dec31 = generateOrderNumber(new Date(Date.UTC(2026, 11, 31, 23, 59, 59)));
    expect(dec31).toMatch(/^GC-20261231-[A-Z0-9]{5}$/);
  });

  it("defaults to now when no date is passed", () => {
    const out = generateOrderNumber();
    expect(out).toMatch(ORDER_NUMBER_REGEX);
  });

  it("1000 samples yield no collision (best-effort)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      const n = generateOrderNumber();
      expect(n).toMatch(ORDER_NUMBER_REGEX);
      seen.add(n);
    }
    // 1000 picks from ~60M combinations per day → expected collisions ≈ 0.
    expect(seen.size).toBe(1000);
  });

  it("suffix is always exactly 5 chars after left-padding", () => {
    for (let i = 0; i < 50; i += 1) {
      const n = generateOrderNumber();
      const suffix = n.split("-")[2] ?? "";
      expect(suffix.length).toBe(5);
      expect(/^[A-Z0-9]{5}$/.test(suffix)).toBe(true);
    }
  });
});
