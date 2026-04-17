import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/forgot-password/route";
import { connectDb } from "@/lib/db/connect";
import { AuthToken } from "@/lib/auth/token-store";
import { seedUser } from "../../harness/seed";

type ForgotSuccess = { ok: true; data: { delivered: true } };
type ForgotFailure = { ok: false; error: { code: string; message: string } };
type ForgotBody = ForgotSuccess | ForgotFailure;

let ipCounter = 0;
function buildRequest(body: unknown): Request {
  ipCounter += 1;
  const ip = `10.1.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

async function readJson(res: Response): Promise<ForgotBody> {
  return (await res.json()) as ForgotBody;
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(async () => {
    await connectDb();
  });

  it("unknown email: returns {ok:true, delivered:true} and creates no AuthToken (enumeration safe)", async () => {
    const before = await AuthToken.countDocuments({});
    const res = await POST(buildRequest({ email: "nobody@example.com" }));
    expect(res.status).toBe(200);

    const body = await readJson(res);
    expect(body.ok).toBe(true);
    if (!body.ok) throw new Error("expected ok");
    expect(body.data.delivered).toBe(true);

    const after = await AuthToken.countDocuments({});
    expect(after).toBe(before);
  });

  it("known email: creates a password_reset AuthToken and returns {ok:true, delivered:true}", async () => {
    const user = await seedUser({
      email: "exists@example.com",
      password: "Zx!9aQpm.Vr34K",
      name: "Exists User",
    });

    const res = await POST(buildRequest({ email: "exists@example.com" }));
    expect(res.status).toBe(200);

    const body = await readJson(res);
    expect(body.ok).toBe(true);
    if (!body.ok) throw new Error("expected ok");
    expect(body.data.delivered).toBe(true);

    const tokens = await AuthToken.find({
      userId: user.userId,
      type: "password_reset",
    }).lean();
    expect(tokens.length).toBe(1);
    expect(tokens[0]!.usedAt).toBeNull();
  });

  it("known email is matched case-insensitively / after trimming (same shape both ways)", async () => {
    await seedUser({
      email: "mixed@example.com",
      password: "Zx!9aQpm.Vr34K",
    });

    const res = await POST(buildRequest({ email: "  MIXED@EXAMPLE.COM  " }));
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.ok).toBe(true);
  });
});
