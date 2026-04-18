import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

const LAST_UPDATED = "2026-04-17";
const SUPPORT_EMAIL = "support@cosmetic.bd";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Cosmetic collects, uses, and safeguards your personal data in Bangladesh. Read our privacy policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

      <header className="mt-8">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Legal
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="mt-10 space-y-10 text-[var(--ink-soft)]">
        <section>
          <p className="text-base leading-[1.7]">
            Cosmetic (&quot;we&quot;, &quot;us&quot;) operates an online cosmetics store in
            Bangladesh. This policy explains what personal information we collect when you browse
            our site or place an order, why we collect it, how we keep it, and the rights you have
            over it. By using our site you agree to the terms described here.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            1. Information we collect
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-[1.7]">
            <li>
              <strong className="text-[var(--ink)]">Account details:</strong> your name, email
              address, password (stored only as a salted hash), phone number, and date of birth if
              you provide one.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Shipping & billing:</strong> delivery addresses,
              contact phone, and any delivery notes you add at checkout.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Order history:</strong> the products you buy,
              quantities, prices, coupon usage, and order status updates.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Skin preferences:</strong> optional profile
              fields such as skin type and allergens that help us personalise recommendations.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Device & usage:</strong> IP address, browser
              type, referring page, and anonymised interaction events (only if you accept optional
              analytics cookies).
            </li>
            <li>
              <strong className="text-[var(--ink)]">Cookies:</strong> small identifiers stored in
              your browser for session login, cart state, and — only with your consent — analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            2. Why we collect it
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-[1.7]">
            <li>
              <strong className="text-[var(--ink)]">Order fulfillment:</strong> to process checkout,
              arrange cash-on-delivery, and ship your order.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Account & support:</strong> to authenticate you,
              respond to questions, and handle returns or cancellations.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Transactional email:</strong> to send order
              confirmation, shipping, delivery, password reset, and account notifications.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Safety & fraud prevention:</strong> to
              rate-limit abusive traffic and protect accounts.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Product improvement:</strong> aggregated
              analytics to understand which pages work, only if you opt in.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Legal compliance:</strong> to keep order records
              required by Bangladeshi tax and consumer-protection law.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            3. How long we keep it
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-[1.7]">
            <li>
              <strong className="text-[var(--ink)]">Active accounts:</strong> while your account is
              open, plus the retention periods below.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Order records:</strong> up to 7 years from order
              date, to meet tax and accounting obligations.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Reviews:</strong> retained as long as the
              product page exists, anonymised if you delete your account.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Email logs:</strong> 12 months for
              deliverability diagnostics.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Analytics events:</strong> up to 14 months, only
              when you consent to analytics cookies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            4. Who we share with
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            We never sell your personal data. We share the minimum necessary information with a
            small number of service providers who process data on our behalf under contract:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-[1.7]">
            <li>
              <strong className="text-[var(--ink)]">Resend</strong> — transactional email delivery
              (order confirmations, shipping updates, password resets).
            </li>
            <li>
              <strong className="text-[var(--ink)]">Cloudinary</strong> — storage and optimisation
              of product and review images you upload.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Sentry</strong> — error tracking to help us
              diagnose bugs; payloads are scrubbed of personal data where possible.
            </li>
            <li>
              <strong className="text-[var(--ink)]">PostHog</strong> — product analytics, loaded
              only if you accept analytics cookies.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Courier partners</strong> — receive your
              shipping address and phone number to deliver your order.
            </li>
          </ul>
          <p className="mt-4 text-base leading-[1.7]">
            We may also disclose information to comply with a lawful request from a government
            authority in Bangladesh.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            5. Your rights
          </h2>
          <p className="mt-4 text-base leading-[1.7]">You can, at any time:</p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-[1.7]">
            <li>
              <strong className="text-[var(--ink)]">Access & update</strong> your profile and
              addresses from{" "}
              <Link
                href="/account/profile"
                className="text-[var(--accent)] underline-offset-4 hover:underline"
              >
                your account page
              </Link>
              .
            </li>
            <li>
              <strong className="text-[var(--ink)]">Export your data</strong> as a JSON file from
              the profile page.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Delete your account</strong> and associated
              personal data — order records are retained as described above and linked review
              content is anonymised.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Withdraw analytics consent</strong> by clearing
              your browser storage; we will ask again on your next visit.
            </li>
            <li>
              <strong className="text-[var(--ink)]">Complain</strong> to the appropriate regulator
              if you believe we have mishandled your data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            6. Cookies & consent
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            Essential cookies are required for login sessions, cart state, and CSRF protection.
            Analytics cookies are optional and set only after you choose &quot;Accept all&quot; on
            our consent banner. You can revisit your choice by clearing{" "}
            <code className="rounded-sm bg-[var(--bg-alt)] px-1.5 py-0.5 text-xs text-[var(--ink)]">
              cosmetic_consent
            </code>{" "}
            in your browser storage.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            7. Security
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            We use HTTPS across the site, hashed password storage, rate-limited authentication
            endpoints, CSRF tokens on sensitive actions, and principle-of-least-access reviews of
            admin permissions. No system is perfectly secure; if we ever suffer a breach that
            affects you, we will notify you without undue delay.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            8. Children
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            Our services are not directed to children under 13. If you believe a child has created
            an account, please email us so we can remove it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            9. Changes to this policy
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            We may update this policy to reflect new features, legal requirements, or operational
            changes. The &quot;Last updated&quot; date above changes whenever we do. Material
            changes will be announced on your account page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            10. Contact
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            Questions, data requests, or complaints? Write to{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            . We aim to respond within 5 business days.
          </p>
        </section>
      </article>
    </div>
  );
}
