import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ProductGrid from "@/components/shop/ProductGrid";
import { toCardDTOs } from "@/components/shop/adapters";
import { Button } from "@/components/ui/button";
import { NotFoundError } from "@/lib/api/response";
import { getCategoryWithProductsService } from "@/lib/services/category";

interface Params {
  slug: string;
}

async function safeGet(slug: string) {
  try {
    return await getCategoryWithProductsService(slug, 24);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await safeGet(slug);
  if (!category) return { title: "Category not found" };

  const title = category.seoMeta?.title ?? `${category.name} — GlowCart`;
  const description =
    category.seoMeta?.description ?? category.description ?? `Shop ${category.name}`;
  const ogImage = category.seoMeta?.ogImage ?? category.image;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
  return metadata;
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const category = await safeGet(slug);
  if (!category) notFound();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: category.name },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  const bgImage =
    category.image ?? `https://picsum.photos/seed/glowcart-cat-${category.slug}/1600/800`;

  return (
    <>
      <Script
        id="ld-breadcrumb"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="relative isolate overflow-hidden border-b border-[var(--line)]">
        <Image src={bgImage} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[var(--ink)]/55" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <Breadcrumbs
            items={breadcrumbItems}
            className="text-[var(--bg)]/80 [&_a]:text-[var(--bg)]/80 [&_a:hover]:text-white [&_span[aria-current]]:text-white"
          />
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.02em] text-white md:text-6xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-4 max-w-2xl text-[var(--bg)]/85">{category.description}</p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        {category.products.length > 0 ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <p className="text-sm text-[var(--ink-soft)] tabular-nums">
                Showing {category.products.length} products
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/products?category=${encodeURIComponent(category.slug)}`}>
                  Browse all {category.name}
                </Link>
              </Button>
            </div>
            <div className="mt-8">
              <ProductGrid products={toCardDTOs(category.products)} columns={4} />
            </div>
          </>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
            <p className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
              Nothing in this category yet.
            </p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Check back soon — new products arrive every week.
            </p>
            <div className="mt-6">
              <Button asChild variant="secondary">
                <Link href="/products">Shop all</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";
