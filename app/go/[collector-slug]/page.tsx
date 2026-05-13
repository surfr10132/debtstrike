"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCollectorBySlug, COLLECTORS, CollectorData } from "@/lib/collectors";

// ── Email capture modal ──
function EmailCaptureModal({
  collectorName,
  onClose,
}: {
  collectorName: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Wire to email service (Resend, etc.)
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md border border-accent/40 bg-background p-8 glow-green">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground text-xl"
          aria-label="Close"
        >
          &times;
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="font-mono text-accent text-2xl mb-3">SENT</div>
            <p className="text-foreground/80">Check your inbox for the free guide.</p>
          </div>
        ) : (
          <>
            <div className="font-mono text-accent text-xs tracking-widest mb-2">
              FREE GUIDE
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Not ready yet? Get the free guide.
            </h3>
            <p className="text-muted text-sm mb-6 leading-relaxed">
              We&apos;ll email you a step-by-step guide to your rights when {collectorName} contacts
              you — what to say, what not to say, and how to make them prove the debt.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-tactical w-full px-4 py-3 text-base"
              />
              <button
                type="submit"
                className="btn-tactical w-full py-3 text-sm"
              >
                Send Me the Free Guide
              </button>
            </form>
            <p className="text-muted text-xs mt-3 text-center">
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main landing page ──
export default function CollectorLandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params["collector-slug"] as string;
  const [collector, setCollector] = useState<CollectorData | null>(null);
  const [isGeneric, setIsGeneric] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const scrollTriggered = useRef(false);
  const exitTriggered = useRef(false);

  useEffect(() => {
    if (slug === "debt-letter") {
      setIsGeneric(true);
    } else {
      const found = getCollectorBySlug(slug);
      if (found) {
        setCollector(found);
      } else {
        // Unknown collector — redirect to generic
        router.replace("/go/debt-letter");
      }
    }
  }, [slug, router]);

  // ── Exit-intent detection (desktop: mouse leaves viewport top) ──
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitTriggered.current) {
        exitTriggered.current = true;
        setShowEmailCapture(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  // ── Scroll-trigger detection (mobile: 60% scroll depth) ──
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTriggered.current) return;
      const scrollDepth =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollDepth > 0.6) {
        scrollTriggered.current = true;
        // Small delay so it doesn't feel jarring
        setTimeout(() => setShowEmailCapture(true), 800);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Derive display values ──
  const displayName = isGeneric ? "a Debt Collector" : collector?.name ?? "...";
  const shortName = isGeneric ? "the collector" : collector?.shortName ?? "them";
  const headline = isGeneric
    ? "Got a Letter from a Debt Collector?"
    : `Got a Letter from ${collector?.name ?? "..."}?`;
  const subhead = isGeneric
    ? "Upload it. We'll tell you what it means and write your legal response — $20, done in 5 minutes."
    : `Upload it. We'll analyze ${shortName}'s letter and write your legal response — $20, done in 5 minutes.`;

  // While loading
  if (!isGeneric && !collector) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="spinner-tactical" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scanlines">
      {/* ── Minimal topbar — no nav links, just brand ── */}
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-mono text-accent font-bold text-lg tracking-widest">
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </Link>
        <div className="font-mono text-xs text-muted tracking-wider hidden sm:block">
          Debt Validation Letter Generator
        </div>
      </div>

      {/* ── HERO — above the fold ── */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-20 max-w-3xl mx-auto text-center">
        {/* Urgency tag */}
        <div className="inline-block border border-accent-red/40 bg-accent-red/5 px-4 py-1.5 mb-8">
          <span className="font-mono text-accent-red text-xs tracking-widest uppercase">
            Don&apos;t ignore it — respond the right way
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-5">
          {headline}
        </h1>

        <p className="text-lg sm:text-xl text-foreground/80 leading-relaxed max-w-xl mx-auto mb-10">
          {subhead}
        </p>

        {/* Primary CTA */}
        <Link
          href="/generate"
          className="btn-tactical inline-flex px-10 py-4 text-lg pulse-glow"
        >
          Upload Your Letter — $20
        </Link>

        <div className="mt-4 text-muted text-sm font-mono">
          No account needed. Instant download. One-time payment.
        </div>
      </section>

      {/* ── Collector-specific context (only for named collectors) ── */}
      {!isGeneric && collector && (
        <section className="relative z-10 px-4 sm:px-6 py-10 border-t border-border">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-mono text-sm text-accent tracking-widest mb-4 uppercase">
              About {collector.shortName}
            </h2>
            <p className="text-foreground/80 text-base leading-relaxed mb-6">
              {collector.description}
            </p>

            <div className="space-y-2 mb-6">
              <div className="font-mono text-xs text-muted tracking-wider uppercase mb-3">
                Common complaints
              </div>
              {collector.complaints.map((complaint, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 border border-border bg-surface"
                >
                  <span className="font-mono text-accent-red text-sm mt-0.5 shrink-0">
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <span className="text-foreground/90 text-sm">{complaint}</span>
                </div>
              ))}
            </div>

            <div className="p-3 border border-accent/20 bg-accent/5 text-sm text-foreground/70">
              <span className="text-accent font-mono font-bold">NOTE: </span>
              {collector.keyFact}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works — 3 steps ── */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-16 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-mono text-xl sm:text-2xl font-bold text-center mb-10">
            <span className="text-accent">HOW IT</span> WORKS
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border p-6 bg-surface relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-mono text-accent text-xs tracking-widest">
                01
              </div>
              <h3 className="font-bold text-lg mb-2 mt-1">Upload Their Letter</h3>
              <p className="text-muted text-sm leading-relaxed">
                Snap a photo, upload the PDF, or paste the text. Our AI reads
                every detail — collector name, address, account number, amount.
              </p>
            </div>

            <div className="border border-border p-6 bg-surface relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-mono text-accent text-xs tracking-widest">
                02
              </div>
              <h3 className="font-bold text-lg mb-2 mt-1">We Write Your Response</h3>
              <p className="text-muted text-sm leading-relaxed">
                A unique Debt Validation + Cease & Desist letter, written in
                plain English like you wrote it yourself. Every letter is
                one-of-a-kind.
              </p>
            </div>

            <div className="border border-border p-6 bg-surface relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-mono text-accent text-xs tracking-widest">
                03
              </div>
              <h3 className="font-bold text-lg mb-2 mt-1">Download & Send</h3>
              <p className="text-muted text-sm leading-relaxed">
                Download as Word doc or PDF. Print, sign, and mail via USPS
                Certified Mail. They have 30 days to respond — or delete the
                debt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What your letter does ── */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-16 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-mono text-xl sm:text-2xl font-bold text-center mb-10">
            <span className="text-accent-red">YOUR LETTER</span> FORCES THEM TO
          </h2>

          <div className="space-y-3">
            {[
              "STOP all phone calls immediately",
              "PROVE the debt is valid with full documentation",
              "SHOW the complete chain of ownership",
              "Communicate in WRITING ONLY — no more calls or texts",
              "PROVIDE the original signed agreement",
              "ITEMIZE every dollar they claim you owe",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 border border-border bg-surface"
              >
                <span className="text-accent font-mono text-sm mt-0.5">+</span>
                <span className="text-foreground/90 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 border border-accent/30 bg-accent/5 text-center">
            <p className="font-mono text-accent text-xs">
              References FDCPA (federal law) + California RFDCPA
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust / FAQ ── */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-16 border-t border-border">
        <div className="max-w-2xl mx-auto space-y-8">
          <FAQItem
            question="Is this a scam?"
            answer={`No. DebtStrike.io is a letter generator — it creates a Debt Validation letter based on your rights under the Fair Debt Collection Practices Act (FDCPA). The FDCPA is federal law. You have the right to demand that ${shortName} prove the debt is valid. That's not a scam — that's using the law the way it was written.`}
          />
          <FAQItem
            question="Do I need a lawyer?"
            answer={`For most debt collection letters, no. A Debt Validation letter is something you can send yourself — it's your right under federal law. If ${shortName} sues you or if the debt is large and complex, you should talk to a consumer protection attorney. But sending a validation letter is a smart first step regardless.`}
          />
          <FAQItem
            question="What happens if I just ignore the letter?"
            answer={`Ignoring a collection letter doesn't make it go away. ${isGeneric ? "The collector" : collector?.shortName} can report it to credit bureaus, keep calling, and potentially sue you. Sending a Debt Validation letter forces them to stop calling and prove the debt is real — and many collectors can't, because they bought the debt secondhand with incomplete records.`}
          />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-16 border-t border-border">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Respond in 5 minutes. $20. Done.
          </h2>
          <p className="text-muted text-base mb-8">
            {isGeneric
              ? "Every day you wait, they can keep calling and reporting to credit bureaus."
              : `Every day you wait, ${collector?.shortName} can keep calling and reporting to credit bureaus.`}
          </p>
          <Link
            href="/generate"
            className="btn-tactical inline-flex px-10 py-4 text-lg pulse-glow"
          >
            Upload Your Letter Now
          </Link>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted font-mono">
            <span>Secured by Stripe</span>
            <span>&middot;</span>
            <span>No account needed</span>
            <span>&middot;</span>
            <span>Instant download</span>
          </div>

          {/* Link to full content page */}
          {!isGeneric && collector && (
            <div className="mt-8 pt-6 border-t border-border">
              <Link
                href={`/${collector.contentPageSlug}`}
                className="text-accent text-sm font-mono hover:underline"
              >
                Read the full guide: How to deal with {collector.name} &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Minimal footer ── */}
      <footer className="relative z-10 px-4 sm:px-6 py-8 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-accent text-xs mb-3 tracking-widest">
            DEBTSTRIKE<span className="text-accent-red">.IO</span>
          </div>
          <p className="text-muted text-xs leading-relaxed max-w-lg mx-auto mb-4">
            DebtStrike.io is NOT a law firm and does NOT provide legal advice. Letters are
            based on rights under the FDCPA and California RFDCPA. For complex situations,
            consult a licensed attorney.
          </p>
          <div className="flex justify-center gap-4 text-muted text-xs">
            <Link href="/terms" className="hover:text-accent transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-accent transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Email capture modal ── */}
      {showEmailCapture && (
        <EmailCaptureModal
          collectorName={isGeneric ? "a debt collector" : collector?.name ?? "a debt collector"}
          onClose={() => setShowEmailCapture(false)}
        />
      )}
    </div>
  );
}

// ── FAQ Accordion Item ──
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-bold text-base text-foreground">{question}</span>
        <span className="font-mono text-accent text-lg ml-4 shrink-0">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-muted text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
