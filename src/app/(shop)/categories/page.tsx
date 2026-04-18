import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { listCategoryTreeService } from "@/lib/services/category";
import type { CategoryTree } from "@/types/api/categories";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse every category — skincare, makeup, fragrance, and more.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const tree: CategoryTree[] = await listCategoryTreeService();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />

      <header className="mt-6 max-w-2xl">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Shop by category
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
          Every aisle, one page
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Curated edits by concern, ritual, and finish. Pick a starting point or browse all
          products.
        </p>
      </header>

      {tree.length === 0 ? (
        <div className="mt-12 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center text-[var(--ink-soft)]">
          No categories available yet. Check back soon.
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tree.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/category/${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Image
                  src={cat.image ?? `https://picsum.photos/seed/glowcart-cat-${cat.slug}/600/750`}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--ink)]/70 to-transparent p-3"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span className="text-sm font-medium text-white drop-shadow">{cat.name}</span>
                  {cat.children.length > 0 ? (
                    <span className="mt-0.5 block text-xs text-white/80 drop-shadow">
                      {cat.children.length} sub-categories
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          href="/products"
          className="text-sm text-[var(--ink-soft)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Or browse all products →
        </Link>
      </div>
    </div>
  );
}
