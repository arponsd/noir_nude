import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FooterLink = { href: string; label: string };

const SHOP_LINKS: FooterLink[] = [
  { href: "/shop", label: "All products" },
  { href: "/shop/skincare", label: "Skincare" },
  { href: "/shop/makeup", label: "Makeup" },
  { href: "/shop/fragrance", label: "Fragrance" },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { href: "/account", label: "My account" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
];

const COMPANY_LINKS: FooterLink[] = [
  { href: "/about", label: "About us" },
  { href: "/journal", label: "Journal" },
  { href: "/stores", label: "Stores" },
  { href: "/careers", label: "Careers" },
];

const CONNECT_LINKS: FooterLink[] = [
  { href: "/contact", label: "Contact" },
  { href: "/help", label: "Help center" },
  { href: "/shipping", label: "Shipping & returns" },
  { href: "/privacy", label: "Privacy" },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="font-sans text-xs font-medium tracking-[0.12em] text-[var(--ink)] uppercase">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--bg-alt)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="font-display text-2xl leading-none tracking-[-0.02em] text-[var(--ink)]"
            >
              Cosmetic
            </Link>
            <p className="mt-3 max-w-sm text-sm text-[var(--ink-soft)]">
              Elegant cosmetics, delivered. Clean formulas, quiet design.
            </p>
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Connect" links={CONNECT_LINKS} />
        </div>

        <div className="mt-12 grid gap-8 border-t border-[var(--line)] pt-10 md:grid-cols-2 md:items-end">
          <form className="flex flex-col gap-3" aria-label="Newsletter signup">
            <Label htmlFor="footer-newsletter">Stay in touch</Label>
            <div className="flex items-end gap-3">
              <Input
                id="footer-newsletter"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                className="flex-1"
              />
              <Button type="submit" variant="default" size="sm">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-[var(--muted)]">One email a month. Unsubscribe anytime.</p>
          </form>

          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex size-10 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Instagram className="size-5" strokeWidth={1.5} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex size-10 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Facebook className="size-5" strokeWidth={1.5} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="inline-flex size-10 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Youtube className="size-5" strokeWidth={1.5} />
              </a>
            </div>
            <p className="text-xs text-[var(--muted)]">
              &copy; {new Date().getFullYear()} Cosmetic. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
