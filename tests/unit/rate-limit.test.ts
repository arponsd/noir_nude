import { describe, it, expect } from "vitest";
import { checkLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/constants";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type LimiterLike = { limit: (key: string) => Promise<LimitResult> };

/**
 * Minimal in-memory limiter used to exercise {@link checkLimit}. Mirrors the
 * shape of `@/lib/rate-limit`'s internal `InMemoryLimiter` — we can't import
 * that class because it is not exported, but we only need the public
 * `LimiterLike` contract to drive the code path.
 *
 * Fresh instance per test so bucket state never leaks.
 */
function makeLimiter(max: number, windowMs: number, label: string): LimiterLike {
  const buckets = new Map<string, { count: number; expiresAt: number }>();
  return {
    async limit(key) {
      const fullKey = `${label}:${key}`;
      const now = Date.now();
      const existing = buckets.get(fullKey);
      if (!existing || existing.expiresAt <= now) {
        const entry = { count: 1, expiresAt: now + windowMs };
        buckets.set(fullKey, entry);
        return { success: true, limit: max, remaining: max - 1, reset: entry.expiresAt };
      }
      existing.count += 1;
      return {
        success: existing.count <= max,
        limit: max,
        remaining: Math.max(0, max - existing.count),
        reset: existing.expiresAt,
      };
    },
  };
}

describe("checkLimit (in-memory shim path)", () => {
  it("first N requests succeed, request N+1 throws RateLimitError", async () => {
    const N = 5;
    const limiter = makeLimiter(N, 60_000, "test-auth");
    const key = "test-ip-1";

    for (let i = 0; i < N; i += 1) {
      const res = await checkLimit(limiter, key);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(N - 1 - i);
    }

    await expect(checkLimit(limiter, key)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("the RateLimitError carries a positive retryAfter (seconds) and RATE_LIMITED code", async () => {
    const limiter = makeLimiter(1, 60_000, "test-auth");
    const key = "test-ip-2";

    await checkLimit(limiter, key); // consume the single slot

    try {
      await checkLimit(limiter, key);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      const rl = err as RateLimitError;
      expect(rl.code).toBe(ERROR_CODES.RATE_LIMITED);
      expect(rl.retryAfter).toBeTypeOf("number");
      expect(rl.retryAfter!).toBeGreaterThanOrEqual(1);
      expect(rl.retryAfter!).toBeLessThanOrEqual(60);
    }
  });

  it("different keys on the same limiter have independent buckets", async () => {
    const limiter = makeLimiter(2, 60_000, "test-auth");

    await checkLimit(limiter, "a");
    await checkLimit(limiter, "a");
    await expect(checkLimit(limiter, "a")).rejects.toBeInstanceOf(RateLimitError);

    // key "b" should be untouched
    const res = await checkLimit(limiter, "b");
    expect(res.success).toBe(true);
  });

  it("fresh limiter per test — no leakage across instances", async () => {
    const a = makeLimiter(1, 60_000, "iso");
    const b = makeLimiter(1, 60_000, "iso");

    await checkLimit(a, "k");
    // b is a separate instance and must still have its slot free
    await expect(checkLimit(b, "k")).resolves.toMatchObject({ success: true });
  });
});
