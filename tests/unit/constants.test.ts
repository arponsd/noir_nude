import { describe, it, expect } from "vitest";
import { ERROR_CODES, formatBDT } from "@/lib/constants";

describe("formatBDT", () => {
  it("formats paisa as BDT with two decimals", () => {
    expect(formatBDT(125000)).toBe("\u09F31,250.00");
  });

  it("handles zero", () => {
    expect(formatBDT(0)).toBe("\u09F30.00");
  });

  it("handles small sub-unit values", () => {
    expect(formatBDT(1)).toBe("\u09F30.01");
    expect(formatBDT(99)).toBe("\u09F30.99");
  });

  it("handles negative input (e.g. refund display)", () => {
    // reason: negative paisa can legitimately represent refunds / adjustments;
    // assert it round-trips through Intl without NaN or '-0'.
    const result = formatBDT(-125000);
    expect(result.startsWith("\u09F3")).toBe(true);
    expect(result).toContain("1,250.00");
    expect(result).toContain("-");
  });

  it("handles large values", () => {
    expect(formatBDT(1234567890)).toBe("\u09F312,345,678.90");
  });
});

describe("ERROR_CODES", () => {
  it("every key equals its value (sanity)", () => {
    for (const [key, value] of Object.entries(ERROR_CODES)) {
      expect(value).toBe(key);
    }
  });

  it("exposes the core envelope codes", () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ERROR_CODES.VALIDATION_FAILED).toBe("VALIDATION_FAILED");
    expect(ERROR_CODES.RATE_LIMITED).toBe("RATE_LIMITED");
    expect(ERROR_CODES.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ERROR_CODES.EMAIL_TAKEN).toBe("EMAIL_TAKEN");
    expect(ERROR_CODES.TOKEN_INVALID).toBe("TOKEN_INVALID");
    expect(ERROR_CODES.TOKEN_EXPIRED).toBe("TOKEN_EXPIRED");
  });
});
