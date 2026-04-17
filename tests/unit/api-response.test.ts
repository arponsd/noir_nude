import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";
import { AuthError, fail, ok, safeAction, ValidationError } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/constants";

describe("ok", () => {
  it("wraps data in a success envelope", () => {
    const res = ok({ hello: "world" });
    expect(res).toEqual({ ok: true, data: { hello: "world" } });
  });

  it("supports primitive data", () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 });
    expect(ok(null)).toEqual({ ok: true, data: null });
  });
});

describe("fail", () => {
  it("builds a failure envelope without details when none supplied", () => {
    const res = fail("X_CODE", "Something broke");
    expect(res).toEqual({
      ok: false,
      error: { code: "X_CODE", message: "Something broke" },
    });
    // details should not be serialised when undefined
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error("expected failure envelope");
    expect(Object.hasOwn(res.error, "details")).toBe(false);
  });

  it("includes details when supplied", () => {
    const res = fail("X", "boom", { field: "email" });
    expect(res).toEqual({
      ok: false,
      error: { code: "X", message: "boom", details: { field: "email" } },
    });
  });
});

describe("safeAction", () => {
  it("returns ok envelope on success", async () => {
    const action = safeAction(async (n: number) => n * 2);
    const result = await action(21);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("maps ZodError to VALIDATION_FAILED", async () => {
    const schema = z.object({ email: z.string().email() });
    const action = safeAction(async (raw: unknown) => schema.parse(raw));
    const result = await action({ email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(result.error.message).toBe("Invalid input.");
      expect(result.error.details).toBeDefined();
    }
  });

  it("maps ValidationError to its own code", async () => {
    const action = safeAction(async () => {
      throw new ValidationError("bad thing", ERROR_CODES.EMAIL_TAKEN);
    });
    const result = await action();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.EMAIL_TAKEN);
      expect(result.error.message).toBe("bad thing");
    }
  });

  it("maps AuthError to UNAUTHORIZED", async () => {
    const action = safeAction(async () => {
      throw new AuthError();
    });
    const result = await action();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    }
  });

  it("maps unknown errors to INTERNAL_ERROR without leaking the original message", async () => {
    const action = safeAction(async () => {
      throw new Error("secret internal detail: db password=abcd");
    });
    const result = await action();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(result.error.message).toBe("Something went wrong.");
      // the original error message must not leak through
      expect(result.error.message).not.toContain("db password");
      expect(result.error.message).not.toContain("secret");
    }
  });

  it("ZodError is recognised as a thrown error shape (sanity)", () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: "bad" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error).toBeInstanceOf(ZodError);
    }
  });
});
