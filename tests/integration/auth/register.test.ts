import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { connectDb } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { AuthToken } from "@/lib/auth/token-store";
import { ERROR_CODES } from "@/lib/constants";

type RegisterSuccess = { ok: true; data: { userId: string; email: string } };
type RegisterFailure = { ok: false; error: { code: string; message: string } };
type RegisterBody = RegisterSuccess | RegisterFailure;

// reason: use a per-call IP so the module-level authLimiter's bucket (in-memory,
// shared across tests in a run) does not trip the 5/min limit on this route.
let ipCounter = 0;
function buildRequest(body: unknown): Request {
  ipCounter += 1;
  const ip = `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

async function readJson(res: Response): Promise<RegisterBody> {
  return (await res.json()) as RegisterBody;
}

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await connectDb();
  });

  it("happy path: creates user (emailVerified=false) and an email_verify AuthToken", async () => {
    const res = await POST(
      buildRequest({
        name: "Happy User",
        email: "happy+1@example.com",
        password: "Zx!9aQpm.Vr34K",
      }),
    );
    expect(res.status).toBe(201);

    const body = await readJson(res);
    expect(body.ok).toBe(true);
    if (!body.ok) throw new Error("expected ok");

    expect(body.data.email).toBe("happy+1@example.com");
    expect(body.data.userId).toBeTypeOf("string");

    const user = await User.findById(body.data.userId).lean();
    expect(user).not.toBeNull();
    expect(user!.email).toBe("happy+1@example.com");
    expect(user!.emailVerified).toBe(false);
    expect(user!.role).toBe("customer");

    const tokens = await AuthToken.find({ userId: user!._id, type: "email_verify" }).lean();
    expect(tokens.length).toBe(1);
    expect(tokens[0]!.usedAt).toBeNull();
  });

  it("duplicate email -> 400 EMAIL_TAKEN", async () => {
    const email = "dupe@example.com";
    const first = await POST(
      buildRequest({
        name: "First",
        email,
        password: "Zx!9aQpm.Vr34K",
      }),
    );
    expect(first.status).toBe(201);

    const second = await POST(
      buildRequest({
        name: "Second",
        email,
        password: "Zx!9aQpm.Vr34K",
      }),
    );
    expect(second.status).toBe(400);

    const body = await readJson(second);
    expect(body.ok).toBe(false);
    if (body.ok) throw new Error("expected failure");
    expect(body.error.code).toBe(ERROR_CODES.EMAIL_TAKEN);
  });

  it("weak password -> 400 VALIDATION_FAILED and no user persisted", async () => {
    const res = await POST(
      buildRequest({
        name: "Weak",
        email: "weak@example.com",
        password: "password12",
      }),
    );
    expect(res.status).toBe(400);

    const body = await readJson(res);
    expect(body.ok).toBe(false);
    if (body.ok) throw new Error("expected failure");
    expect(body.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);

    const persisted = await User.findOne({ email: "weak@example.com" }).lean();
    expect(persisted).toBeNull();
  });

  it("malformed body (missing fields) -> 400 VALIDATION_FAILED via zod", async () => {
    const res = await POST(buildRequest({ email: "no-password@example.com" }));
    expect(res.status).toBe(400);

    const body = await readJson(res);
    expect(body.ok).toBe(false);
    if (body.ok) throw new Error("expected failure");
    expect(body.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
  });
});
