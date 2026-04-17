import { describe, it, expect, beforeEach } from "vitest";
import { seedCatalog } from "../../harness/seed-catalog";
import type { SearchSuggestion } from "@/types/api/search";

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

// Use a per-call IP so the module-level searchLimiter (60/min in-memory) does not
// collapse the whole test run into the same bucket.
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `10.1.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

async function callSuggest(
  query: string,
): Promise<{ status: number; body: ApiResp<SearchSuggestion[]> }> {
  const { GET } = await import("@/app/api/search/suggest/route");
  const req = new Request(`http://localhost/api/search/suggest${query}`, {
    headers: { "x-forwarded-for": nextIp() },
  });
  const res = await GET(req);
  return { status: res.status, body: (await res.json()) as ApiResp<SearchSuggestion[]> };
}

function assertOk<T>(body: ApiResp<T>): asserts body is ApiOk<T> {
  if (!body.ok) throw new Error(`expected ok, got ${body.error.code}: ${body.error.message}`);
}

describe("GET /api/search/suggest", () => {
  beforeEach(async () => {
    await seedCatalog({
      categories: [
        { name: "Lipstick", slug: "lipstick", order: 1 },
        { name: "Foundation", slug: "foundation", order: 2 },
        { name: "Skincare", slug: "skincare", order: 3 },
      ],
      products: [
        {
          name: "Velvet Matte Lipstick",
          slug: "velvet-matte-lipstick",
          categorySlug: "lipstick",
          brand: "GlowCart",
          basePrice: 85000,
        },
        {
          name: "Velvet Cushion Foundation",
          slug: "velvet-cushion-foundation",
          categorySlug: "foundation",
          brand: "GlowCart",
          basePrice: 125000,
        },
        {
          name: "Silk Serum",
          slug: "silk-serum",
          categorySlug: "skincare",
          brand: "AuraSkin",
          basePrice: 180000,
        },
      ],
    });
  });

  it("q=velv returns both velvet products", async () => {
    const { status, body } = await callSuggest("?q=velv");
    expect(status).toBe(200);
    assertOk(body);
    const slugs = body.data.map((s) => s.slug).sort();
    expect(slugs).toEqual(["velvet-cushion-foundation", "velvet-matte-lipstick"]);
  });

  it("q=silk returns exactly one", async () => {
    const { status, body } = await callSuggest("?q=silk");
    expect(status).toBe(200);
    assertOk(body);
    expect(body.data.length).toBe(1);
    expect(body.data[0]?.slug).toBe("silk-serum");
  });

  it("empty q returns an empty array without touching search", async () => {
    const { status, body } = await callSuggest("?q=");
    expect(status).toBe(200);
    assertOk(body);
    expect(body.data).toEqual([]);
  });

  // GAP: the MVP rate limiter is a process-local `InMemoryLimiter` with no reset
  // hook exposed to tests; the bucket is keyed by IP, so fuzz-driving it with
  // unique IPs per request (as above) avoids the limit rather than exercising
  // it. Testing the 429 path would require either exporting a reset helper
  // from @/lib/rate-limit or swapping the limiter via a dedicated test
  // adapter. Filing as follow-up rather than flaking CI with a time-dependent
  // test. TODO: open a ticket for the security agent to expose a limiter
  // reset hook.
  it.todo("hits 429 after 60 suggest calls from the same IP within a minute");
});
