import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BadgeChip from "@/components/shop/BadgeChip";
import PriceBlock from "@/components/shop/PriceBlock";
import ProductCard, { type ProductCardDTO } from "@/components/shop/ProductCard";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductSkeleton from "@/components/shop/ProductSkeleton";
import VariantSwatches from "@/components/shop/VariantSwatches";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import DesignPrimitivesClient from "./DesignPrimitivesClient";

export const metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const COLOR_TOKENS = [
  { name: "bg", value: "#FBF8F4" },
  { name: "bg-alt", value: "#F3ECE2" },
  { name: "surface", value: "#FFFFFF" },
  { name: "ink", value: "#1A1413" },
  { name: "ink-soft", value: "#5C504C" },
  { name: "muted", value: "#A89F9A" },
  { name: "line", value: "#E7DFD5" },
  { name: "accent", value: "#6B1F2E" },
  { name: "accent-soft", value: "#B97A86" },
  { name: "success", value: "#4F6F52" },
  { name: "warn", value: "#B8722C" },
  { name: "danger", value: "#9B2A2A" },
] as const;

const SAMPLE_SWATCHES: { id: string; name: string; hex: string }[] = [
  { id: "nude", name: "Nude", hex: "#E5C9B5" },
  { id: "rose", name: "Rose", hex: "#B97A86" },
  { id: "plum", name: "Plum", hex: "#6B1F2E" },
  { id: "berry", name: "Berry", hex: "#7A2438" },
  { id: "brick", name: "Brick", hex: "#8A4032" },
  { id: "mauve", name: "Mauve", hex: "#9C7A8C" },
  { id: "wine", name: "Wine", hex: "#5A1A2A" },
];

const SAMPLE_PRODUCTS: ProductCardDTO[] = [
  {
    id: "p1",
    slug: "hydrating-serum",
    name: "Hydrating hyaluronic serum",
    brand: "Glow Lab",
    image: {
      url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80",
      alt: "Hydrating serum bottle on neutral background",
    },
    basePrice: 149900,
    comparePrice: 199900,
    variants: SAMPLE_SWATCHES.slice(0, 3),
  },
  {
    id: "p2",
    slug: "matte-lipstick",
    name: "Velvet matte lipstick",
    brand: "Rouge Atelier",
    image: {
      url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
      alt: "Matte lipstick with cap off",
    },
    basePrice: 89900,
    variants: SAMPLE_SWATCHES,
  },
  {
    id: "p3",
    slug: "cream-blush",
    name: "Silk cream blush",
    brand: "Petal & Co",
    image: {
      url: "https://images.unsplash.com/photo-1522335789203-aaa741b58c4d?auto=format&fit=crop&w=800&q=80",
      alt: "Cream blush compact open",
    },
    basePrice: 119900,
    comparePrice: 139900,
    variants: SAMPLE_SWATCHES.slice(0, 4),
  },
  {
    id: "p4",
    slug: "rose-toner",
    name: "Rose water toner",
    brand: "Bloom",
    image: {
      url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
      alt: "Rose toner spray bottle",
    },
    basePrice: 69900,
  },
];

const TYPE_SCALE = [
  { name: "xs", size: "text-xs", px: "12px" },
  { name: "sm", size: "text-sm", px: "14px" },
  { name: "base", size: "text-base", px: "16px" },
  { name: "lg", size: "text-lg", px: "18px" },
  { name: "xl", size: "text-xl", px: "20px" },
  { name: "2xl", size: "text-2xl", px: "24px" },
  { name: "3xl", size: "text-3xl", px: "30px" },
  { name: "4xl", size: "text-4xl", px: "36px" },
  { name: "5xl", size: "text-5xl", px: "48px" },
  { name: "6xl", size: "text-6xl", px: "60px" },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <Separator className="mt-3" />
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header>
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
          Internal
        </p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-[-0.02em]">
          Design system
        </h1>
        <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
          Tokens, typography, and primitives. This page is unlinked from public nav.
        </p>
      </header>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {COLOR_TOKENS.map((t) => (
            <div
              key={t.name}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)]"
            >
              <div
                className="h-16 w-full"
                style={{ backgroundColor: `var(--${t.name})` }}
                aria-hidden
              />
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-[var(--muted)] tabular-nums">{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-4">
          {TYPE_SCALE.map((t) => (
            <div
              key={t.name}
              className="flex items-baseline gap-6 border-b border-[var(--line)] pb-3"
            >
              <span className="w-14 text-xs text-[var(--muted)] tabular-nums">{t.name}</span>
              <span className="w-14 text-xs text-[var(--muted)] tabular-nums">{t.px}</span>
              <span className={`${t.size} font-display tracking-[-0.02em]`}>Aa Cosmetic</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="grid gap-8">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
              Variants
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
              Sizes
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Icon button">
                <span aria-hidden>+</span>
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
              States
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Form inputs">
        <div className="grid max-w-md gap-6">
          <div className="grid gap-2">
            <Label htmlFor="design-email">Email</Label>
            <Input
              id="design-email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="design-country">Country</Label>
            <Select>
              <SelectTrigger id="design-country">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bd">Bangladesh</SelectItem>
                <SelectItem value="in">India</SelectItem>
                <SelectItem value="pk">Pakistan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Breadcrumbs">
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            { label: "Skincare", href: "/categories/skincare" },
            { label: "Hydrating serum" },
          ]}
        />
      </Section>

      <Section title="Price block">
        <div className="flex flex-wrap gap-8">
          <PriceBlock basePrice={149900} />
          <PriceBlock basePrice={99900} comparePrice={149900} />
          <PriceBlock basePrice={249900} comparePrice={299900} size="lg" />
        </div>
      </Section>

      <Section title="Badge chips">
        <div className="flex flex-wrap gap-2">
          <BadgeChip slug="cruelty-free" />
          <BadgeChip slug="vegan" />
          <BadgeChip slug="paraben-free" />
          <BadgeChip slug="dermatologist-tested" />
          <BadgeChip slug="bestseller" />
          <BadgeChip slug="organic" />
        </div>
      </Section>

      <Section title="Variant swatches (non-interactive)">
        <VariantSwatches variants={SAMPLE_SWATCHES} />
      </Section>

      <Section title="Product card + grid">
        <ProductCard product={SAMPLE_PRODUCTS[0]!} />
        <div className="mt-8">
          <ProductGrid products={SAMPLE_PRODUCTS} />
        </div>
      </Section>

      <Section title="Product skeleton">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      </Section>

      <Section title="Interactive primitives">
        <DesignPrimitivesClient />
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>
                  Dialog description. Thin borders, soft shadows.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Your cart</SheetTitle>
                <SheetDescription>
                  Right-side drawer, 420px on desktop, full sheet on mobile.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 px-6 py-5 text-sm text-[var(--ink-soft)]">
                Items appear here.
              </div>
              <SheetFooter>
                <Button className="w-full sm:w-auto">Checkout</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </Section>
    </main>
  );
}
