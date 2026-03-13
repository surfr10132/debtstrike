import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background grid-bg scanlines">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="font-mono text-accent font-bold text-xl tracking-widest">
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </div>
        <Link
          href="/generate"
          className="btn-tactical px-4 py-2 text-sm"
        >
          Launch Strike
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
        <div className="mb-6 font-mono text-sm tracking-[0.3em] text-muted uppercase">
          // Tactical Debt Defense System
        </div>

        <h1 className="font-mono text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-2">
          <span className="text-accent">DEBT</span>
          <span className="text-accent-red">STRIKE</span>
        </h1>

        <p className="mt-6 text-xl md:text-2xl font-bold text-foreground max-w-2xl">
          Stop the calls. Demand proof. Take control.
        </p>

        <p className="mt-4 text-base md:text-lg text-muted max-w-xl leading-relaxed">
          Upload your debt collection letter. We generate a legally-referenced
          Debt Validation and Cease & Desist letter that forces collectors to
          prove the debt and communicate in writing only.
        </p>

        <Link
          href="/generate"
          className="btn-tactical mt-10 px-10 py-4 text-lg pulse-glow"
        >
          Launch Your Strike - $20
        </Link>

        <div className="mt-4 font-mono text-xs text-muted">
          One-time payment. No subscriptions. No accounts.
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20 border-t border-border">
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
              <h3 className="font-bold text-lg mb-2">Upload Their Letter</h3>
              <p className="text-muted text-sm leading-relaxed">
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
              <h3 className="font-bold text-lg mb-2">We Build Your Response</h3>
              <p className="text-muted text-sm leading-relaxed">
                Our system generates a unique Debt Validation + Cease & Desist
                letter tailored to your situation. Every letter is one-of-a-kind.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-sm mb-3 tracking-widest">
                PHASE 03
              </div>
              <h3 className="font-bold text-lg mb-2">Download & Send</h3>
              <p className="text-muted text-sm leading-relaxed">
                Download your letter as a Word doc or PDF. Print it, sign it,
                and send it via Certified Mail with Return Receipt Requested.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Your Letter Does */}
      <section className="relative z-10 px-6 py-20 border-t border-border">
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
                className="flex items-start gap-3 p-3 border border-border bg-surface"
              >
                <span className="font-mono text-accent text-sm mt-0.5">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 border border-accent/30 bg-accent/5 text-center">
            <p className="font-mono text-accent text-sm">
              References federal law (FDCPA) and California state law (RFDCPA)
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-6 py-20 border-t border-border">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8">
            <span className="text-accent">COST</span> OF OPERATION
          </h2>

          <div className="border border-accent p-8 glow-green bg-surface">
            <div className="font-mono text-5xl font-bold text-accent mb-2">
              $20
            </div>
            <div className="text-muted text-sm mb-6">One-time. Per letter.</div>
            <ul className="text-left text-sm space-y-2 mb-8">
              <li className="flex gap-2">
                <span className="text-accent">+</span> Word document (.docx) for
                printing & signing
              </li>
              <li className="flex gap-2">
                <span className="text-accent">+</span> PDF with signature ready
                to send
              </li>
              <li className="flex gap-2">
                <span className="text-accent">+</span> Unique letter every time
              </li>
              <li className="flex gap-2">
                <span className="text-accent">+</span> No subscription, no
                account needed
              </li>
            </ul>
            <Link
              href="/generate"
              className="btn-tactical block w-full py-3 text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer / Disclaimer */}
      <footer className="relative z-10 px-6 py-12 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-accent text-sm mb-4 tracking-widest">
            DEBTSTRIKE<span className="text-accent-red">.IO</span>
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
        </div>
      </footer>
    </div>
  );
}
