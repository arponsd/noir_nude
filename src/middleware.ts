import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/constants";

// TODO(phase-1.5): wire rate-limit enforcement in route handlers once auth routes land.

const ADMIN_ROLES: readonly UserRole[] = ["admin", "manager", "support"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAdmin = nextUrl.pathname.startsWith("/admin");
  const isAccount = nextUrl.pathname.startsWith("/account");
  const isCheckout = nextUrl.pathname === "/checkout";

  if (!isAdmin && !isAccount && !isCheckout) {
    return NextResponse.next();
  }

  const session = req.auth;
  if (!session || !session.user) {
    const loginUrl = new URL("/login", nextUrl);
    const nextPath = nextUrl.pathname + nextUrl.search;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin) {
    const role = session.user.role;
    if (!ADMIN_ROLES.includes(role)) {
      const forbidden = new URL("/403", nextUrl);
      return NextResponse.rewrite(forbidden);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/checkout", "/admin/:path*"],
};
