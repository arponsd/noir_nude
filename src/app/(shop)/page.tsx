import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Rabbit, Stethoscope, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductSkeleton from "@/components/shop/ProductSkeleton";
import { toCardDTOs } from "@/components/shop/adapters";
import { getFeaturedProductsService } from "@/lib/services/product";
import { listCategoryTreeService } from "@/lib/services/category";
import type { CategoryTree } from "@/types/api/categories";

export const metadata = {
  title: "GlowCart — Elegant cosmetics, delivered",
  description:
    "Clean formulas, quiet design. Skincare, makeup, and fragrance curated for Bangladesh.",
};

export const dynamic = "force-dynamic";

function Hero() {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:gap-16 md:py-24 lg:px-8">
        <div className="order-2 md:order-1">
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--accent)] uppercase">
            New season · Spring 2026
          </p>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-6xl">
            Elegant cosmetics, <br />
            <span className="italic">delivered calm.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-[var(--ink-soft)]">
            Clean formulas. Quiet design. Everyday rituals that let your skin speak first —
            thoughtfully curated and shipped across Bangladesh.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/products">Shop all</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/journal">Our story</Link>
            </Button>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--bg-alt)] md:aspect-[5/6]">
            <Image
              src="https://picsum.photos/seed/glowcart-hero/1400/900"
              alt="Editorial cosmetics still life"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

async function FeaturedProducts() {
  const items = await getFeaturedProductsService(8);
  const products = toCardDTOs(items);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
            Editor&apos;s picks
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-4xl">
            Featured products
          </h2>
        </div>
        <Link
          href="/products"
          className="text-sm text-[var(--ink-soft)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View all →
        </Link>
      </div>

      <div className="mt-10">
        <ProductGrid
          products={products}
          columns={4}
          emptyMessage="No featured products yet. Check back soon."
        />
      </div>
    </section>
  );
}

function FeaturedProductsFallback() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="h-8 w-56 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-alt)]" />
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <ProductSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function CategoryTiles() {
  const tree: CategoryTree[] = await listCategoryTreeService();
  const roots = tree.slice(0, 6);

  if (roots.length === 0) return null;

  return (
    <section className="border-y border-[var(--line)] bg-[var(--bg-alt)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
            Shop by category
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-4xl">
            Find your ritual
          </h2>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {roots.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/category/${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Image
                  src={cat.image ?? `https://picsum.photos/seed/glowcart-cat-${cat.slug}/600/750`}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--ink)]/70 to-transparent p-3"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-medium text-white drop-shadow">
                  {cat.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function WhyGlowCart() {
  const tiles = [
    {
      icon: Rabbit,
      title: "Cruelty-free",
      copy: "Never tested on animals. Certified end-to-end across every brand on our shelf.",
    },
    {
      icon: Stethoscope,
      title: "Dermatologist-tested",
      copy: "Formulations reviewed by licensed dermatologists for sensitive Bangladeshi skin.",
    },
    {
      icon: Truck,
      title: "BDT shipping",
      copy: "Same-week delivery across Dhaka, Chattogram, and Sylhet. Cash on delivery available.",
    },
  ] as const;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-xl">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Why GlowCart
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-4xl">
          Elegant cosmetics, earned trust
        </h2>
      </div>
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <li
              key={t.title}
              className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--accent)]">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="font-display mt-4 text-xl tracking-[-0.01em] text-[var(--ink)]">
                {t.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.copy}</p>
            </li>
          );
        })}
      </ul>
      {/* tiny nod to leaf icon symmetry */}
      <Leaf aria-hidden className="hidden" />
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<FeaturedProductsFallback />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={null}>
        <CategoryTiles />
      </Suspense>
      <WhyGlowCart />
    </>
  );
}
