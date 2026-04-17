import { Category, Product } from "../../src/lib/db/models/index.js";

type SeedVariant = {
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categorySlug: string;
  brand: string;
  basePrice: number;
  comparePrice?: number;
  tags: string[];
  badges: string[];
  skinTypes?: string[];
  ingredients?: string[];
  variants: SeedVariant[];
  isFeatured?: boolean;
};

// Prices are integer paisa. 1 BDT = 100 paisa. e.g. 125000 = 1250 BDT.
const productEntries: SeedProduct[] = [
  {
    name: "Velvet Matte Lipstick",
    slug: "velvet-matte-lipstick",
    description: "A weightless, long-wearing matte lipstick with a velvety finish.",
    shortDescription: "Long-wearing matte lipstick",
    categorySlug: "lipstick",
    brand: "GlowCart",
    basePrice: 85000,
    comparePrice: 99000,
    tags: ["lipstick", "matte", "bestseller"],
    badges: ["bestseller"],
    variants: [
      { name: "Rose Noir", sku: "VML-ROSE-01", price: 85000, stock: 120 },
      { name: "Cherry Bomb", sku: "VML-CHERRY-02", price: 85000, stock: 80 },
      { name: "Mocha", sku: "VML-MOCHA-03", price: 85000, stock: 60 },
    ],
    isFeatured: true,
  },
  {
    name: "Hydra Glow Lip Tint",
    slug: "hydra-glow-lip-tint",
    description: "Buildable sheer tint with hyaluronic acid for all-day hydration.",
    shortDescription: "Hydrating sheer lip tint",
    categorySlug: "lipstick",
    brand: "GlowCart",
    basePrice: 65000,
    tags: ["lipstick", "tint", "hydrating"],
    badges: ["new"],
    variants: [
      { name: "Peach Sorbet", sku: "HGL-PEACH-01", price: 65000, stock: 150 },
      { name: "Berry Crush", sku: "HGL-BERRY-02", price: 65000, stock: 120 },
    ],
  },
  {
    name: "Silk Finish Liquid Foundation",
    slug: "silk-finish-liquid-foundation",
    description: "Medium-coverage liquid foundation with a natural satin finish.",
    shortDescription: "24-hour satin finish foundation",
    categorySlug: "foundation",
    brand: "Lumière",
    basePrice: 185000,
    comparePrice: 225000,
    tags: ["foundation", "liquid", "medium-coverage"],
    badges: ["bestseller"],
    skinTypes: ["normal", "combination"],
    variants: [
      { name: "Porcelain 01", sku: "SFLF-01", price: 185000, stock: 40 },
      { name: "Ivory 02", sku: "SFLF-02", price: 185000, stock: 60 },
      { name: "Beige 03", sku: "SFLF-03", price: 185000, stock: 55 },
      { name: "Honey 04", sku: "SFLF-04", price: 185000, stock: 50 },
      { name: "Caramel 05", sku: "SFLF-05", price: 185000, stock: 40 },
    ],
    isFeatured: true,
  },
  {
    name: "AirWeight Powder Foundation",
    slug: "airweight-powder-foundation",
    description: "Breathable pressed powder foundation, buildable to full coverage.",
    shortDescription: "Breathable pressed powder",
    categorySlug: "foundation",
    brand: "Lumière",
    basePrice: 145000,
    tags: ["foundation", "powder"],
    badges: [],
    variants: [
      { name: "Light", sku: "AWPF-LT", price: 145000, stock: 30 },
      { name: "Medium", sku: "AWPF-MD", price: 145000, stock: 30 },
      { name: "Deep", sku: "AWPF-DP", price: 145000, stock: 30 },
    ],
  },
  {
    name: "Vitamin C Brightening Serum",
    slug: "vitamin-c-brightening-serum",
    description: "15% stabilized vitamin C serum for visibly brighter, even-toned skin.",
    shortDescription: "Daily brightening serum",
    categorySlug: "skincare",
    brand: "DermaLab",
    basePrice: 215000,
    comparePrice: 250000,
    tags: ["serum", "vitamin-c", "brightening"],
    badges: ["bestseller"],
    ingredients: ["Ascorbic Acid", "Ferulic Acid", "Vitamin E"],
    skinTypes: ["normal", "dry", "combination"],
    variants: [
      { name: "30 ml", sku: "VCBS-30", price: 215000, stock: 90 },
      { name: "50 ml", sku: "VCBS-50", price: 320000, stock: 40 },
    ],
    isFeatured: true,
  },
  {
    name: "Ceramide Barrier Repair Cream",
    slug: "ceramide-barrier-repair-cream",
    description: "Rich ceramide-packed cream to restore the skin barrier overnight.",
    shortDescription: "Overnight barrier repair cream",
    categorySlug: "skincare",
    brand: "DermaLab",
    basePrice: 195000,
    tags: ["moisturizer", "ceramide", "barrier"],
    badges: [],
    skinTypes: ["dry", "sensitive"],
    variants: [{ name: "50 ml", sku: "CBRC-50", price: 195000, stock: 70 }],
  },
  {
    name: "Rose Petal Eau de Parfum",
    slug: "rose-petal-eau-de-parfum",
    description: "A modern rose fragrance layered with musk and white tea.",
    shortDescription: "Rose · musk · white tea",
    categorySlug: "fragrance",
    brand: "Maison Aura",
    basePrice: 450000,
    comparePrice: 520000,
    tags: ["fragrance", "rose", "edp"],
    badges: ["featured"],
    variants: [
      { name: "50 ml", sku: "RPEP-50", price: 450000, stock: 25 },
      { name: "100 ml", sku: "RPEP-100", price: 720000, stock: 15 },
    ],
    isFeatured: true,
  },
  {
    name: "Oud Noir Body Mist",
    slug: "oud-noir-body-mist",
    description: "Lightweight body mist with warm oud and amber notes.",
    shortDescription: "Oud · amber body mist",
    categorySlug: "fragrance",
    brand: "Maison Aura",
    basePrice: 125000,
    tags: ["body-mist", "oud"],
    badges: [],
    variants: [{ name: "150 ml", sku: "ONBM-150", price: 125000, stock: 50 }],
  },
  {
    name: "Smokey Eyeshadow Palette",
    slug: "smokey-eyeshadow-palette",
    description: "12-shade eyeshadow palette with mattes, shimmers and glitters.",
    shortDescription: "12-shade smokey palette",
    categorySlug: "eyes",
    brand: "GlowCart",
    basePrice: 175000,
    tags: ["eyeshadow", "palette"],
    badges: ["bestseller"],
    variants: [{ name: "Standard", sku: "SEP-12", price: 175000, stock: 35 }],
  },
  {
    name: "Precision Liquid Eyeliner",
    slug: "precision-liquid-eyeliner",
    description: "Ultra-fine tip liquid eyeliner, waterproof and smudge-proof.",
    shortDescription: "Waterproof liquid liner",
    categorySlug: "eyes",
    brand: "GlowCart",
    basePrice: 55000,
    tags: ["eyeliner", "waterproof"],
    badges: [],
    variants: [
      { name: "Jet Black", sku: "PLE-BLK", price: 55000, stock: 120 },
      { name: "Brown", sku: "PLE-BRN", price: 55000, stock: 60 },
    ],
  },
  {
    name: "Pro Brush Set 10-Piece",
    slug: "pro-brush-set-10-piece",
    description: "Complete 10-piece synthetic brush set with travel pouch.",
    shortDescription: "10-piece synthetic brush set",
    categorySlug: "brushes",
    brand: "GlowCart",
    basePrice: 295000,
    comparePrice: 350000,
    tags: ["brushes", "set"],
    badges: ["new"],
    variants: [{ name: "Standard", sku: "PBS-10", price: 295000, stock: 25 }],
  },
  {
    name: "Argan Repair Hair Mask",
    slug: "argan-repair-hair-mask",
    description: "Deep conditioning hair mask with argan oil and keratin.",
    shortDescription: "Weekly repair hair mask",
    categorySlug: "haircare",
    brand: "DermaLab",
    basePrice: 135000,
    tags: ["haircare", "mask", "argan"],
    badges: [],
    ingredients: ["Argan Oil", "Hydrolyzed Keratin", "Shea Butter"],
    variants: [{ name: "200 ml", sku: "ARHM-200", price: 135000, stock: 80 }],
  },
  {
    name: "Everyday Essentials Gift Box",
    slug: "everyday-essentials-gift-box",
    description: "Curated gift set with a lipstick, mini serum and fragrance sample.",
    shortDescription: "Curated beauty gift box",
    categorySlug: "gifts",
    brand: "GlowCart",
    basePrice: 275000,
    comparePrice: 325000,
    tags: ["gift", "bundle"],
    badges: ["giftable"],
    variants: [{ name: "Gift Box", sku: "EEGB-01", price: 275000, stock: 40 }],
    isFeatured: true,
  },
];

