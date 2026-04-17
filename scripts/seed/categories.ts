import { Category } from "../../src/lib/db/models/index.js";

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  order: number;
};

const seedCategories: SeedCategory[] = [
  {
    name: "Lipstick",
    slug: "lipstick",
    description: "Matte, satin and glossy lip colour.",
    order: 1,
  },
  {
    name: "Foundation",
    slug: "foundation",
    description: "Liquid, powder and cushion foundation.",
    order: 2,
  },
  {
    name: "Skincare",
    slug: "skincare",
    description: "Cleansers, serums and moisturizers.",
    order: 3,
  },
  {
    name: "Fragrance",
    slug: "fragrance",
    description: "Perfumes, eau de toilette and body mists.",
    order: 4,
  },
  { name: "Eyes", slug: "eyes", description: "Eyeshadow, eyeliner and mascara.", order: 5 },
  { name: "Brushes", slug: "brushes", description: "Face, eye and lip brushes.", order: 6 },
  {
    name: "Haircare",
    slug: "haircare",
    description: "Shampoos, conditioners and treatments.",
    order: 7,
  },
  { name: "Gifts", slug: "gifts", description: "Curated gift sets and bundles.", order: 8 },
];

export async function seedCategories_(): Promise<{ created: number; skipped: number }> {
  const existing = await Category.find({ slug: { $in: seedCategories.map((c) => c.slug) } })
    .select({ slug: 1 })
    .lean();
  const existingSlugs = new Set(existing.map((c) => c.slug));

  let created = 0;
  let skipped = 0;

  for (const entry of seedCategories) {
    if (existingSlugs.has(entry.slug)) {
      skipped++;
      continue;
    }
    await Category.create({
      name: entry.name,
      slug: entry.slug,
      description: entry.description,
      order: entry.order,
      isActive: true,
      seoMeta: { title: `${entry.name} — GlowCart`, description: entry.description },
    });
    created++;
  }

  return { created, skipped };
}

export { seedCategories_ as seedCategories };
