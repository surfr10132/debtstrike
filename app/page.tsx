import Link from "next/link";

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4" strokeWidth="1.5"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background grid-bg scanlines">

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="font-mono text-accent font-bold text-xl tracking-widest">
          DEBT<span className="text-accent-red">STRIKE</span><span className="text-muted">.IO</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs text-muted">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent status-pulse" />
            SYSTEM ONLINE
          </div>
          <Link href="/generate" className="btn-tactical px-4 py-2 text-sm">
            Launch Strike
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-20 md:py-28 text-center">

        <div className="mb-5 text-accent-red hero-shield-glow">
          <ShieldIcon />
        </div>

        <div className="mb-4 font-mono text-xs tracking-[0.3em] text-muted uppercase">
          // Tactical Consumer Defense System
        </div>

        <h1 className="font-mono text-5xl md:text-7xl font-bold tracking-tight leading-none">
          <span className="text-accent">DEBT</span><span className="text-accent-red">STRIKE</span>
        </h1>

        <p className="mt-6 text-xl md:text-2xl font-bold text-foreground max-w-2xl leading-snug">
          Stop the calls. Demand proof. Take control.
        </p>

        <p className="mt-4 text-base text-muted max-w-xl leading-relaxed">
          Upload your collection letter. We generate a legally-referenced
          Debt Validation + Cease &amp; Desist in minutes.
        </p>

        <Link
          href="/generate"
          className="btn-tactical mt-10 px-12 py-4 text-lg pulse-glow inline-block"
        >
          Launch Your Strike — $20
        </Link>

        <div className="mt-3 font-mono text-xs text-muted">
          One-time payment · No subscription · No account needed
        </div>

        {/* Stats Bar */}
        <div className="mt-14 w-full max-w-2xl grid grid-cols-3 border border-border overflow-hidden">
          <div className="bg-surface px-6 py-5 text-center">
            <div className="font-mono text-2xl md:text-3xl font-bold text-accent">77M</div>
            <div className="font-mono text-xs text-muted mt-1 tracking-wider uppercase">Americans Affected</div>
          </div>
          <div className="bg-surface px-6 py-5 text-center border-x border-border">
            <div className="font-mono text-2xl md:text-3xl font-bold text-accent">$1,000</div>
            <div className="font-mono text-xs text-muted mt-1 tracking-wider uppercase">Per Violation</div>
          </div>
          <div className="bg-surface px-6 py-5 text-center">
            <div className="font-mono text-2xl md:text-3xl font-bold text-accent">$20</div>
            <div className="font-mono text-xs text-muted mt-1 tracking-wider uppercase">Flat Fee</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="font-mono text-xs text-muted tracking-[0.3em] text-center mb-3 uppercase">
            // How it works
          </div>
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-14">
            <span className="text-accent">MISSION</span> BRIEFING
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                phase: "PHASE 01",
                title: "Upload Their Letter",
                desc: "Upload a PDF, snap a photo, or paste the text. AI scans and extracts every collector detail automatically.",
                Icon: UploadIcon,
              },
              {
                phase: "PHASE 02",
                title: "We Build Your Response",
                desc: "A unique Debt Validation + Cease & Desist letter is generated, tailored to your collector and citing FDCPA by section.",
                Icon: BoltIcon,
              },
              {
                phase: "PHASE 03",
                title: "Download & Send",
                desc: "Download your letter as Word or PDF. Sign it, send via Certified Mail, and let federal law do the rest.",
                Icon: DownloadIcon,
              },
            ].map(({ phase, title, desc, Icon }) => (
              <div
                key={phase}
                className="border border-border p-6 bg-surface relative group hover:border-accent/40 transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="text-accent mb-5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <Icon />
                </div>
                <div className="font-mono text-accent text-xs mb-2 tracking-widest">{phase}</div>
                <h3 className="font-bold text-base mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Letter Demands */}
      <section className="relative z-10 px-6 py-20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="font-mono text-xs text-muted tracking-[0.3em] text-center mb-3 uppercase">
            // What the letter demands
          </div>
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-12">
            <span className="text-accent-red">YOUR LETTER</span> DEMANDS
          </h2>

          <div className="grid md:grid-cols-2 gap-3 mb-8">
            {[
              ["STOP", "all phone calls immediately"],
              ["STOP", "all text messages"],
              ["NO", "robocalls, autodialers, or prerecorded messages"],
              ["ONLY", "written communication going forward"],
              ["PROVE", "the debt is valid with full documentation"],
              ["SHOW", "the complete chain of ownership"],
              ["PROVIDE", "the original signed agreement"],
              ["ITEMIZE", "every penny they claim you owe"],
            ].map(([keyword, rest], i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 border border-border bg-surface hover:border-accent/25 transition-colors"
              >
                <span className="font-mono text-accent-red text-xs font-bold mt-0.5 min-w-[50px] tracking-wider">
                  {keyword}
                </span>
                <span className="text-sm text-foreground">{rest}</span>
              </div>
            ))}
          </div>

          <div className="p-4 border border-accent/20 bg-accent/5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span className="font-mono text-accent text-xs font-bold">FDCPA</span>
            <span className="text-muted text-xs">+</span>
            <span className="font-mono text-accent text-xs font-bold">California RFDCPA</span>
            <span className="text-muted text-xs hidden md:inline">·</span>
            <span className="text-muted text-xs font-mono">Each violation = up to $1,000 in damages</span>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="relative z-10 px-6 py-20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="font-mono text-xs text-muted tracking-[0.3em] text-center mb-3 uppercase">
            // The legal mechanism
          </div>
          <h2 className="font-mono text-2xl md:text-3xl font-bold text-center mb-12">
            WHY IT <span className="text-accent">WORKS</span>
          </h2>

          <div className="space-y-4">
            {[
              {
                num: "01",
                title: "Federal law is on your side",
                body: "The Fair Debt Collection Practices Act (15 U.S.C. § 1692) gives you specific rights against third-party collectors — regardless of whether you owe the debt.",
              },
              {
                num: "02",
                title: "Written notice locks them in",
                body: "Under FDCPA § 1692c(c), once a collector receives written notice to stop, they must stop. Every call after that is a separate federal violation worth up to $1,000.",
              },
              {
                num: "03",
                title: "They have to prove what they claim",
                body: "Under § 1692g, you can demand verification. If they can't document the debt — they're legally required to cease collection efforts entirely.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="border border-border bg-surface p-5 flex gap-5">
                <div className="font-mono text-accent text-sm font-bold min-w-[32px] pt-0.5">{num}</div>
                <div>
                  <div className="font-bold text-sm mb-1">{title}</div>
                  <div className="text-muted text-sm leading-relaxed">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-6 py-20 border-t border-border">
        <div className="max-w-sm mx-auto text-center">
          <div className="font-mono text-xs text-muted tracking-[0.3em] text-center mb-3 uppercase">
            // Cost of operation
          </div>
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8">
            ONE PAYMENT. <span className="text-accent">ONE LETTER.</span>
          </h2>

          <div className="border border-accent p-8 glow-green bg-surface">
            <div className="font-mono text-6xl font-bold text-accent mb-1">$20</div>
            <div className="text-muted text-sm mb-8 font-mono tracking-wider">FLAT FEE · NO SUBSCRIPTION</div>

            <div className="text-left space-y-3 mb-8">
              {[
                "Word document (.docx) — print & sign",
                "PDF — signature-ready to send",
                "Unique letter for your collector",
                "FDCPA sections cited by name",
                "California RFDCPA included",
                "No account required",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-accent mt-0.5 flex-shrink-0"><CheckIcon /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link href="/generate" className="btn-tactical block w-full py-4 text-center text-base">
              Get Started — $20
            </Link>

            <div className="mt-4 font-mono text-xs text-muted">
              Secure payment via Stripe
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="font-mono font-bold tracking-widest">
              <span className="text-accent">DEBT</span><span className="text-accent-red">STRIKE</span><span className="text-muted text-sm">.IO</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-muted">
              <span>FDCPA</span>
              <span className="text-border">·</span>
              <span>RFDCPA</span>
              <span className="text-border">·</span>
              <span>Consumer Rights</span>
            </div>
          </div>

          <div className="text-muted text-xs leading-relaxed border-t border-border pt-6 space-y-3">
            <p>
              <strong className="text-foreground">Legal Disclaimer:</strong> DebtStrike.io is NOT a law firm
              and does NOT provide legal advice. Letters generated by this service are for informational and
              educational purposes only, based on rights under the FDCPA and California RFDCPA. Use of this
              service does not create an attorney-client relationship. Consult a licensed attorney for your situation.
            </p>
            <p>&copy; {new Date().getFullYear()} DebtStrike.io · All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
