import type { NextAuthConfig } from "next-auth";
import type {} from "next-auth/jwt";
import type { UserRole } from "@/lib/constants";

// Edge-safe NextAuth config: no mongoose, bcrypt, or Node-only imports.
// This is imported by middleware.ts (which runs in Edge Runtime) and by
// the full config below (which runs in Node). Callbacks here only read
// the JWT — they must not touch the database.

const isProd = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token";

export const authConfigEdge: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      const sessionUser = session.user as unknown as {
        id: string;
        role: UserRole;
        emailVerified: boolean;
        email?: string | null;
        name?: string | null;
        image?: string | null;
      };
      if (token.sub) sessionUser.id = token.sub;
      sessionUser.role = (token.role as UserRole) ?? "customer";
      sessionUser.emailVerified = Boolean(token.emailVerified);
      return session;
    },
  },
};
