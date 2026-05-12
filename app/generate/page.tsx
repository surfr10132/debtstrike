"use client";

import { useState } from "react";
import Link from "next/link";
import DebtStrikeFlow from "./DebtStrikeFlow";
import CreditRepairFlow from "./CreditRepairFlow";

type Mode = null | "debt" | "credit";

export default function GeneratePage() {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <div className="min-h-screen bg-background grid-bg scanlines">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <Link href="/" className="font-mono text-accent font-bold text-lg sm:text-xl tracking-widest">
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/resources" className="text-foreground hover:text-accent transition-colors text-sm sm:text-base">
            Resources
          </Link>
          {mode !== null && (
            <button
              onClick={() => setMode(null)}
              className="font-mono text-accent text-sm hover:text-accent-dim transition-colors"
            >
              Switch Module
            </button>
          )}
        </div>
      </nav>

      {/* Choice Screen */}
      {mode === null && (
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12">
            <div className="font-mono text-sm tracking-[0.3em] text-muted uppercase mb-4">
              // Select Your Mission
            </div>
            <h1 className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-accent">WHAT DO YOU</span>{" "}
              <span className="text-accent-red">NEED?</span>
            </h1>
            <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
              Choose the tool that fits your situation. Both are powered by AI and built on your federal rights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Debt Strike */}
            <button
              onClick={() => setMode("debt")}
              className="border-2 border-border p-8 bg-surface text-left hover:border-accent transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 border-2 border-accent flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
                    <path d="M12 2L2 7v6c0 5.5 4.2 10.6 10 12 5.8-1.4 10-6.5 10-12V7L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="font-mono text-accent text-xs tracking-widest">DEBT STRIKE</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-foreground group-hover:text-accent transition-colors">
                Stop a Debt Collector
              </h2>
              <p className="text-muted text-sm leading-relaxed mb-4">
                A debt collector is calling, texting, or sending you letters. Generate a Debt Validation + Cease &amp; Desist letter that forces them to prove the debt and stop contacting you.
              </p>
              <div className="space-y-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <span className="text-accent">+</span>
                  <span>Upload their letter or enter details manually</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">+</span>
                  <span>AI-generated unique letter citing FDCPA &amp; RFDCPA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">+</span>
                  <span>Download or we mail it via USPS Certified Mail</span>
                </div>
              </div>
              <div className="mt-6 font-mono text-accent text-sm tracking-wider group-hover:translate-x-1 transition-transform">
                LAUNCH DEBT STRIKE &rarr;
              </div>
            </button>

            {/* Credit Repair */}
            <button
              onClick={() => setMode("credit")}
              className="border-2 border-border p-8 bg-surface text-left hover:border-accent transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 border-2 border-accent flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 9h10M7 13h6M7 17h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M17 16l1 1 2-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="font-mono text-accent text-xs tracking-widest">CREDIT STRIKE</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-foreground group-hover:text-accent transition-colors">
                Dispute Your Credit Report
              </h2>
              <p className="text-muted text-sm leading-relaxed mb-4">
                Negative items on your credit report dragging your score down? Upload your report and we&apos;ll generate dispute letters to all three bureaus citing the FCRA.
              </p>
              <div className="space-y-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <span className="text-accent">+</span>
                  <span>Upload a tri-merge credit report (PDF or image)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">+</span>
                  <span>AI scans and identifies every negative item</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">+</span>
                  <span>Unique FCRA dispute letters for each bureau</span>
                </div>
              </div>
              <div className="mt-6 font-mono text-accent text-sm tracking-wider group-hover:translate-x-1 transition-transform">
                LAUNCH CREDIT STRIKE &rarr;
              </div>
            </button>
          </div>

          {/* Help text */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="border border-border p-5 bg-surface">
              <div className="font-mono text-accent text-xs tracking-widest mb-3">NOT SURE WHICH ONE?</div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted">
                <div>
                  <div className="font-medium text-foreground mb-1">Choose Debt Strike if:</div>
                  <p>A specific collector is contacting you and you want them to stop and prove the debt is real.</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">Choose Credit Strike if:</div>
                  <p>You want to clean up your credit report by disputing negative items with TransUnion, Experian, and Equifax.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Strike Flow */}
      {mode === "debt" && (
        <DebtStrikeFlow onBack={() => setMode(null)} />
      )}

      {/* Credit Repair Flow */}
      {mode === "credit" && (
        <CreditRepairFlow onBack={() => setMode(null)} />
      )}

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 py-8 border-t border-border mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-accent text-sm mb-4 tracking-widest">
            DEBTSTRIKE<span className="text-accent-red">.IO</span>
          </div>
          <div className="text-muted text-xs leading-relaxed">
            <p>
              <strong>Legal Disclaimer:</strong> DebtStrike.io is NOT a law firm
              and does NOT provide legal advice. Letters are based on rights provided
              under the FDCPA, FCRA, and California RFDCPA. Using this service does
              not create an attorney-client relationship.
            </p>
            <p className="mt-2">
              &copy; {new Date().getFullYear()} DebtStrike.io. All rights
              reserved.
            </p>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-muted text-xs">
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
