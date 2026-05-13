import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background grid-bg scanlines">
      {/* Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "DebtStrike.io",
            "url": "https://debtstrike.io",
            "logo": "https://debtstrike.io/og-image.png",
            "sameAs": [
              "https://tiktok.com/@debtstrike.io",
              "https://instagram.com/debtstrike.io"
            ]
          })
        }}
      />
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Debt Validation & Cease and Desist Letter",
            "description": "AI-generated personalized debt validation and cease & desist letter citing FDCPA and California RFDCPA. Download as PDF and Word document.",
            "brand": { "@type": "Brand", "name": "DebtStrike.io" },
            "offers": [
              {
                "@type": "Offer",
                "name": "Download Only",
                "price": "20.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://debtstrike.io/generate"
              },
              {
                "@type": "Offer",
                "name": "Download + USPS Certified Mail",
                "price": "32.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://debtstrike.io/generate"
              }
            ]
          })
        }}
      />
      {/* HowTo JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Send a Debt Validation Letter to Stop Debt Collectors",
            "description": "Upload a debt collection letter, generate a personalized debt validation and cease & desist response, and mail it via USPS Certified Mail to legally force collectors to prove the debt and stop calling you.",
            "step": [
              {
                "@type": "HowToStep",
                "position": 1,
                "name": "Upload the collection letter",
                "text": "Upload a photo, PDF, or paste the text of the debt collection letter you received. Our AI extracts the collector name, address, account number, and amount claimed."
              },
              {
                "@type": "HowToStep",
                "position": 2,
                "name": "Generate your personalized response",
                "text": "We generate a unique debt validation demand and cease & desist letter citing the FDCPA and California RFDCPA, written in plain language as if you wrote it yourself."
              },
              {
                "@type": "HowToStep",
                "position": 3,
                "name": "Mail it via USPS Certified Mail",
                "text": "Download your letter and mail it yourself via USPS Certified Mail, or pay $30.99 and we print, mail, and track it for you. Once the collector receives it, they must stop calling and prove the debt within 30 days."
              }
            ],
            "totalTime": "PT2M",
            "estimatedCost": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": "20"
            }
          })
        }}
      />
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <div className="font-mono text-accent font-bold text-lg sm:text-xl tracking-widest">
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/resources" className="text-foreground hover:text-accent transition-colors text-sm sm:text-base">
            Resources
          </Link>
          <Link
            href="/generate"
            className="btn-tactical px-4 py-2 text-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 py-16 md:py-32 text-center">
        <div className="mb-6 font-mono text-sm tracking-[0.3em] text-muted uppercase">
          // Tactical Debt Defense System
        </div>

        <div className="font-mono text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-2" aria-hidden="true">
          <span className="text-accent">DEBT</span>
          <span className="text-accent-red">STRIKE</span>
        </div>

        <h1 className="mt-6 text-xl md:text-2xl font-bold text-foreground max-w-2xl">
          Stop Debt Collectors &amp; Fix Your Credit Report
        </h1>

        <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-xl leading-relaxed">
          Fight back with AI-powered letters that cite your federal rights.
          Stop collector calls with a Debt Validation &amp; Cease &amp; Desist letter,
          or dispute negative items on your credit report with bureau-specific FCRA letters.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/generate"
            className="btn-tactical px-10 py-4 text-lg pulse-glow"
          >
            Launch Your Debt Strike - $20
          </Link>
          <span className="text-muted font-mono text-sm">or</span>
          <Link
            href="#free"
            className="font-mono text-accent text-sm border border-accent/40 px-6 py-4 hover:bg-accent/10 transition-colors tracking-wider"
          >
            GET IT FREE
          </Link>
        </div>

        <div className="mt-4 font-mono text-xs text-muted">
          $20 one-time — or free when you share on social media.
        </div>

        {/* Trust Signals */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted">
            <span>Payments secured by</span>
            <span className="text-accent font-mono">Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <span>Based on your federal</span>
            <span className="text-accent font-mono">FDCPA</span>
            <span>rights</span>
          </div>
          <div className="text-muted">
            <span className="text-accent font-mono">No account</span>
            <span>needed</span>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="relative z-10 px-4 sm:px-6 py-8 border-t border-b border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="font-mono text-3xl font-bold text-accent mb-2">
              500+
            </div>
            <div className="text-muted text-sm">Letters Generated</div>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-accent mb-2">
              All 50
            </div>
            <div className="text-muted text-sm">States Covered</div>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-accent mb-2">
              60s
            </div>
            <div className="text-muted text-sm">Avg. Generation Time</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-16">
            <span className="text-accent">MISSION</span> BRIEFING
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-sm mb-3 tracking-widest">
                PHASE 01
              </div>
              <h3 className="font-bold text-xl mb-2">Upload Their Letter</h3>
              <p className="text-muted text-base leading-relaxed">
                Upload a PDF, snap a photo, or paste the text of the debt
                collection letter you received. Our system scans and extracts
                every detail.
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-sm mb-3 tracking-widest">
                PHASE 02
              </div>
              <h3 className="font-bold text-xl mb-2">We Build Your Response</h3>
              <p className="text-muted text-base leading-relaxed">
                Our system generates a unique Debt Validation + Cease & Desist
                letter tailored to your situation. Every letter is one-of-a-kind.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-sm mb-3 tracking-widest">
                PHASE 03
              </div>
              <h3 className="font-bold text-xl mb-2">Download & Send</h3>
              <p className="text-muted text-base leading-relaxed">
                Download your letter as a Word doc or PDF. Print it, sign it,
                and send it via Certified Mail with Return Receipt Requested.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table — Why DebtStrike */}
      <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-4">
            <span className="text-accent">WHY</span> DEBTSTRIKE
          </h2>
          <p className="text-muted text-base text-center mb-12 max-w-2xl mx-auto">
            You could hire a credit repair company, pay a lawyer, or spend hours doing it yourself. Or you could do it in 60 seconds for $20.
          </p>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border border-border bg-surface font-mono text-sm text-muted tracking-wider"></th>
                  <th className="p-4 border border-border bg-surface text-center">
                    <div className="text-muted text-sm font-normal mb-1">Credit Repair</div>
                    <div className="text-foreground font-bold">Company</div>
                  </th>
                  <th className="p-4 border border-border bg-surface text-center">
                    <div className="text-muted text-sm font-normal mb-1">Consumer</div>
                    <div className="text-foreground font-bold">Lawyer</div>
                  </th>
                  <th className="p-4 border border-border bg-surface text-center">
                    <div className="text-muted text-sm font-normal mb-1">Do It</div>
                    <div className="text-foreground font-bold">Yourself</div>
                  </th>
                  <th className="p-4 border border-accent bg-accent/10 text-center">
                    <div className="text-accent text-sm font-normal mb-1 font-mono">DEBT</div>
                    <div className="text-accent font-bold font-mono">STRIKE</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "Cost",
                    values: ["$50–150/mo", "$200–400/hr", "Free", "$20 one-time"],
                  },
                  {
                    label: "Time to letter",
                    values: ["2–4 weeks", "1–2 weeks", "Hours of research", "60 seconds"],
                  },
                  {
                    label: "Mails it for you",
                    values: ["Sometimes", "No", "No", "Yes — certified"],
                  },
                  {
                    label: "Cites specific statutes",
                    values: ["Maybe", "Yes", "Probably wrong", "FDCPA + RFDCPA"],
                  },
                  {
                    label: "Unique every time",
                    values: ["Templates", "Yes", "N/A", "AI-generated, unique"],
                  },
                  {
                    label: "Account required",
                    values: ["Yes", "Yes", "No", "No"],
                  },
                  {
                    label: "Credit report disputes",
                    values: ["Extra fee", "Extra fee", "Hours per bureau", "Included — all 3 bureaus"],
                  },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="p-4 border border-border bg-surface font-mono text-sm text-muted">
                      {row.label}
                    </td>
                    {row.values.map((val, j) => (
                      <td
                        key={j}
                        className={`p-4 border text-center text-sm ${
                          j === 3
                            ? "border-accent bg-accent/5 text-accent font-bold"
                            : "border-border text-foreground/70"
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {[
              { label: "Cost", them: "$50–400/hr or monthly", us: "$20 one-time" },
              { label: "Time to letter", them: "Days to weeks", us: "60 seconds" },
              { label: "Mails it for you", them: "Usually no", us: "Yes — certified mail" },
              { label: "Cites federal law", them: "Maybe", us: "FDCPA + RFDCPA" },
              { label: "Unique letters", them: "Templates", us: "AI-generated, unique every time" },
              { label: "Account required", them: "Yes", us: "No" },
              { label: "Credit disputes", them: "Extra fees", us: "Included — all 3 bureaus" },
            ].map((item, i) => (
              <div key={i} className="border border-border bg-surface p-4">
                <div className="font-mono text-xs text-muted tracking-wider mb-3">{item.label}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted mb-1">Others</div>
                    <div className="text-sm text-foreground/60">{item.them}</div>
                  </div>
                  <div>
                    <div className="text-xs text-accent mb-1 font-mono">DEBTSTRIKE</div>
                    <div className="text-sm text-accent font-bold">{item.us}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/generate"
              className="btn-tactical px-10 py-4 text-lg"
            >
              Get Started — $20 or Free
            </Link>
          </div>
        </div>
      </section>

      {/* What Your Letter Does */}
      <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-12">
            <span className="text-accent-red">YOUR LETTER</span> DEMANDS
          </h2>

          <div className="space-y-4">
            {[
              "STOP all phone calls immediately",
              "STOP all text messages",
              "NO robocalls, autodialers, or prerecorded messages",
              "ALL communication must be in writing only",
              "PROVE the debt is valid with full documentation",
              "SHOW the complete chain of ownership",
              "PROVIDE the original signed agreement",
              "ITEMIZE every penny they claim you owe",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 border border-border bg-surface"
              >
                <span className="font-mono text-accent text-sm mt-0.5">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <span className="text-base text-foreground font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 border border-accent/30 bg-accent/5 text-center">
            <p className="font-mono text-accent text-base">
              References federal law (FDCPA) and California state law (RFDCPA).
            </p>
          </div>
        </div>
      </section>

      {/* Pricing — Two Options */}
      <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-4">
            <span className="text-accent">COST</span> OF OPERATION
          </h2>
          <p className="text-muted text-base mb-10">Two ways to get your letter. Same letter either way.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Option A: Pay */}
            <div className="border border-accent p-8 glow-green bg-surface">
              <div className="font-mono text-xs text-accent tracking-wider mb-4">OPTION A</div>
              <div className="font-mono text-5xl font-bold text-accent mb-2">
                $20
              </div>
              <div className="text-muted text-base mb-6">One-time. Instant download.</div>
              <ul className="text-left text-base space-y-3 mb-8">
                <li className="flex gap-2">
                  <span className="text-accent">+</span> Word document (.docx)
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">+</span> PDF with signature
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">+</span> Unique letter every time
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">+</span> No subscription needed
                </li>
              </ul>
              <Link
                href="/generate"
                className="btn-tactical block w-full py-3 text-center"
              >
                Get Started
              </Link>
            </div>

            {/* Option B: Share */}
            <div className="border border-border p-8 bg-surface hover:border-accent/40 transition-colors" id="free">
              <div className="font-mono text-xs text-accent tracking-wider mb-4">OPTION B</div>
              <div className="font-mono text-5xl font-bold text-accent mb-2">
                FREE
              </div>
              <div className="text-muted text-base mb-6">Share on social media.</div>
              <ul className="text-left text-base space-y-3 mb-8">
                <li className="flex gap-2">
                  <span className="text-accent">+</span> Same exact letter
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">+</span> Same DOCX + PDF downloads
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">+</span> Post about DebtStrike
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">+</span> Upload a screenshot to unlock
                </li>
              </ul>
              <Link
                href="/generate"
                className="btn-tactical block w-full py-3 text-center"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get It Free — Walkthrough */}
      <section className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-4">
            <span className="text-accent">HOW TO GET</span> YOUR LETTER FREE
          </h2>
          <p className="text-muted text-base text-center mb-12">
            Help someone else find out they don&apos;t have to take it from debt collectors. That&apos;s it.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-sm mb-3 tracking-widest">STEP 01</div>
              <h3 className="font-bold text-xl mb-2">Generate Your Letter</h3>
              <p className="text-muted text-base leading-relaxed">
                Upload your debt collection letter and fill in your info. We generate your letter for free — no credit card needed to start.
              </p>
            </div>

            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-sm mb-3 tracking-widest">STEP 02</div>
              <h3 className="font-bold text-xl mb-2">Post on Social Media</h3>
              <p className="text-muted text-base leading-relaxed">
                Share a post about DebtStrike on Instagram, TikTok, Twitter, or Facebook. We give you suggested captions you can copy and paste.
              </p>
            </div>

            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-sm mb-3 tracking-widest">STEP 03</div>
              <h3 className="font-bold text-xl mb-2">Upload Screenshot</h3>
              <p className="text-muted text-base leading-relaxed">
                Take a screenshot of your post and upload it. Our AI verifies it mentions DebtStrike, and your letter unlocks instantly for download.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 border border-accent/30 bg-accent/5 text-center">
            <p className="text-base text-foreground/80">
              <span className="text-accent font-mono font-bold">WHY WE DO THIS:</span>{" "}
              Most people getting harassed by debt collectors don&apos;t know they have legal rights. Your post might be the reason someone else finds out. That&apos;s worth more than $20.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/generate"
              className="btn-tactical px-10 py-4 text-lg"
            >
              Start Now — Choose Pay or Share Later
            </Link>
          </div>
        </div>
      </section>

      {/* Footer / Disclaimer */}
      <footer className="relative z-10 px-4 sm:px-6 py-12 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-accent text-sm mb-4 tracking-widest">
            DEBTSTRIKE<span className="text-accent-red">.IO</span>
          </div>

          {/* Social Media Links */}
          <div className="flex justify-center gap-4 mb-8">
            <Link
              href="https://tiktok.com/@debtstrike.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-muted hover:text-accent transition-colors"
            >
              TikTok
            </Link>
            <Link
              href="https://instagram.com/debtstrike.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-muted hover:text-accent transition-colors"
            >
              Instagram
            </Link>
          </div>

          <div className="text-muted text-xs leading-relaxed space-y-2">
            <p>
              <strong>Legal Disclaimer:</strong> DebtStrike.io is NOT a law firm
              and does NOT provide legal advice. The letters generated by this
              service are for informational and educational purposes only. They
              are based on rights provided under the Fair Debt Collection
              Practices Act (FDCPA) and the California Rosenthal Fair Debt
              Collection Practices Act (RFDCPA). Using this service does not
              create an attorney-client relationship. For complex legal
              situations, consult a licensed attorney in your state.
            </p>
            <p className="mt-4">
              &copy; {new Date().getFullYear()} DebtStrike.io. All rights
              reserved.
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex justify-center gap-4 mt-6 text-muted text-xs">
            <Link href="/terms" className="underline hover:text-accent transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="underline hover:text-accent transition-colors">
              Privacy
            </Link>
            <Link href="/refund-policy" className="underline hover:text-accent transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
