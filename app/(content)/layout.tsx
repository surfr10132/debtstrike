import Link from "next/link";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <Link href="/" className="font-mono text-accent font-bold text-lg sm:text-xl tracking-widest">
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/resources" className="text-foreground hover:text-accent transition-colors">
            Resources
          </Link>
          <Link href="/generate" className="btn-tactical px-4 py-2 text-sm">
            Launch Strike
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {children}
      </main>

      {/* CTA Banner */}
      <section className="relative z-10 border-t border-accent/30 bg-accent/5 px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-accent text-sm tracking-widest mb-2 uppercase">
            // Ready to take action?
          </p>
          <p className="text-foreground text-lg font-bold mb-6">
            Generate your personalized Debt Validation + Cease and Desist letter in 60 seconds.
          </p>
          <Link href="/generate" className="btn-tactical px-10 py-4 text-base pulse-glow inline-block">
            Launch Your Strike — $20
          </Link>
          <p className="mt-3 font-mono text-xs text-muted">
            One-time payment. No subscriptions. No accounts.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 py-10 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-accent text-sm mb-4 tracking-widest">
            DEBTSTRIKE<span className="text-accent-red">.IO</span>
          </div>
          <p className="text-muted text-xs leading-relaxed max-w-xl mx-auto">
            <strong className="text-muted">Legal Disclaimer:</strong> DebtStrike.io is NOT a law firm and does NOT provide legal advice.
            The content on this site is for informational purposes only, based on rights provided under the FDCPA and California RFDCPA.
            For complex legal situations, consult a licensed attorney.
          </p>

          {/* Social Media Links */}
          <div className="flex justify-center gap-6 mt-4">
            <a
              href="https://tiktok.com/@debtstrike.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent text-xs font-mono transition-colors"
            >
              TikTok
            </a>
            <a
              href="https://instagram.com/debtstrike.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent text-xs font-mono transition-colors"
            >
              Instagram
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/terms" className="text-muted hover:text-foreground text-xs underline transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-muted hover:text-foreground text-xs underline transition-colors">
              Privacy
            </Link>
            <Link href="/refund-policy" className="text-muted hover:text-foreground text-xs underline transition-colors">
              Refund Policy
            </Link>
          </div>

          <p className="mt-4 text-muted text-xs">
            &copy; {new Date().getFullYear()} DebtStrike.io. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
