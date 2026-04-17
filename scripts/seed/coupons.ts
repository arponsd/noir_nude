import { Coupon } from "../../src/lib/db/models/index.js";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

type SeedCoupon = {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
};

const seedCoupons: SeedCoupon[] = [
  { code: "WELCOME10", type: "percentage", value: 10, minOrderAmount: 50_000, usageLimit: 1000 },
  { code: "SHIP0", type: "free_shipping", value: 0 },
  { code: "FLAT500", type: "fixed", value: 50_000, minOrderAmount: 100_000 },
  { code: "VIP20", type: "percentage", value: 20, maxDiscount: 200_000 },
];

export async function seedCoupons_(): Promise<{ created: number; skipped: number }> {
  const codes = seedCoupons.map((c) => c.code);
  const existing = await Coupon.find({ code: { $in: codes } })
    .select({ code: 1 })
    .lean();
  const existingCodes = new Set(existing.map((c) => c.code));

  let created = 0;
  let skipped = 0;

  const now = new Date();
  const validUntil = new Date(now.getTime() + NINETY_DAYS_MS);

  for (const entry of seedCoupons) {
    if (existingCodes.has(entry.code)) {
      skipped++;
      continue;
    }
    await Coupon.create({
      code: entry.code,
      type: entry.type,
      value: entry.value,
      minOrderAmount: entry.minOrderAmount,
      maxDiscount: entry.maxDiscount,
      usageLimit: entry.usageLimit,
      perUserLimit: entry.perUserLimit,
      validFrom: now,
      validUntil,
      isActive: true,
    });
    created++;
  }

  return { created, skipped };
}

export { seedCoupons_ as seedCoupons };
