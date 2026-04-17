import mongoose from "mongoose";
import { Product, Review, User } from "../../src/lib/db/models/index.js";

const TARGET_REVIEWS_PER_PRODUCT = 4;

type SeedReviewTemplate = {
  rating: number;
  title: string;
  body: string;
  skinType: "normal" | "dry" | "oily" | "combination" | "sensitive" | null;
};

const TEMPLATES: SeedReviewTemplate[] = [
  {
    rating: 5,
    title: "Absolutely love it",
    body: "This product exceeded every expectation. The texture, scent and finish all feel premium. I reach for it every single day and plan to repurchase as soon as it runs out.",
    skinType: "combination",
  },
  {
    rating: 5,
    title: "Worth every taka",
    body: "I was skeptical given the price point, but the quality justifies it. Noticed a visible difference within the first week and my makeup sits so much better now.",
    skinType: "normal",
  },
  {
    rating: 4,
    title: "Very good with a tiny note",
    body: "Overall a solid product that delivers on its promise. The only small gripe is the packaging — would love a pump dispenser — but the formula itself is lovely.",
    skinType: "dry",
  },
  {
    rating: 4,
    title: "Great daily option",
    body: "This fits right into my daily routine with no fuss. Comfortable all day, no irritation, and the finish looks natural in every light. Would recommend to a friend.",
    skinType: "sensitive",
  },
  {
    rating: 5,
    title: "Repurchase-worthy",
    body: "Already on my second bottle. It works especially well in the humid Dhaka weather — nothing pills or slides off. Genuinely one of the best I have tried this year.",
    skinType: "oily",
  },
];

type LeanProduct = {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  isFeatured?: boolean;
};

type LeanUser = {
  _id: mongoose.Types.ObjectId;
  email: string;
  skinType?: string;
};

export async function seedReviews(): Promise<{ created: number; skipped: number }> {
  const adminEmails = ["admin@example.com", "manager@example.com", "support@example.com"];
  const admins = await User.find({ email: { $in: adminEmails } })
    .select({ email: 1, skinType: 1 })
    .lean<LeanUser[]>();

  if (admins.length === 0) {
    console.log("[seed][reviews] no admin users found; skipping");
    return { created: 0, skipped: 0 };
  }

  const products = await Product.find({ isFeatured: true, isActive: true })
    .select({ slug: 1, name: 1, isFeatured: 1 })
    .lean<LeanProduct[]>();

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await Review.countDocuments({
      productId: product._id,
      isApproved: true,
    });
    if (existing >= TARGET_REVIEWS_PER_PRODUCT) {
      skipped++;
      continue;
    }

    const toCreate = TARGET_REVIEWS_PER_PRODUCT - existing;
    for (let i = 0; i < toCreate; i++) {
      const template = TEMPLATES[i % TEMPLATES.length];
      const admin = admins[i % admins.length];
      if (!template || !admin) continue;
      // reason: seed reviews are demo data — real reviews require a real order belonging
      // to the reviewer. We synthesize per-review orderIds so the unique
      // (userId, productId, orderId) index never blocks seeding.
      const syntheticOrderId = new mongoose.Types.ObjectId();
      await Review.create({
        productId: product._id,
        userId: admin._id,
        orderId: syntheticOrderId,
        rating: template.rating,
        title: template.title,
        body: template.body,
        skinTypeAtReview: template.skinType,
        isVerified: true,
        isApproved: true,
      });
      created++;
    }
  }

  if (created > 0) {
    console.log(`[seed][reviews] demo data: created ${created} synthetic reviews`);
  }
  return { created, skipped };
}
