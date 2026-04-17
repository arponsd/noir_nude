import { defineConfig } from "vitest/config";
import path from "node:path";

const integration = process.env.VITEST_SCOPE === "integration";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: integration ? "node" : "jsdom",
    include: integration ? ["tests/integration/**/*.test.ts"] : ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: integration ? ["tests/integration/setup.ts"] : ["tests/unit/setup.ts"],
    testTimeout: integration ? 30_000 : 5_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      exclude: ["node_modules", ".next", "tests", "*.config.*", "src/types/**", "coverage"],
    },
  },
});
