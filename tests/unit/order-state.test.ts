import { describe, it, expect } from "vitest";
import { assertTransition, canTransition } from "@/lib/services/order-state";
import { ORDER_STATUSES, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/constants";
import { ValidationError } from "@/lib/api/response";

describe("canTransition", () => {
  it("returns true for every allowed transition per docs/04-contracts.md §Order state machine", () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_TRANSITIONS[from]) {
        expect(canTransition(from, to), `expected ${from} → ${to} to be allowed`).toBe(true);
      }
    }
  });

  it("returns false for every pair not listed as allowed", () => {
    const allowedPairs = new Set<string>();
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_TRANSITIONS[from]) {
        allowedPairs.add(`${from}->${to}`);
      }
    }

    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        if (allowedPairs.has(`${from}->${to}`)) continue;
        expect(canTransition(from, to), `expected ${from} → ${to} to be disallowed`).toBe(false);
      }
    }
  });

  it("covers the canonical happy path placed → delivered", () => {
    const path: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "delivered"];
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it("treats cancelled and returned as terminal states", () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition("cancelled", to)).toBe(false);
      expect(canTransition("returned", to)).toBe(false);
    }
  });
});

describe("assertTransition", () => {
  it("does not throw for allowed transitions", () => {
    expect(() => assertTransition("placed", "confirmed")).not.toThrow();
    expect(() => assertTransition("shipped", "delivered")).not.toThrow();
  });

  it("throws ValidationError on disallowed transitions", () => {
    expect(() => assertTransition("placed", "delivered")).toThrow(ValidationError);
    expect(() => assertTransition("delivered", "placed")).toThrow(ValidationError);
    expect(() => assertTransition("cancelled", "confirmed")).toThrow(ValidationError);
  });
});
