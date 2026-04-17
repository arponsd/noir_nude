import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { installAuthMock, setMockSession, clearMockSession } from "../../harness/mock-auth";
import { ERROR_CODES } from "@/lib/constants";

// Must be installed before `@/lib/auth/require-role` is pulled in via the route.
installAuthMock();

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };
type ApiResp<T> = ApiOk<T> | ApiFail;

type SignOk = {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
};

function assertOk<T>(body: ApiResp<T>): asserts body is ApiOk<T> {
  if (!body.ok) throw new Error(`expected ok, got ${body.error.code}: ${body.error.message}`);
}
function assertFail<T>(body: ApiResp<T>): asserts body is ApiFail {
  if (body.ok) throw new Error("expected failure");
}

async function callSign(payload: unknown): Promise<{ status: number; body: ApiResp<SignOk> }> {
  // Fresh module import each time so the route picks up whatever env vars we set.
  // `@/lib/env` is evaluated once, so tests must set env before the module loads.
  vi.resetModules();
  installAuthMock();
  const { POST } = await import("@/app/api/uploads/sign/route");
  const req = new Request("http://localhost/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const res = await POST(req);
  return { status: res.status, body: (await res.json()) as ApiResp<SignOk> };
}

describe("POST /api/uploads/sign", () => {
  // Snapshot env keys so tests can restore them.
  let prevName: string | undefined;
  let prevKey: string | undefined;
  let prevSecret: string | undefined;

  beforeEach(() => {
    prevName = process.env.CLOUDINARY_CLOUD_NAME;
    prevKey = process.env.CLOUDINARY_API_KEY;
    prevSecret = process.env.CLOUDINARY_API_SECRET;
  });

  afterEach(() => {
    // Restore env.
    if (prevName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = prevName;
    if (prevKey === undefined) delete process.env.CLOUDINARY_API_KEY;
    else process.env.CLOUDINARY_API_KEY = prevKey;
    if (prevSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = prevSecret;
    clearMockSession();
  });

  it("unauthenticated → 401 UNAUTHORIZED", async () => {
    clearMockSession();
    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "demo-key";
    process.env.CLOUDINARY_API_SECRET = "demo-secret";

    const { status, body } = await callSign({ folder: "products" });
    expect(status).toBe(401);
    assertFail(body);
    expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("missing Cloudinary env → 503 CLOUDINARY_SIGN_FAILED", async () => {
    setMockSession({ role: "admin" });
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    // NEXT_PUBLIC fallback must also be absent for this path.
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const { status, body } = await callSign({ folder: "products" });
    expect(status).toBe(503);
    assertFail(body);
    expect(body.error.code).toBe(ERROR_CODES.CLOUDINARY_SIGN_FAILED);
  });

  it("with env keys → returns signature, timestamp, folder, apiKey, cloudName", async () => {
    setMockSession({ role: "admin" });
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "demo-api-key";
    process.env.CLOUDINARY_API_SECRET = "demo-api-secret";

    const { status, body } = await callSign({ folder: "products" });
    expect(status).toBe(200);
    assertOk(body);
    expect(body.data.folder).toBe("products");
    expect(body.data.apiKey).toBe("demo-api-key");
    expect(body.data.cloudName).toBe("demo-cloud");
    expect(typeof body.data.timestamp).toBe("number");
    expect(body.data.timestamp).toBeGreaterThan(0);
    // SHA1 hex signature: 40 lowercase hex chars.
    expect(body.data.signature).toMatch(/^[a-f0-9]{40}$/);
  });
});