export async function seedProducts(): Promise<{ created: number; skipped: number }> {
  const categories = await Category.find({
    slug: { $in: productEntries.map((p) => p.categorySlug) },
  })
    .select({ slug: 1 })
    .lean();
  const catBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  const existing = await Product.find({ slug: { $in: productEntries.map((p) => p.slug) } })
    .select({ slug: 1 })
    .lean();
  const existingSlugs = new Set(existing.map((p) => p.slug));

  let created = 0;
  let skipped = 0;

  for (const entry of productEntries) {
    if (existingSlugs.has(entry.slug)) {
      skipped++;
      continue;
    }
    const categoryId = catBySlug.get(entry.categorySlug);
    if (!categoryId) {
      skipped++;
      continue;
    }

    await Product.create({
      name: entry.name,
      slug: entry.slug,
      description: entry.description,
      shortDescription: entry.shortDescription,
      categoryId,
      brand: entry.brand,
      basePrice: entry.basePrice,
      comparePrice: entry.comparePrice,
      tags: entry.tags,
      badges: entry.badges,
      skinTypes: entry.skinTypes ?? [],
      ingredients: entry.ingredients ?? [],
      images: [
        {
          url: `https://picsum.photos/seed/${entry.slug}/800/800`,
          alt: entry.name,
          order: 0,
        },
      ],
      variants: entry.variants.map((v) => ({
        name: v.name,
        sku: v.sku,
        price: v.price,
        comparePrice: v.comparePrice,
        stock: v.stock,
        reservedStock: 0,
        isActive: true,
      })),
      isFeatured: entry.isFeatured ?? false,
      isActive: true,
      seoMeta: {
        title: `${entry.name} — GlowCart`,
        description: entry.shortDescription,
      },
    });
    created++;
  }

  return { created, skipped };
}
