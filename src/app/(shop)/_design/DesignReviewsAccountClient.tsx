"use client";

import * as React from "react";
import { StarRating } from "@/components/reviews/StarRating";
import { StarRatingInput } from "@/components/reviews/StarRatingInput";
import { VerifiedBadge } from "@/components/reviews/VerifiedBadge";
import { HelpfulVote } from "@/components/reviews/HelpfulVote";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewStats } from "@/components/reviews/ReviewStats";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import type { ReviewDTO } from "@/components/reviews/types";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ProfileForm } from "@/components/account/ProfileForm";
import { NotificationsForm } from "@/components/account/NotificationsForm";
import { AccountDangerZone } from "@/components/account/AccountDangerZone";

const SAMPLE_REVIEWS: ReviewDTO[] = [
  {
    id: "r-1",
    productId: "p-1",
    rating: 5,
    title: "Best serum I have tried",
    body: "Feels light, absorbs fast, and my skin looks plumper after two weeks of use.\nWill re-buy!",
    author: { name: "Ayesha R.", id: "u-1" },
    verified: true,
    createdAt: "2026-03-18T10:00:00Z",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80",
        alt: "Serum bottle on vanity",
      },
      {
        url: "https://images.unsplash.com/photo-1522335789203-aaa741b58c4d?auto=format&fit=crop&w=600&q=80",
        alt: "Application swatch",
      },
    ],
    skinTypeAtReview: "combination",
    helpfulCount: 12,
    adminReply: {
      author: "GlowCart",
      body: "Thank you Ayesha — so glad you are enjoying it.",
      repliedAt: "2026-03-20T09:30:00Z",
    },
    userVoted: false,
  },
  {
    id: "r-2",
    productId: "p-1",
    rating: 3.5,
    title: "Nice but pricey",
    body: "Good formula, the price feels steep compared to similar options.",
    author: { name: "Tania S." },
    verified: false,
    createdAt: "2026-03-10T10:00:00Z",
    helpfulCount: 3,
  },
];

const STATS = {
  avg: 4.3,
  count: 27,
  byStar: { 5: 16, 4: 6, 3: 3, 2: 1, 1: 1 } as Record<1 | 2 | 3 | 4 | 5, number>,
};

export default function DesignReviewsAccountClient() {
  const [rating, setRating] = React.useState(4);
  const [page, setPage] = React.useState(1);
  const [avatar, setAvatar] = React.useState<string | null>(null);

  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Star rating (display + input)
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <StarRating value={3.5} size="sm" />
          <StarRating value={4} size="md" />
          <StarRating value={4.5} size="lg" />
          <VerifiedBadge />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <StarRatingInput value={rating} onChange={setRating} size="lg" />
          <span className="text-xs text-[var(--muted)]">Selected: {rating}</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Helpful vote
        </p>
        <div className="mt-3 flex items-center gap-3">
          <HelpfulVote count={12} voted={false} onToggle={async () => undefined} />
          <HelpfulVote count={13} voted onToggle={async () => undefined} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Review stats
        </p>
        <div className="mt-3 max-w-xl">
          <ReviewStats avg={STATS.avg} count={STATS.count} byStar={STATS.byStar} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Review list
        </p>
        <div className="mt-3 max-w-2xl rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-6">
          <ReviewList
            reviews={SAMPLE_REVIEWS}
            total={27}
            page={page}
            limit={2}
            onPageChange={setPage}
            onHelpful={async () => undefined}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Review card (single)
        </p>
        <div className="mt-3 max-w-2xl rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-6">
          <ReviewCard review={SAMPLE_REVIEWS[0]!} onHelpful={async () => undefined} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Review form
        </p>
        <div className="mt-3 max-w-xl">
          <ReviewForm
            onSubmit={async (values) => {
              await new Promise((r) => setTimeout(r, 400));
              void values;
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Avatar uploader
        </p>
        <div className="mt-3">
          <AvatarUploader value={avatar} name="Ayesha Rahman" onChange={setAvatar} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Profile form
        </p>
        <div className="mt-3 max-w-2xl">
          <ProfileForm
            defaultValues={{
              name: "Ayesha Rahman",
              phone: "+8801712345678",
              skinType: "combination",
            }}
            onSubmit={async (values) => {
              await new Promise((r) => setTimeout(r, 400));
              void values;
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Notifications form
        </p>
        <div className="mt-3 max-w-xl">
          <NotificationsForm
            defaultValues={{ orderUpdates: true, promos: false, newsletter: true }}
            onSubmit={async (values) => {
              await new Promise((r) => setTimeout(r, 300));
              void values;
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Account danger zone
        </p>
        <div className="mt-3 max-w-2xl">
          <AccountDangerZone
            onDelete={async () => {
              await new Promise((r) => setTimeout(r, 400));
            }}
          />
        </div>
      </div>
    </div>
  );
}
