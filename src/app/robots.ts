import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = (env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/category"],
        disallow: ["/admin", "/account", "/checkout", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
