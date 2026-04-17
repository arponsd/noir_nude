import { NextResponse } from "next/server";
import logger from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logger.warn({ csp: body }, "CSP violation reported");
  } catch {
    // body may not be JSON; drop silently
  }
  return new NextResponse(null, { status: 204 });
}
