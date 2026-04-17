import { describe, it, expect } from "vitest";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";

describe("validatePasswordStrength", () => {
  it("rejects passwords shorter than 10 characters", () => {
    const result = validatePasswordStrength("Abc!1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("TOO_SHORT");
    }
  });

  it("rejects common weak passwords of sufficient length", () => {
    const result = validatePasswordStrength("password1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // "password1" is 9 chars — this is too short. Use a 10+ char weak password too.
      expect(["TOO_SHORT", "TOO_WEAK"]).toContain(result.reason);
    }

    const longerWeak = validatePasswordStrength("password12");
    expect(longerWeak.ok).toBe(false);
    if (!longerWeak.ok) {
      expect(longerWeak.reason).toBe("TOO_WEAK");
      expect(longerWeak.feedback).toBeTypeOf("string");
    }
  });

  it("accepts a strong password", () => {
    const result = validatePasswordStrength("Zx!9aQpm.Vr34K");
    expect(result.ok).toBe(true);
  });

  it("penalises passwords containing the user's email or name", () => {
    const result = validatePasswordStrength("jane.doe@example.com-pw", {
      email: "jane.doe@example.com",
      name: "Jane Doe",
    });
    expect(result.ok).toBe(false);
  });
});

describe("hashPassword + verifyPassword", () => {
  it("round-trips — hash verifies against original plaintext and rejects others", async () => {
    const plain = "Zx!9aQpm.Vr34K";
    const hash = await hashPassword(plain);

    expect(hash).toBeTypeOf("string");
    expect(hash.length).toBeGreaterThan(20);
    expect(hash).not.toContain(plain);

    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
    await expect(verifyPassword("not-the-password", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same plaintext (bcrypt salting)", async () => {
    const plain = "Zx!9aQpm.Vr34K";
    const [a, b] = await Promise.all([hashPassword(plain), hashPassword(plain)]);
    expect(a).not.toBe(b);
  });
});
