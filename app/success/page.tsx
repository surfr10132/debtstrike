"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

const DocxIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const PdfIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15c0 .6.4 1 1 1h.5a1.5 1.5 0 000-3H10a1 1 0 00-1 1v2z"/>
    <path d="M15 12v3"/>
    <path d="M13 12h2.5a1.5 1.5 0 010 3H13"/>
  </svg>
);

const DownloadArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const payloadId = searchParams.get("payload_id");

  if (!sessionId || !payloadId) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="font-mono text-accent-red text-2xl font-bold mb-4">INVALID ACCESS</div>
          <p className="text-muted text-sm mb-6">
            This page requires a valid payment session.
          </p>
          <Link href="/generate" className="btn-tactical px-8 py-3">
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  const downloadUrl = (format: "docx" | "pdf") =>
    `/api/download?payloadId=${payloadId}&format=${format}&session_id=${sessionId}`;

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="font-mono text-accent font-bold text-xl tracking-widest">
          DEBT<span className="text-accent-red">STRIKE</span><span className="text-muted">.IO</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-14">
        {/* Success Header */}
        <div className="text-center mb-12">
          {/* Animated checkmark */}
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-accent mb-6 glow-green">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline className="check-animated" points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <div className="font-mono text-xs tracking-[0.3em] text-accent-dim uppercase mb-3">
            // Operation Complete
          </div>
          <h1 className="font-mono text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="text-accent">MISSION</span>{" "}
            <span className="text-accent-red">ACCOMPLISHED</span>
          </h1>
          <p className="text-muted text-base">
            Your letter is ready. Download both formats below.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <a
            href={downloadUrl("docx")}
            className="group border border-accent bg-surface p-6 flex flex-col items-center gap-3 hover:bg-accent/10 hover:border-accent transition-all duration-200 glow-green-hover"
          >
            <div className="text-accent opacity-70 group-hover:opacity-100 transition-opacity">
              <DocxIcon />
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-accent mb-1">WORD (.docx)</div>
              <div className="text-xs text-muted">Print and sign by hand</div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-accent mt-1">
              <DownloadArrow />
              Download
            </div>
          </a>

          <a
            href={downloadUrl("pdf")}
            className="group border border-accent bg-surface p-6 flex flex-col items-center gap-3 hover:bg-accent/10 hover:border-accent transition-all duration-200 glow-green-hover"
          >
            <div className="text-accent opacity-70 group-hover:opacity-100 transition-opacity">
              <PdfIcon />
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-accent mb-1">PDF (.pdf)</div>
              <div className="text-xs text-muted">Signature-ready to send</div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-accent mt-1">
              <DownloadArrow />
              Download
            </div>
          </a>
        </div>

        {/* Next Steps */}
        <div className="border border-border bg-surface p-6 mb-8">
          <div className="font-mono text-accent text-xs mb-5 tracking-wider">
            NEXT STEPS:
          </div>
          <div className="space-y-4">
            {[
              { num: "01", label: "Print the Word document and sign it by hand in the signature space" },
              { num: "02", label: "Send via USPS Certified Mail with Return Receipt Requested" },
              { num: "03", label: "Keep copies of the letter and certified mail receipt" },
              { num: "04", label: "The collector has 30 days to respond with debt verification" },
            ].map(({ num, label }) => (
              <div key={num} className="flex gap-4">
                <span className="font-mono text-accent text-xs min-w-[28px] pt-0.5">[{num}]</span>
                <span className="text-sm leading-relaxed">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-muted text-xs p-4 border border-border mb-8 leading-relaxed">
          <strong className="text-foreground">Disclaimer:</strong> DebtStrike.io is not a law firm and does
          not provide legal advice. This letter is based on your rights under the FDCPA and California RFDCPA.
          If the collector continues to contact you by phone after receiving this letter, consult a consumer
          protection attorney — this may constitute a violation of federal law.
        </div>

        <div className="text-center">
          <Link href="/" className="btn-tactical px-8 py-3 text-sm">
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
          <div className="spinner-tactical" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
