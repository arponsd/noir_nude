import BannersAdminClient from "@/components/admin/banners/BannersAdminClient";
import { listBannersAdminService } from "@/lib/services/admin-banner";
import type { AdminBannerRow } from "@/components/admin/banners/BannersGrid";
import type { Banner } from "@/types/api/banner";

export const metadata = { title: "Banners — Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

function toRow(b: Banner): AdminBannerRow {
  const row: AdminBannerRow = {
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    order: b.order,
    isActive: b.isActive,
  };
  if (b.subtitle) row.subtitle = b.subtitle;
  if (b.href) row.href = b.href;
  if (b.cta) row.cta = b.cta;
  if (b.publishFrom) row.publishFrom = b.publishFrom;
  if (b.publishUntil) row.publishUntil = b.publishUntil;
  return row;
}

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const listing = await listBannersAdminService({ page, limit: PAGE_SIZE });
  const banners = listing.items.map(toRow);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl tracking-[-0.01em] text-[var(--ink)]">Banners</h1>
        <p className="text-sm text-[var(--ink-soft)] tabular-nums">
          {listing.total.toLocaleString()} total
        </p>
      </header>

      <BannersAdminClient banners={banners} />
    </div>
  );
}
