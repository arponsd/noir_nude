import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { RateLimitError } from "@/lib/api/response";
import logger from "@/lib/utils/logger";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type LimiterLike = {
  limit: (key: string) => Promise<LimitResult>;
};

type WindowKind = "m" | "h";

type BucketEntry = { count: number; expiresAt: number };

class InMemoryLimiter implements LimiterLike {
  private readonly buckets = new Map<string, BucketEntry>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly label: string,
  ) {}

  async limit(key: string): Promise<LimitResult> {
    const fullKey = `${this.label}:${key}`;
    const now = Date.now();
    const existing = this.buckets.get(fullKey);
    if (!existing || existing.expiresAt <= now) {
      const entry: BucketEntry = { count: 1, expiresAt: now + this.windowMs };
      this.buckets.set(fullKey, entry);
      return {
        success: true,
        limit: this.max,
        remaining: this.max - 1,
        reset: entry.expiresAt,
      };
    }
    existing.count += 1;
    const success = existing.count <= this.max;
    return {
      success,
      limit: this.max,
      remaining: Math.max(0, this.max - existing.count),
      reset: existing.expiresAt,
    };
  }
}

const useUpstash = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);

if (!useUpstash) {
  logger.warn(
    "rate-limit: Upstash env missing, falling back to in-memory limiter (not safe for multi-instance deploys)",
  );
}

const redis = useUpstash
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function buildLimiter(count: number, window: WindowKind, label: string): LimiterLike {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(count, `1 ${window === "m" ? "m" : "h"}`),
      analytics: false,
      prefix: `rl:${label}`,
    });
  }
  const windowMs = window === "m" ? 60_000 : 60 * 60_000;
  return new InMemoryLimiter(count, windowMs, label);
}

export const authLimiter = buildLimiter(5, "m", "auth");
export const orderLimiter = buildLimiter(10, "h", "order");
export const reviewLimiter = buildLimiter(3, "h", "review");
export const cartLimiter = buildLimiter(30, "m", "cart");
export const searchLimiter = buildLimiter(60, "m", "search");
// reason(T-7.S02): profile/account write endpoints need a looser bucket than
//   the 5/min auth limiter (which is calibrated for login/register brute-force)
//   but tighter than cart. 30/min/user matches the documented pattern and
//   covers preference toggles that might burst while a user edits a form.
export const profileLimiter = buildLimiter(30, "m", "profile");
// reason(T-7.S02): address CRUD is interactive UI — users frequently add,
//   toggle default, and remove addresses in a single session; 60/min/user
//   keeps the throttle invisible to humans while still blocking scripted abuse.
export const addressLimiter = buildLimiter(60, "m", "address");

export async function checkLimit(limiter: LimiterLike, key: string): Promise<LimitResult> {
  const result = await limiter.limit(key);
  if (!result.success) {
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    throw new RateLimitError("Too many requests", retryAfter);
  }
  return result;
}
