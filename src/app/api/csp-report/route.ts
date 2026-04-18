import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // reason: pino's worker transport is unstable in Next dev/edge; use console directly
    // for CSP reports so the endpoint never crashes the process.
    console.warn("[csp-violation]", JSON.stringify(body));
  } catch {
    // body may not be JSON; drop silently
  }
  return new NextResponse(null, { status: 204 });
}
