import type { NextAuthConfig } from "next-auth";
import type {} from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { connectDb } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { env } from "@/lib/env";
import logger from "@/lib/utils/logger";
import { loginSchema } from "@/lib/validators/auth";
import type { UserRole } from "@/lib/constants";
import { verifyPassword } from "./password";
import { authConfigEdge } from "./config.edge";

const googleProvider =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

export const authConfig: NextAuthConfig = {
  ...authConfigEdge,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        await connectDb();
        const user = await User.findOne({
          email: parsed.data.email,
          deletedAt: null,
        })
          .select("+passwordHash +emailVerified")
          .lean();

        if (!user || !user.isActive) return null;

        const passwordMatch = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          emailVerified: Boolean(user.emailVerified),
        };
      },
    }),
    ...googleProvider,
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.role = user.role;
        // reason: AdapterUser.emailVerified is Date | null; our domain treats it as boolean.
        token.emailVerified =
          typeof user.emailVerified === "boolean"
            ? user.emailVerified
            : user.emailVerified instanceof Date;
        return token;
      }

      if (trigger === "update" || !token.sub) {
        return token;
      }

      try {
        await connectDb();
        const fresh = await User.findOne({ _id: token.sub, deletedAt: null })
          .select("role emailVerified isActive")
          .lean();

        if (!fresh || !fresh.isActive) {
          // reason: returning an empty token triggers session invalidation downstream.
          return {
            ...token,
            role: "customer" as UserRole,
            emailVerified: false,
            sub: undefined,
          };
        }

        token.role = fresh.role as UserRole;
        token.emailVerified = Boolean(fresh.emailVerified);
      } catch (err) {
        logger.warn({ err }, "auth.jwt refresh failed");
      }
      return token;
    },
    async session({ session, token }) {
      // reason: in jwt strategy, session.user is our augmented shape — AdapterUser
      // intersection comes from database strategy which we do not use.
      const sessionUser = session.user as unknown as {
        id: string;
        role: UserRole;
        emailVerified: boolean;
        email?: string | null;
        name?: string | null;
        image?: string | null;
      };
      if (token.sub) sessionUser.id = token.sub;
      sessionUser.role = token.role;
      sessionUser.emailVerified = token.emailVerified;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      logger.info({ userId: user.id }, "auth.signIn");
    },
    async signOut(message) {
      const userId =
        "token" in message && message.token?.sub
          ? message.token.sub
          : "session" in message && message.session && "userId" in message.session
            ? message.session.userId
            : undefined;
      logger.info({ userId }, "auth.signOut");
    },
  },
};
