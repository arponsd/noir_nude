import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

const LAST_UPDATED = "2026-04-17";
const SUPPORT_EMAIL = "support@cosmetic.bd";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about shipping, cash on delivery, cancellations, returns, and more at Cosmetic.",
};

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    q: "How long does shipping take?",
    a: (
      <>
        Orders inside Dhaka typically arrive within <strong>1–3 business days</strong>. Chattogram,
        Sylhet, and other divisional cities arrive within <strong>2–5 business days</strong>. Remote
        upazilas may take up to 7 business days. You will receive a shipping email with your
        courier&apos;s tracking link as soon as the package is handed off.
      </>
    ),
  },
  {
    q: "How does cash on delivery work?",
    a: (
      <>
        You place your order without entering any card details. The courier calls before delivery to
        confirm your address, arrives at your door, and you pay the full order total — shipping
        included — in Bangladeshi Taka (BDT, ৳) in cash at the time of delivery. Please prepare
        exact change where possible.
      </>
    ),
  },
  {
    q: "Can I cancel my order?",
    a: (
      <>
        Yes — you can cancel from your account dashboard within <strong>2 hours</strong> of placing
        an order, as long as it has not yet been dispatched. After that window please contact
        support and we will try to intercept the shipment.
      </>
    ),
  },
  {
    q: "Do you accept returns or exchanges?",
    a: (
      <>
        For launch, returns are handled by our support team. If a product arrives damaged, sealed
        incorrectly, or materially different from what you ordered, email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-[var(--accent)] underline-offset-4 hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>{" "}
        within 7 days of delivery with photos and your order number. For hygiene reasons, used
        cosmetics cannot be returned unless faulty.
      </>
    ),
  },
  {
    q: "What are verified reviews?",
    a: (
      <>
        A review shows a <em>Verified purchase</em> badge when we can confirm the reviewer bought
        the exact product on Cosmetic under their account. Verified reviews carry more weight in our
        ratings because they come from confirmed customers.
      </>
    ),
  },
  {
    q: "How do I delete my account?",
    a: (
      <>
        From{" "}
        <Link
          href="/account/profile"
          className="text-[var(--accent)] underline-offset-4 hover:underline"
        >
          your profile page
        </Link>{" "}
        you can export your data as JSON and then delete your account. Deletion removes your
        profile, addresses, cart, and wishlist. Order records are retained for up to 7 years to meet
        Bangladeshi tax and consumer-protection obligations, and review content is anonymised but
        kept on the product page.
      </>
    ),
  },
  {
    q: "Are your products authentic?",
    a: (
      <>
        Yes. Every product is sourced directly from the brand or an authorised distributor. If you
        ever receive something that feels off, email us with photos and your order number and we
        will replace it or refund the full amount.
      </>
    ),
  },
  {
    q: "How do I contact support?",
    a: (
      <>
        Email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-[var(--accent)] underline-offset-4 hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>{" "}
        any day of the week. You can also reach us via our{" "}
        <Link href="/contact" className="text-[var(--accent)] underline-offset-4 hover:underline">
          contact page
        </Link>
        . We typically reply within one business day.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />

      <header className="mt-8">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Help
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
          Frequently asked
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="mt-10 space-y-6">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] open:shadow-[var(--shadow-md)]"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-medium text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] focus-visible:outline-none">
              <span>{item.q}</span>
              <span
                aria-hidden
                className="mt-1 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <div className="mt-3 text-base leading-[1.7] text-[var(--ink-soft)]">{item.a}</div>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-[var(--ink-soft)]">
        Still have a question? Visit our{" "}
        <Link href="/contact" className="text-[var(--accent)] underline-offset-4 hover:underline">
          contact page
        </Link>
        .
      </p>
    </div>
  );
}
