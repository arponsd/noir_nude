/**
 * Extract the client IP from incoming request headers for rate-limit bucketing.
 *
 * Order of preference:
 *   1. First entry in `x-forwarded-for` (Vercel / most proxies).
 *   2. `x-real-ip` (nginx style).
 *   3. `cf-connecting-ip` (Cloudflare).
 *   4. Literal "unknown" so abusive egress nodes collide in one bucket rather
 *      than each get their own fresh quota when proxy headers are stripped.
 *
 * We accept both `Request` and `Headers` because middleware hands us
 * `NextRequest` (which extends Request) while route handlers already have a
 * plain `Request`. A `Headers` overload supports the `next/headers` helper.
 */
type HeaderSource = Request | Headers | { headers: Headers };

function getHeaders(source: HeaderSource): Headers {
  if (source instanceof Headers) return source;
  return source.headers;
}

export function getClientIp(source: HeaderSource): string {
  const h = getHeaders(source);
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed) return trimmed;
  }
  const cf = h.get("cf-connecting-ip");
  if (cf) {
    const trimmed = cf.trim();
    if (trimmed) return trimmed;
  }
  return "unknown";
}
