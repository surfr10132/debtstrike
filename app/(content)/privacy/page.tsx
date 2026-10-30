export const metadata = {
  title: 'Privacy Policy | DebtStrike',
  description: 'Our commitment to protecting your privacy and data security.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-mono text-4xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-base text-muted-foreground">
            Last updated: May 17, 2026
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-base leading-relaxed text-foreground mb-4">
            DebtStrike (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or &quot;Service&quot;) is
            committed to protecting your privacy. This Privacy Policy explains what
            information we collect, how we use it, and your rights regarding your data.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            By using DebtStrike.io, you consent to this Privacy Policy.
          </p>
        </section>

        {/* Main Content */}
        <div className="space-y-12">
          {/* 1. Information We Collect */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              1. Information We Collect
            </h2>
            <p className="text-base leading-relaxed text-foreground mb-4">
              We collect only the information necessary to generate your debt validation letter:
            </p>
            <ul className="space-y-3 ml-6 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Name:</strong> Your full name for personalization of the validation letter
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Address:</strong> Your mailing address to include in the letter
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Phone Number:</strong> Your contact information for debt collection correspondence
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Debt Collection Letter Content:</strong> The original collection letter you upload (text, PDF, or image)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Payment Information:</strong> Processed securely by Stripe (we never see your credit card details)
                </span>
              </li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              2. How We Use Your Information
            </h2>
            <p className="text-base leading-relaxed text-foreground mb-4">
              We use your information exclusively for:
            </p>
            <ul className="space-y-3 ml-6 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Generating your personalized debt validation letter using Anthropic&apos;s API
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Processing payments through Stripe
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Delivering your generated document
                </span>
              </li>
            </ul>
            <p className="text-base leading-relaxed text-foreground mt-4">
              We will <span className="text-accent font-bold">never</span> sell, rent, trade, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          {/* 3. Data Retention & Storage */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              3. Data Retention & Storage
            </h2>
            <div className="bg-muted p-4 rounded-lg border border-accent/20 mb-4">
              <p className="text-base text-foreground font-mono">
                <span className="text-accent">→</span> Personal data is stored in <span className="font-bold">short-lived server-side storage only</span>
              </p>
            </div>
            <ul className="space-y-3 ml-6 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Letter-generation session payloads are retained for up to <strong>2 hours</strong> to support generation, checkout, and download
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  For paid mail orders, we retain a limited fulfillment record (order type, mailing status, tracking number, timestamps, and errors) for up to <strong>30 days</strong> to prevent duplicate sends and provide support
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  We do <strong>not</strong> store full letter payloads in browser localStorage and do <strong>not</strong> place full personal payloads in Stripe metadata
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  DebtStrike does not require user accounts and does not maintain long-term customer profile records
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  You can request immediate deletion by contacting info@debtstrike.io
                </span>
              </li>
            </ul>
          </section>

          {/* 4. Third-Party Services */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              4. Third-Party Services
            </h2>
            <p className="text-base leading-relaxed text-foreground mb-6">
              We use the following third-party services:
            </p>

            {/* Stripe */}
            <div className="mb-6">
              <h3 className="font-mono text-lg font-bold mb-3 text-accent">
                Stripe (Payment Processing)
              </h3>
              <p className="text-base leading-relaxed text-foreground">
                Stripe handles all payment processing. Stripe is PCI-DSS Level 1 certified and complies with all data protection regulations. Your credit card information is never shared with us.{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:opacity-80 transition"
                >
                  Stripe Privacy Policy →
                </a>
              </p>
            </div>

            {/* Anthropic */}
            <div className="mb-6">
              <h3 className="font-mono text-lg font-bold mb-3 text-accent">
                Anthropic API (Letter Generation)
              </h3>
              <p className="text-base leading-relaxed text-foreground">
                We use Anthropic&apos;s API to generate your personalized debt validation letter. Your debt collection letter content is processed by Anthropic to generate the response. This processing is subject to Anthropic&apos;s privacy practices.{` `}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:opacity-80 transition"
                >
                  Anthropic Privacy Policy →
                </a>
              </p>
            </div>

            {/* Vercel */}
            <div className="mb-6">
              <h3 className="font-mono text-lg font-bold mb-3 text-accent">
                Vercel (Hosting & Analytics)
              </h3>
              <p className="text-base leading-relaxed text-foreground">
                We host DebtStrike on Vercel and use Vercel Analytics for privacy-focused usage insights. Vercel Analytics does not use cookies and collects only essential performance data.{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:opacity-80 transition"
                >
                  Vercel Privacy Policy →
                </a>
              </p>
            </div>

            {/* Google Search Console */}
            <div>
              <h3 className="font-mono text-lg font-bold mb-3 text-accent">
                Google Search Console
              </h3>
              <p className="text-base leading-relaxed text-foreground">
                We use Google Search Console for SEO insights and indexing. This does not collect personal data from users.{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:opacity-80 transition"
                >
                  Google Privacy Policy →
                </a>
              </p>
            </div>
          </section>

          {/* 5. Cookies & Tracking */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              5. Cookies & Tracking
            </h2>
            <div className="bg-muted p-4 rounded-lg border border-accent/20 mb-4">
              <p className="text-base text-foreground font-mono">
                <span className="text-accent">→</span> <span className="font-bold">No tracking cookies.</span> We do not use advertising or tracking cookies.
              </p>
            </div>
            <ul className="space-y-3 ml-6 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Essential cookies only:</strong> We use only essential cookies required for site functionality
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>No third-party tracking:</strong> We do not permit third-party trackers or advertising pixels
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Vercel Analytics does not use cookies
                </span>
              </li>
            </ul>
          </section>

          {/* 6. No Account Creation */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              6. No Account Creation
            </h2>
            <p className="text-base leading-relaxed text-foreground">
              DebtStrike operates without user accounts. You do not need to create an account or provide login credentials. Simply upload your debt collection letter, enter your information, pay via Stripe, and download your validation letter. This minimizes data collection and storage.
            </p>
          </section>

          {/* 7. CCPA Compliance (California Privacy Rights) */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              7. CCPA Compliance (California Privacy Rights)
            </h2>
            <p className="text-base leading-relaxed text-foreground mb-4">
              If you are a California resident, the California Consumer Privacy Act (CCPA) grants you the following rights:
            </p>
            <ul className="space-y-3 ml-6 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Right to Know:</strong> You have the right to know what personal data we collect and how we use it
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Right to Delete:</strong> You have the right to request deletion of your personal data
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Right to Opt-Out:</strong> You have the right to opt-out of data sales (though we do not sell your data)
                </span>
              </li>
            </ul>
            <p className="text-base leading-relaxed text-foreground mt-4">
              To exercise these rights, contact us at <span className="font-mono text-accent">info@debtstrike.io</span>
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-base leading-relaxed text-foreground">
              DebtStrike is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided us with personal information, we will delete such information and terminate the child&apos;s use of DebtStrike.
            </p>
          </section>

          {/* 9. Data Security */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              9. Data Security
            </h2>
            <p className="text-base leading-relaxed text-foreground mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="space-y-3 ml-6 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  HTTPS encryption for all data in transit
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Short-lived server-side session storage with automatic expiry for letter payloads (2-hour retention)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Limited operational fulfillment records retained up to 30 days for mailing reliability and support
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  No full personal payload storage in browser localStorage or Stripe metadata
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  Stripe handles payment data with PCI-DSS Level 1 compliance
                </span>
              </li>
            </ul>
          </section>

          {/* 10. Changes to This Privacy Policy */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              10. Changes to This Privacy Policy
            </h2>
            <p className="text-base leading-relaxed text-foreground">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. Your continued use of DebtStrike after changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 11. Contact Us */}
          <section>
            <h2 className="font-mono text-2xl font-bold mb-4 text-accent">
              11. Contact Us
            </h2>
            <p className="text-base leading-relaxed text-foreground mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg border border-accent/20">
              <p className="text-base text-foreground font-mono">
                <span className="text-accent">info@debtstrike.io</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                We will respond to privacy requests within 30 days.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-muted">
          <p className="text-sm text-muted-foreground text-center">
            By using DebtStrike, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
