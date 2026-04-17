import Link from "next/link";
import { adminListPendingReviews } from "@/lib/services/review";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin · Pending reviews",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const data = await adminListPendingReviews({ page, limit: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
            Moderation
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em]">
            Pending reviews ({data.total})
          </h1>
        </div>
      </header>

      {data.items.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center text-[var(--ink-soft)]">
          No reviews awaiting moderation.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]">
          <table className="min-w-full divide-y divide-[var(--line)] text-sm">
            <thead className="bg-[var(--bg-alt)] text-xs tracking-wide text-[var(--ink-soft)] uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Reviewer</th>
                <th className="px-4 py-3 text-left font-medium">Rating</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {data.items.map((review) => (
                <tr key={review.id}>
                  <td className="px-4 py-3">
                    {review.productSlug ? (
                      <Link
                        href={`/products/${review.productSlug}`}
                        className="text-[var(--ink)] underline-offset-4 hover:underline"
                      >
                        {review.productSlug}
                      </Link>
                    ) : (
                      <span className="text-[var(--ink-soft)]">{review.productId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{review.authorName}</td>
                  <td className="px-4 py-3 tabular-nums">{review.rating}/5</td>
                  <td className="px-4 py-3">{review.title}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)] tabular-nums">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/reviews/${review.id}`}>Review</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-[var(--ink-soft)]">
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm" disabled={data.page <= 1}>
              <Link href={`/admin/reviews?page=${data.page - 1}`}>Previous</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" disabled={data.page >= data.totalPages}>
              <Link href={`/admin/reviews?page=${data.page + 1}`}>Next</Link>
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
