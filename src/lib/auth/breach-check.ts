import { createHash } from "node:crypto";
import logger from "@/lib/utils/logger";

/**
 * HIBP k-anonymity password breach check.
 *
 * The plaintext password never leaves the server. We take the SHA-1 hash,
 * send only the first 5 hex chars to the HIBP range API, and compare suffixes
 * locally against the returned list. Per HIBP docs:
 *   https://haveibeenpwned.com/API/v3#PwnedPasswords
 *
 * Behaviour:
 *   - Fail-open: any network/timeout/parse error resolves to `false` (not
 *     breached) with a warn log. We never block registration on infrastructure
 *     hiccups — the check is advisory per docs/11-security.md §Authentication.
 *   - 2-second timeout so slow/dead HIBP doesn't slow down register/reset.
 *   - Node 18+ `fetch` (available in Next.js 15 server runtime).
 */

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";
const TIMEOUT_MS = 2000;

function sha1Hex(input: string): string {
  return createHash("sha1").update(input, "utf8").digest("hex").toUpperCase();
}

export async function isPasswordBreached(password: string): Promise<boolean> {
  if (!password) return false;

  const hash = sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      method: "GET",
      headers: {
        // HIBP recommends an Add-Padding header to defeat traffic analysis
        // that might correlate response size with specific prefixes.
        "Add-Padding": "true",
        "User-Agent": "cosmetic-app-breach-check",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "hibp: breach-check range request failed; failing open");
      return false;
    }
    const body = await res.text();
    // Each line is `SUFFIX:COUNT`. Count == 0 rows appear only for padding and
    // should be ignored so padded entries don't produce false positives.
    const lines = body.split(/\r?\n/);
    for (const line of lines) {
      if (!line) continue;
      const [lineSuffix, countStr] = line.split(":");
      if (!lineSuffix || !countStr) continue;
      if (lineSuffix.trim().toUpperCase() === suffix) {
        const count = Number.parseInt(countStr.trim(), 10);
        return Number.isFinite(count) && count > 0;
      }
    }
    return false;
  } catch (err) {
    logger.warn({ err: String(err) }, "hibp: breach-check threw; failing open");
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Advisory wrapper. Returns a non-blocking warning string (or `null`) that
 * register/reset actions can surface in the response so the user can be
 * nudged to pick a safer password without being refused service.
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  warning: string | null;
}> {
  const breached = await isPasswordBreached(password);
  if (!breached) return { breached: false, warning: null };
  return {
    breached: true,
    warning:
      "This password has appeared in a known data breach. It still meets our minimum strength, but we strongly recommend choosing a different one.",
  };
}
