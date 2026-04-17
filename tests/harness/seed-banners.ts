import type { Types } from "mongoose";

import { connectDb } from "@/lib/db/connect";
import { Banner, type BannerDoc } from "@/lib/db/models/Banner";

/**
 * Minimal banner seeder for admin integration tests. Inserts N banners with
 * deterministic titles + ascending `order` values. Returns the hydrated docs.
 */

export type SeedBannerInput = {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  cta?: string;
  order?: number;
  isActive?: boolean;
  publishFrom?: Date | null;
  publishUntil?: Date | null;
  deletedAt?: Date | null;
};

export type SeededBanner = {
  id: string;
  title: string;
  order: number;
  isActive: boolean;
};

function toSeeded(doc: BannerDoc): SeededBanner {
  const raw = doc as unknown as {
    _id: Types.ObjectId;
    title: string;
    order?: number;
    isActive?: boolean;
  };
  return {
    id: raw._id.toString(),
    title: raw.title,
    order: raw.order ?? 0,
    isActive: raw.isActive ?? true,
  };
}

export async function seedBanners(
  count: number,
  overrides: SeedBannerInput[] = [],
): Promise<SeededBanner[]> {
  await connectDb();
  const out: SeededBanner[] = [];
  for (let i = 0; i < count; i += 1) {
    const o = overrides[i] ?? {};
    const doc = await Banner.create({
      title: o.title ?? `Banner ${i + 1}`,
      subtitle: o.subtitle,
      imageUrl: o.imageUrl ?? `https://res.cloudinary.com/demo/image/upload/banner-${i + 1}.jpg`,
      href: o.href,
      cta: o.cta,
      order: o.order ?? i,
      isActive: o.isActive ?? true,
      publishFrom: o.publishFrom ?? null,
      publishUntil: o.publishUntil,
      deletedAt: o.deletedAt ?? null,
    });
    out.push(toSeeded(doc));
  }
  return out;
}
