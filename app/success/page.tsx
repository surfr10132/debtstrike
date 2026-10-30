"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const payloadId = searchParams.get("payload_id");
  const wasMailed = searchParams.get("mailed") === "1";
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [mailLoading, setMailLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [mailResult, setMailResult] = useState<{
    success: boolean;
    trackingNumber?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId || !payloadId) {
        setSessionValid(false);
        return;
      }


      try {
        const response = await fetch(
          `/api/validate-session?payload_id=${payloadId}&session_id=${sessionId}`
        );
        setSessionValid(response.ok);
      } catch (error) {
        console.error("Session validation error:", error);
        setSessionValid(false);
      }
    };

    validateSession();
  }, [sessionId, payloadId]);

  // If this was a "mail for me" checkout, poll webhook-driven mail status.
  useEffect(() => {
    if (!wasMailed || !sessionValid || !payloadId || !sessionId) return;
    let isCancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const checkMailStatus = async () => {
      try {
        const response = await fetch(
          `/api/mail-status?payload_id=${payloadId}&session_id=${sessionId}`
        );
        const data = await response.json();
        if (isCancelled) return true;

        if (!response.ok) {
          setMailLoading(true);
          return false;
        }

        if (data.status === "submitted") {
          setMailResult({
            success: true,
            trackingNumber: data.trackingNumber,
          });
          setMailLoading(false);
          return true;
        }

        if (data.status === "failed") {
          setMailResult({
            success: false,
            error: data.error || "Failed to submit letter for mailing.",
          });
          setMailLoading(false);
          return true;
        }

        if (data.status === "not_applicable") {
          setMailLoading(false);
          return true;
        }

        if (data.status === "pending") {
          setMailLoading(true);
          return false;
        }

        setMailLoading(true);
        return false;
      } catch (error) {
        if (!isCancelled) {
          console.error("Mail status polling error:", error);
          setMailLoading(true);
        }
        return false;
      }
    };

    const startPolling = async () => {
      setMailLoading(true);
      const complete = await checkMailStatus();
      if (complete || isCancelled) return;
      pollTimer = setInterval(async () => {
        const done = await checkMailStatus();
        if (done && pollTimer) {
          clearInterval(pollTimer);
          pollTimer = undefined;
        }
      }, 4000);
    };

    startPolling();

    return () => {
      isCancelled = true;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [wasMailed, sessionValid, payloadId, sessionId]);

  const handleDownload = useCallback(async (format: "docx" | "pdf") => {
    setDownloading(format);
    try {
      const response = await fetch(
        `/api/download?payload_id=${payloadId}&format=${format}&session_id=${sessionId}`
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Download failed");
      }

      // Trigger browser download from the response blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DebtStrike-Letter.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(
        "Download failed. Please try again or email info@debtstrike.io for help."
      );
    } finally {
      setDownloading(null);
    }
  }, [payloadId, sessionId]);

  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="spinner-tactical" />
      </div>
    );
  }

  if (!sessionId || !payloadId || !sessionValid) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="font-mono text-accent-red text-2xl font-bold mb-4">
            SESSION EXPIRED
          </div>
          <p className="text-muted text-sm mb-4">
            Your download session has expired or could not be found. This can happen if too much time passed after payment.
          </p>
          <p className="text-muted text-sm mb-6">
            If you already paid, email us at{" "}
            <a href="mailto:info@debtstrike.io" className="text-accent underline">
              info@debtstrike.io
            </a>{" "}
            with your payment confirmation and we&apos;ll send your letter directly.
          </p>
          <Link href="/generate" className="btn-tactical px-8 py-3">
            START OVER
          </Link>
        </div>
      </div>
    );
  }

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
        {/* Send Animation */}
        <div className="send-animation mb-8">
          <div className="envelope-wrap mx-auto mb-8" style={{ width: 120, height: 80, position: 'relative' }}>
            <div className="send-letter-paper" />
            <div className="send-envelope">
              <div className="send-envelope-flap" />
            </div>
          </div>
          <div className="send-reveal">
            <div className="send-checkmark mx-auto mb-5">
              <span className="text-accent text-2xl font-bold">&#10003;</span>
            </div>
            <h1 className="font-mono text-4xl md:text-5xl font-bold mb-2">
              <span className="text-accent">MISSION</span>{" "}
              <span className="text-accent-red">ACCOMPLISHED</span>
            </h1>
            <p className="text-muted text-lg mb-2">
              {wasMailed
                ? "Your letter is being printed and mailed."
                : "Your letter is ready for download."}
            </p>
          </div>
        </div>

        {/* Mailing Status (if mail-for-me was selected) */}
        {wasMailed && (
          <div className="border border-border bg-surface mb-10">
            <div className="px-5 py-3 border-b border-border font-mono text-xs text-accent tracking-wider font-bold">
              CERTIFIED MAIL STATUS
            </div>
            <div className="p-5">
              {mailLoading && (
                <div className="flex items-center justify-center gap-3">
                  <div className="spinner-tactical" style={{ width: 16, height: 16 }} />
                  <span className="font-mono text-sm text-muted">Submitting to USPS...</span>
                </div>
              )}
              {mailResult?.success && (
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-accent text-xl">&#10003;</span>
                    <span className="font-mono text-accent font-bold text-sm">LETTER SUBMITTED FOR MAILING</span>
                  </div>
                  {mailResult.trackingNumber && (
                    <div className="border border-border bg-background p-4 mb-3">
                      <div className="font-mono text-[10px] text-muted tracking-widest mb-1">USPS TRACKING NUMBER</div>
                      <div className="font-mono text-accent text-lg font-bold tracking-wider">
                        {mailResult.trackingNumber}
                      </div>
                      <a
                        href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${mailResult.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent underline mt-1 inline-block"
                      >
                        Track on USPS.com &rarr;
                      </a>
                    </div>
                  )}
                  <div className="border-2 border-[var(--accent-green)] bg-[rgba(0,255,65,0.04)] p-4 rounded">
                    <p className="text-sm text-foreground leading-relaxed mb-2">
                      <strong>Save your tracking number.</strong> This is your proof that the collector received your letter.
                      If they keep calling after delivery, that tracking number helps prove FDCPA violations and can support <span className="text-accent font-bold">up to $1,000 in statutory damages per case</span>.
                    </p>
                    <p className="text-sm text-accent font-mono font-bold">
                      Screenshot this page or write down the tracking number now.
                    </p>
                  </div>
                </div>
              )}
              {mailResult && !mailResult.success && (
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-accent-red text-xl">&#10007;</span>
                    <span className="font-mono text-accent-red font-bold text-sm">MAILING ERROR</span>
                  </div>
                  <p className="text-sm text-muted mb-3">{mailResult.error}</p>
                  <p className="text-sm text-muted">
                    Don&apos;t worry — your payment is safe. Email{" "}
                    <a href="mailto:info@debtstrike.io" className="text-accent underline">
                      info@debtstrike.io
                    </a>{" "}
                    and we&apos;ll send your letter manually.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <button
            onClick={() => handleDownload("docx")}
            disabled={!!downloading}
            className="btn-tactical p-6 text-center block glow-green-hover w-full"
          >
            {downloading === "docx" ? (
              <div className="flex items-center justify-center gap-2">
                <div className="spinner-tactical" style={{ width: 16, height: 16 }} />
                <span className="font-mono text-sm">GENERATING...</span>
              </div>
            ) : (
              <>
                <div className="font-mono text-2xl mb-2">DOCX</div>
                <div className="text-xs text-muted normal-case tracking-normal font-normal">
                  Word document &mdash; print and sign by hand
                </div>
              </>
            )}
          </button>
          <button
            onClick={() => handleDownload("pdf")}
            disabled={!!downloading}
            className="btn-tactical p-6 text-center block glow-green-hover w-full"
          >
            {downloading === "pdf" ? (
              <div className="flex items-center justify-center gap-2">
                <div className="spinner-tactical" style={{ width: 16, height: 16 }} />
                <span className="font-mono text-sm">GENERATING...</span>
              </div>
            ) : (
              <>
                <div className="font-mono text-2xl mb-2">PDF</div>
                <div className="text-xs text-muted normal-case tracking-normal font-normal">
                  PDF with handwriting-style signature
                </div>
              </>
            )}
          </button>
        </div>

        {/* WHAT HAPPENS NEXT — Timeline */}
        <div className="border border-border bg-surface text-left mb-8">
          <div className="px-5 py-3 border-b border-border font-mono text-xs text-accent tracking-wider font-bold">
            WHAT HAPPENS NEXT
          </div>
          <div className="p-5 relative">
            <div className="absolute left-[39px] top-5 bottom-5 w-0.5 bg-[var(--border-color)]" />

            {/* Step 1: CERTIFIED MAIL */}
            <div className="flex gap-4 mb-6 relative">
              <div className="w-5 h-5 rounded-full bg-[var(--accent-green)] flex-shrink-0 z-10 flex items-center justify-center">
                <span className="text-[var(--background)] text-[10px] font-bold">1</span>
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] text-accent tracking-widest mb-1">
                  {wasMailed ? "IN PROGRESS" : "RIGHT NOW"}
                </div>
                {wasMailed ? (
                  <>
                    <div className="text-base font-bold text-foreground mb-2">Your letter is being printed and mailed</div>
                    <div className="border-2 border-[var(--accent-green)] bg-[rgba(0,255,65,0.04)] p-4 rounded mb-2">
                      <p className="text-sm text-foreground leading-relaxed mb-2">
                        We&apos;re handling everything — your letter will be printed and sent via <strong>USPS Certified Mail with Electronic Return Receipt</strong>.
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        <strong>Save your tracking number above.</strong> When the collector receives your letter, the tracking will update to &quot;Delivered.&quot; That&apos;s your proof. If they keep calling after that, continued calls may violate federal law and can support <span className="text-accent font-bold">up to $1,000 in statutory damages per case</span>.
                      </p>
                    </div>
                    <div className="text-xs text-muted">
                      Letters are typically mailed within 1 business day and delivered within 3-7 business days.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-base font-bold text-foreground mb-2">Print and mail your letter via USPS Certified Mail</div>
                    <div className="border-2 border-[var(--accent-red)] bg-[rgba(255,0,0,0.06)] p-4 rounded mb-2">
                      <div className="font-mono text-xs text-accent-red tracking-wider font-bold mb-2">&#9888; CRITICAL — DO NOT SKIP THIS</div>
                      <p className="text-sm text-foreground leading-relaxed mb-2">
                        You <strong>must</strong> send this letter via <strong>USPS Certified Mail with Return Receipt Requested</strong>.
                        This is the only way to prove the collector received your letter.
                      </p>
                      <p className="text-sm text-foreground leading-relaxed mb-2">
                        <strong>Save the receipt with the tracking number.</strong> This is your proof.
                        If they keep calling after receiving your letter, that tracking receipt helps prove FDCPA violations and can support up to $1,000 in statutory damages per case. Without it, you have no paper trail.
                      </p>
                      <p className="text-sm text-accent font-mono font-bold">
                        No tracking receipt = no proof = no case. Keep it safe.
                      </p>
                    </div>
                    <div className="text-xs text-muted">
                      Cost: ~$4-5 at any USPS post office. Ask for &quot;Certified Mail with Return Receipt.&quot;
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 mb-6 relative">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--accent-green)] flex-shrink-0 z-10 bg-[var(--background)]" />
              <div className="flex-1">
                <div className="font-mono text-[10px] text-accent tracking-widest mb-1">WITHIN 5 DAYS</div>
                <div className="text-base font-bold text-foreground mb-1">All collection calls must stop</div>
                <p className="text-sm text-muted leading-relaxed">
                  Once they receive your letter, they are legally required to stop calling you.
                  Continued calls after that may violate federal law and can support <span className="text-accent font-bold">up to $1,000 in statutory damages per case</span>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 mb-6 relative">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--border-color)] flex-shrink-0 z-10 bg-[var(--background)]" />
              <div className="flex-1">
                <div className="font-mono text-[10px] text-muted tracking-widest mb-1">30 DAYS</div>
                <div className="text-base font-bold text-foreground mb-1">Collector must respond with proof</div>
                <p className="text-sm text-muted leading-relaxed">
                  They have 30 days to send you documentation proving the debt is valid.
                  If they can&apos;t prove it, they must stop all collection activity and remove it from your credit report.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 relative">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--border-color)] flex-shrink-0 z-10 bg-[var(--background)]" />
              <div className="flex-1">
                <div className="font-mono text-[10px] text-muted tracking-widest mb-1">AFTER 30 DAYS</div>
                <div className="text-base font-bold text-foreground mb-1">Check your results</div>
                <p className="text-sm text-muted leading-relaxed">
                  If they didn&apos;t respond, the debt is effectively dead. If they keep contacting you,
                  you may have grounds for a lawsuit &mdash; contact a consumer protection attorney (most take these cases for free on contingency).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-muted text-xs p-3 border border-border mb-8 text-left">
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
