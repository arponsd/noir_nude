import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type RunAxeOptions = {
  include?: string | string[];
  exclude?: string | string[];
};

export async function runAxe(page: Page, options: RunAxeOptions = {}): Promise<void> {
  let builder = new AxeBuilder({ page });

  if (options.include) {
    const includes = Array.isArray(options.include) ? options.include : [options.include];
    for (const sel of includes) builder = builder.include(sel);
  }
  if (options.exclude) {
    const excludes = Array.isArray(options.exclude) ? options.exclude : [options.exclude];
    for (const sel of excludes) builder = builder.exclude(sel);
  }

  const results = await builder.analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );

  if (blocking.length > 0) {
    const detail = blocking
      .map((v) => {
        const nodes = v.nodes
          .slice(0, 3)
          .map((n) => `      - ${n.target.join(" ")}`)
          .join("\n");
        return `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${nodes}`;
      })
      .join("\n\n");
    throw new Error(
      `Axe found ${blocking.length} serious/critical accessibility violation(s) on ${page.url()}:\n${detail}`,
    );
  }

  expect(blocking, "no serious/critical axe violations").toEqual([]);
}
