import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listCategoryTreeService } from "@/lib/services/category";
import { listProductsService } from "@/lib/services/product";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const tree = await listCategoryTreeService();
    const flat: { slug: string }[] = [];
    for (const root of tree) {
      flat.push({ slug: root.slug });
      for (const child of root.children) flat.push({ slug: child.slug });
    }
    categoryRoutes = flat.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    categoryRoutes = [];
  }

  try {
    // First page gives total pages; then walk to enumerate all slugs.
    const first = await listProductsService({ page: 1, limit: 100 });
    const items = [...first.items];
    for (let p = 2; p <= first.totalPages && p <= 20; p += 1) {
      // reason: hard cap pages at 20 (=2000 products) to bound sitemap work.
      const next = await listProductsService({ page: p, limit: 100 });
      items.push(...next.items);
    }
    productRoutes = items.map((item) => ({
      url: `${base}/products/${item.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
