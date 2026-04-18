import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

const LAST_UPDATED = "2026-04-17";
const SUPPORT_EMAIL = "support@cosmetic.bd";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that govern your use of Cosmetic, including orders, cancellation, pricing in BDT, and acceptable use.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]} />

      <header className="mt-8">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--ink-soft)] uppercase">
          Legal
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
          Terms & Conditions
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="mt-10 space-y-10 text-[var(--ink-soft)]">
        <section>
          <p className="text-base leading-[1.7]">
            These terms govern your use of Cosmetic. By creating an account, placing an order, or
            otherwise using the site, you agree to them. Please read carefully — particularly the
            sections on cancellation, returns, and disclaimers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            1. Your account
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            You may browse as a guest. Some features — order history, reviews, saved addresses —
            require an account. You are responsible for keeping your password secure and for all
            activity under your login. Accounts may be suspended for fraud, abuse, or violation of
            these terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            2. Orders & payment (COD)
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            All orders on Cosmetic are paid via{" "}
            <strong className="text-[var(--ink)]">cash on delivery (COD)</strong>. You pay in
            Bangladeshi Taka (BDT, ৳) directly to the courier when your package arrives. We reserve
            the right to refuse or cancel an order — for example in case of pricing errors,
            suspected fraud, unserviceable addresses, or repeated refused deliveries. In those cases
            we will notify you by email.
          </p>
          <p className="mt-4 text-base leading-[1.7]">
            An order becomes a binding contract only once we send an order-confirmation email. The
            presence of a product on the site is an invitation to offer, not an offer to sell.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            3. Cancellation
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            You may cancel an order yourself from your account dashboard within{" "}
            <strong className="text-[var(--ink)]">2 hours</strong> of placing it, provided it has
            not yet been dispatched. After that window, please contact{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and we will do our best to stop the shipment, but we cannot guarantee cancellation once
            the courier has taken custody.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            4. Returns & exchanges
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            For launch, returns and exchanges are handled by our support team rather than a
            self-service flow. If a product arrives damaged, leaking, sealed incorrectly, or
            materially different from its listing, email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            within 7 days of delivery with photos and your order number. For hygiene reasons, used
            cosmetics cannot be returned unless faulty.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            5. Pricing & taxes
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            All prices are shown in Bangladeshi Taka (BDT, ৳) and are inclusive of any applicable
            VAT. Shipping fees are calculated at checkout based on the delivery zone. If a pricing
            error is discovered after checkout but before dispatch, we will contact you with the
            correct price; you may proceed or cancel without penalty.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">6. Coupons</h2>
          <p className="mt-4 text-base leading-[1.7]">
            One coupon may be applied per order. Coupons are non-transferable, have no cash value,
            cannot be combined, and may be revoked if abused. Expired, mistyped, or conditionally
            invalid coupons (for example a minimum-spend not met) will be rejected at checkout.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            7. Acceptable use
          </h2>
          <p className="mt-4 text-base leading-[1.7]">You agree not to:</p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-[1.7]">
            <li>scrape, mirror, or systematically download the site;</li>
            <li>interfere with our infrastructure, rate limits, or security controls;</li>
            <li>
              upload reviews or profile content that is illegal, defamatory, hateful, spammy, or
              infringes someone else&apos;s rights;
            </li>
            <li>impersonate another person or create accounts under false identities;</li>
            <li>
              resell our products without written authorisation or use our brand in a misleading
              way.
            </li>
          </ul>
          <p className="mt-4 text-base leading-[1.7]">
            We may remove content, suspend accounts, and cancel orders that violate this section.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            8. Intellectual property
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            The site, its content, design, logos, copy, and photography are owned by Cosmetic or our
            licensors and are protected by copyright and trademark law. You receive a limited,
            revocable, non-exclusive licence to view the site for personal, non-commercial use. When
            you submit a review or photo, you grant us a non-exclusive, worldwide, royalty-free
            licence to display it in the context of that product.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            9. Disclaimers
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            Product information, ingredients, and skin-type guidance are provided in good faith and
            may be updated by manufacturers without notice. Always check the physical packaging and
            patch-test new products. We are not a substitute for medical or dermatological advice.
            To the maximum extent permitted by law, the site is provided &quot;as is&quot; without
            warranty of any kind. Our total liability arising from your use of the site is capped at
            the amount you paid for the order that gave rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            10. Governing law
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            These terms are governed by the laws of the People&apos;s Republic of Bangladesh. Any
            dispute that cannot be resolved amicably will be subject to the exclusive jurisdiction
            of the courts of Dhaka.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            11. Changes
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            We may revise these terms from time to time. The &quot;Last updated&quot; date reflects
            the most recent change. Continued use of the site after an update means you accept the
            new terms. You can always review our{" "}
            <Link
              href="/privacy-policy"
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            alongside these terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--ink)]">
            12. Contact
          </h2>
          <p className="mt-4 text-base leading-[1.7]">
            Questions about these terms? Write to{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
