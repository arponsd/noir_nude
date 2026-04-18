import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SUPPORT_EMAIL = "support@cosmetic.bd";
const SUPPORT_PHONE = "+880 1700-000000";
const SUPPORT_HOURS = "Sat–Thu · 10:00–19:00 BST";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Cosmetic. Email, phone, and support hours for customers across Bangladesh.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <header className="mt-8">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Support
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
          Contact us
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-[1.7] text-[var(--ink-soft)]">
          We&apos;re a small team and we answer our own email. The fastest way to reach us is to
          write to the address below — we usually respond within one business day.
        </p>
      </header>

      <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
        <section aria-labelledby="contact-direct-heading">
          <h2
            id="contact-direct-heading"
            className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]"
          >
            Reach us directly
          </h2>
          <ul className="mt-6 space-y-6">
            <li className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--accent)]">
                <Mail className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium tracking-[0.02em] text-[var(--ink)] uppercase">
                  Email
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-1 inline-block text-base text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Best for order issues, returns, and anything that needs a paper trail.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--accent)]">
                <Phone className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium tracking-[0.02em] text-[var(--ink)] uppercase">
                  Phone
                </p>
                <a
                  href={`tel:${SUPPORT_PHONE.replace(/\s|-/g, "")}`}
                  className="mt-1 inline-block text-base text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {SUPPORT_PHONE}
                </a>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Call or WhatsApp during support hours.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--accent)]">
                <Clock className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium tracking-[0.02em] text-[var(--ink)] uppercase">
                  Support hours
                </p>
                <p className="mt-1 text-base text-[var(--ink)]">{SUPPORT_HOURS}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Closed on Fridays and national holidays.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--accent)]">
                <MapPin className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium tracking-[0.02em] text-[var(--ink)] uppercase">
                  Studio
                </p>
                <p className="mt-1 text-base text-[var(--ink)]">Dhaka, Bangladesh</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Visits by appointment only — email us to arrange.
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section aria-labelledby="contact-form-heading">
          <h2
            id="contact-form-heading"
            className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]"
          >
            Send a message
          </h2>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Submitting this form opens your email app addressed to our support team — we do not
            store submissions from this page.
          </p>
          {/* For MVP the form opens mailto: rather than posting. This avoids a
              server handler we don't yet have, keeps things spam-resistant, and
              gives the user a copy in their sent folder. */}
          <form
            action={`mailto:${SUPPORT_EMAIL}`}
            method="post"
            encType="text/plain"
            className="mt-6 space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="contact-name">Your name</Label>
              <Input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Ayesha Rahman"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input
                id="contact-subject"
                name="subject"
                type="text"
                required
                placeholder="Order #12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={6}
                className="flex w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] shadow-[var(--shadow-sm)] placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="How can we help?"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="lg">
                Open in mail app
              </Button>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-sm text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
              >
                Or email {SUPPORT_EMAIL} directly
              </a>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
