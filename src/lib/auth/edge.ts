import NextAuth from "next-auth";
import { authConfigEdge } from "./config.edge";

// Edge-runtime NextAuth instance. Use this in middleware.ts only.
// Route handlers and Server Actions must use @/lib/auth (the full, Node-side config).

export const { auth } = NextAuth(authConfigEdge);
