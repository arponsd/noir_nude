import type { UserRole } from "@/lib/constants";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: UserRole;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    role: UserRole;
    emailVerified: boolean;
    passwordChangedAt?: number;
    iat?: number;
  }
}
