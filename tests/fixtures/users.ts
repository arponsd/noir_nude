export type FixtureUser = {
  role: "customer" | "admin" | "manager" | "support";
  email: string;
  password: string;
  name: string;
};

// reason: seed-aligned with database agent. Admin/manager/support match the seeded
// admin@example.com / manager@example.com / support@example.com accounts. Customer
// uses a +customer alias. If database seed diverges, reconcile here.
export const fixtureUsers: Record<FixtureUser["role"], FixtureUser> = {
  customer: {
    role: "customer",
    email: "playwright+customer@example.com",
    password: "Pw!TestPass2026",
    name: "Playwright Customer",
  },
  admin: {
    role: "admin",
    email: "admin@example.com",
    password: "Pw!TestPass2026",
    name: "Admin User",
  },
  manager: {
    role: "manager",
    email: "manager@example.com",
    password: "Pw!TestPass2026",
    name: "Manager User",
  },
  support: {
    role: "support",
    email: "support@example.com",
    password: "Pw!TestPass2026",
    name: "Support User",
  },
};
