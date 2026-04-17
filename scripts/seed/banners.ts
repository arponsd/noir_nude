import { Banner } from "../../src/lib/db/models/index.js";

type SeedBanner = {
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  cta: string;
  order: number;
};

const seedBanners: SeedBanner[] = [
  {
    title: "Glow Up Your Everyday",
    subtitle: "New arrivals in lipstick, foundation, and skincare.",
    imageUrl: "/banners/glow-up.jpg",
    href: "/products?badges=new",
    cta: "Shop New",
    order: 1,
  },
  {
    title: "Skincare Essentials",
    subtitle: "Cleansers, serums, and moisturizers — curated for every skin type.",
    imageUrl: "/banners/skincare-essentials.jpg",
    href: "/categories/skincare",
    cta: "Explore Skincare",
    order: 2,
  },
  {
    title: "Free Delivery over ৳2000",
    subtitle: "Cash on delivery available across Bangladesh.",
    imageUrl: "/banners/free-delivery.jpg",
    href: "/products",
    cta: "Shop All",
    order: 3,
  },
];

export async function seedBanners_(): Promise<{ created: number; skipped: number }> {
  const titles = seedBanners.map((b) => b.title);
  const existing = await Banner.find({ title: { $in: titles } })
    .select({ title: 1 })
    .lean();
  const existingTitles = new Set(existing.map((b) => b.title));

  let created = 0;
  let skipped = 0;

  const now = new Date();
  for (const entry of seedBanners) {
    if (existingTitles.has(entry.title)) {
      skipped++;
      continue;
    }
    await Banner.create({
      title: entry.title,
      subtitle: entry.subtitle,
      imageUrl: entry.imageUrl,
      href: entry.href,
      cta: entry.cta,
      order: entry.order,
      isActive: true,
      publishFrom: now,
    });
    created++;
  }

  return { created, skipped };
}

export { seedBanners_ as seedBanners };
