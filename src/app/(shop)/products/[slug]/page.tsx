import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Star } from "lucide-react";
import BadgeChip from "@/components/shop/BadgeChip";
import ImageGallery from "@/components/shop/ImageGallery";
import PriceBlock from "@/components/shop/PriceBlock";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductPurchasePanel from "@/components/shop/ProductPurchasePanel";
import ProductReviews, { ProductReviewsFallback } from "@/components/shop/ProductReviews";
import { toCardDTOs } from "@/components/shop/adapters";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotFoundError } from "@/lib/api/response";
import { CURRENCY } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { getProductDetailService, getRelatedProductsService } from "@/lib/services/product";

interface Params {
  slug: string;
}

async function safeGetProduct(slug: string) {
  try {
    return await getProductDetailService(slug);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeGetProduct(slug);
  if (!product) return { title: "Product not found" };

  const title = product.seoMeta.title ?? `${product.name} — ${product.brand}`;
  const description = product.seoMeta.description ?? product.shortDescription ?? product.name;
  const ogImage = product.seoMeta.ogImage ?? product.images[0]?.url;

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

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await safeGetProduct(slug);
  if (!product) notFound();

  const [related, session] = await Promise.all([getRelatedProductsService(slug, 4), auth()]);
  const userId = session?.user?.id ?? null;
  const isAuthenticated = Boolean(userId);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    ...(product.category
      ? [{ label: product.category.name, href: `/category/${product.category.slug}` }]
      : []),
    { label: product.name },
  ];

  const totalStock = product.fullVariants.reduce(
    (sum, v) => sum + Math.max(0, v.stock - v.reservedStock),
    0,
  );
  const inStock = totalStock > 0;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: product.brand },
    sku: product.fullVariants[0]?.sku,
    offers: {
      "@type": "Offer",
      price: (product.basePrice / 100).toFixed(2),
      priceCurrency: CURRENCY,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/products/${product.slug}`,
    },
    ...(product.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.avg.toFixed(1),
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };

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

  return (
    <>
      <Script
        id="ld-product"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Script
        id="ld-breadcrumb"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ImageGallery images={product.images} />

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
                {product.brand}
              </p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-4xl">
                {product.name}
              </h1>
            </div>

            {product.rating.count > 0 ? (
              <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                <span className="inline-flex items-center gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(product.rating.avg)
                          ? "size-4 fill-[var(--accent)] text-[var(--accent)]"
                          : "size-4 text-[var(--line)]"
                      }
                      strokeWidth={1.5}
                    />
                  ))}
                </span>
                <span className="tabular-nums">{product.rating.avg.toFixed(1)}</span>
                <a
                  href="#reviews"
                  className="underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  ({product.rating.count} reviews)
                </a>
              </div>
            ) : null}

            <PriceBlock
              basePrice={product.basePrice}
              comparePrice={product.comparePrice ?? null}
              size="lg"
            />

            {product.shortDescription ? (
              <p className="text-sm text-[var(--ink-soft)]">{product.shortDescription}</p>
            ) : null}

            <ProductPurchasePanel
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              basePrice={product.basePrice}
              variants={product.fullVariants}
              isAuthenticated={isAuthenticated}
            />

            {product.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {product.badges.map((b) => (
                  <BadgeChip key={b} slug={b} />
                ))}
              </div>
            ) : null}

            {!inStock ? (
              <p className="text-sm text-[var(--ink-soft)]">
                Currently sold out across every variant.{" "}
                <Link
                  href={`/account/notify?slug=${encodeURIComponent(product.slug)}`}
                  className="underline underline-offset-4 hover:text-[var(--accent)]"
                >
                  Notify me when available
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        <section className="mt-16 border-t border-[var(--line)] pt-10">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="allergens">Allergens</TabsTrigger>
              <TabsTrigger value="shipping">Shipping &amp; Returns</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <p className="max-w-3xl leading-relaxed whitespace-pre-line text-[var(--ink)]">
                {product.description}
              </p>
            </TabsContent>
            <TabsContent value="ingredients">
              {product.ingredients.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing) => (
                    <li
                      key={ing}
                      className="rounded-full bg-[var(--bg-alt)] px-3 py-1 text-xs text-[var(--ink)]"
                    >
                      {ing}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Ingredient list coming soon.</p>
              )}
            </TabsContent>
            <TabsContent value="allergens">
              {product.allergens.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {product.allergens.map((a) => (
                    <li
                      key={a}
                      className="rounded-full border border-[var(--warn)]/40 bg-[var(--warn)]/10 px-3 py-1 text-xs text-[var(--warn)]"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No declared allergens.</p>
              )}
            </TabsContent>
            <TabsContent value="shipping">
              <div className="space-y-3 leading-relaxed text-[var(--ink-soft)]">
                <p>
                  Free standard shipping across Bangladesh on orders over ৳2000. Cash on delivery
                  available nationwide.
                </p>
                <p>
                  30-day hassle-free returns on unopened items. Opened products may be returned if
                  damaged or defective.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <Suspense fallback={<ProductReviewsFallback />}>
          <ProductReviews productId={product.id} slug={product.slug} userId={userId} />
        </Suspense>

        {related.length > 0 ? (
          <section className="mt-20 border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
              You may also like
            </h2>
            <div className="mt-8">
              <ProductGrid products={toCardDTOs(related)} columns={4} />
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}

// reason: PDP content is owner-agnostic and changes rarely — ISR for 60s
// keeps nav snappy. Admin product mutations already call revalidatePath.
export const revalidate = 60;
