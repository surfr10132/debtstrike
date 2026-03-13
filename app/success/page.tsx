"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const payloadId = searchParams.get("payload_id");

  if (!sessionId || !payloadId) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-accent-red text-2xl font-bold mb-4">
            INVALID ACCESS
          </div>
          <p className="text-muted text-sm mb-6">
            This page requires a valid payment session.
          </p>
          <Link href="/generate" className="btn-tactical px-8 py-3">
            START OVER
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
        <Link
          href="/"
          className="font-mono text-accent font-bold text-xl tracking-widest"
        >
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        {/* Success Header */}
        <div className="mb-2 font-mono text-sm tracking-[0.3em] text-accent-dim uppercase">
          // Operation Complete
        </div>
        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-4">
          <span className="text-accent">MISSION</span>{" "}
          <span className="text-accent-red">ACCOMPLISHED</span>
        </h1>
        <p className="text-muted text-lg mb-12">
          Your letter has been generated and is ready for download.
        </p>

        {/* Download Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a
            href={downloadUrl("docx")}
            className="btn-tactical p-6 text-center block glow-green-hover"
          >
            <div className="font-mono text-2xl mb-2">DOCX</div>
            <div className="text-xs text-muted normal-case tracking-normal font-normal">
              Word document - print and sign by hand
            </div>
          </a>
          <a
            href={downloadUrl("pdf")}
            className="btn-tactical p-6 text-center block glow-green-hover"
          >
            <div className="font-mono text-2xl mb-2">PDF</div>
            <div className="text-xs text-muted normal-case tracking-normal font-normal">
              PDF with handwriting-style signature
            </div>
          </a>
        </div>

        {/* Instructions */}
        <div className="border border-border p-6 bg-surface text-left mb-8">
          <div className="font-mono text-accent text-sm mb-4 tracking-wider">
            NEXT STEPS:
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-mono text-accent">[01]</span>
              <span>
                <strong>Print</strong> the Word document and{" "}
                <strong>sign it by hand</strong> in the blank signature space
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-mono text-accent">[02]</span>
              <span>
                Send the letter via <strong>USPS Certified Mail</strong> with{" "}
                <strong>Return Receipt Requested</strong>
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-mono text-accent">[03]</span>
              <span>
                <strong>Keep copies</strong> of the letter and the certified
                mail receipt for your records
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-mono text-accent">[04]</span>
              <span>
                The collector has <strong>30 days</strong> to respond with
                validation of the debt
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-muted text-xs p-3 border border-border mb-8">
          <strong>Disclaimer:</strong> DebtStrike.io is not a law firm and does
          not provide legal advice. This letter is based on your rights under the
          FDCPA and California RFDCPA. If the collector continues to contact you
          by phone after receiving this letter, consult a consumer protection
          attorney as this may constitute a violation of federal law.
        </div>

        <Link href="/" className="btn-tactical px-8 py-3 text-sm">
          RETURN TO BASE
        </Link>
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
