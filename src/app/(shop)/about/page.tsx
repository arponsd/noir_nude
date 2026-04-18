import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Cosmetic is a Bangladesh-based cosmetics boutique: clean formulas, quiet design, delivered across the country.",
};

export default function AboutPage() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      </div>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-[var(--accent)] uppercase">
              Our story
            </p>
            <h1 className="font-display mt-4 text-4xl leading-[1.1] font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
              Quiet beauty, made for Bangladesh.
            </h1>
            <p className="mt-6 text-lg leading-[1.7] text-[var(--ink-soft)]">
              Cosmetic began as a small Dhaka boutique that cared more about ingredient lists than
              marketing language. We built this store because the products we loved were hard to buy
              confidently online — counterfeit dupes, confusing labels, slow delivery outside the
              capital. We wanted a place that felt honest.
            </p>
            <p className="mt-5 text-base leading-[1.7] text-[var(--ink-soft)]">
              Every brand we stock is sourced directly or through authorised distributors. Every
              product page tells you the full ingredient list and the allergens we know about.
              Reviews are only verified when we can confirm the reviewer actually bought the item.
              We ship across Bangladesh with cash on delivery, because that&apos;s how our customers
              actually shop.
            </p>
            <p className="mt-5 text-base leading-[1.7] text-[var(--ink-soft)]">
              We&apos;re a small team. We answer our own emails. If something goes wrong, a human
              will write back — usually the same day. That&apos;s the standard we hold ourselves to,
              and it is the reason we built every part of this experience with care.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/products">Browse the shop</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/contact">Get in touch</Link>
              </Button>
            </div>
          </div>

          <div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--bg-alt)]">
              <Image
                src="https://picsum.photos/seed/cosmetic-about-hero/1200/1500"
                alt="A quiet flatlay of Cosmetic skincare products on cream linen"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
