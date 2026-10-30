"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CollectorResponseAnalysisResult } from "@/lib/types";

interface AnalyzeResponseApiResult {
  success: boolean;
  analysis: CollectorResponseAnalysisResult;
  artifactsFolder: string | null;
}

function UploadResponseContent() {
  const searchParams = useSearchParams();
  const queryPayloadId = searchParams.get("payload_id")?.trim() || "";

  const [manualPayloadId, setManualPayloadId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponseApiResult | null>(null);

  const payloadId = useMemo(
    () => queryPayloadId || manualPayloadId.trim(),
    [manualPayloadId, queryPayloadId]
  );

  async function handleSubmit() {
    if (!payloadId || !selectedFile) {
      setError("Please provide a payload ID and upload a response file.");
      return;
    }

    setError(null);
    setResult(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("payload_id", payloadId);
      formData.append("file", selectedFile);

      const response = await fetch("/api/analyze-response", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as
        | AnalyzeResponseApiResult
        | { error?: string };

      if (!response.ok) {
        throw new Error((body as { error?: string }).error || "Could not analyze this response.");
      }

      setResult(body as AnalyzeResponseApiResult);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Upload failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          href="/"
          className="font-mono text-accent font-bold text-xl tracking-widest"
        >
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-mono text-3xl font-bold mb-2">
          <span className="text-accent">UPLOAD</span>{" "}
          <span className="text-accent-red">COLLECTOR RESPONSE</span>
        </h1>
        <p className="text-muted text-sm mb-8">
          Upload the collector’s written response and we’ll run a free FDCPA
          compliance analysis, then generate a follow-up letter draft.
        </p>

        {!queryPayloadId && (
          <div className="mb-5">
            <label className="block font-mono text-xs text-accent mb-2 tracking-wider">
              PAYLOAD ID
            </label>
            <input
              type="text"
              value={manualPayloadId}
              onChange={(event) => setManualPayloadId(event.target.value)}
              placeholder="Paste your payload ID"
              className="input-tactical w-full p-3 text-sm"
            />
          </div>
        )}

        <div className="mb-5">
          <label className="block font-mono text-xs text-accent mb-2 tracking-wider">
            RESPONSE FILE
          </label>
          <input
            type="file"
            accept=".pdf,image/*,.txt"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] || null)
            }
            className="input-tactical w-full p-3 text-sm"
          />
          <p className="text-muted text-xs mt-2">
            Accepted: PDF, image, or text file.
          </p>
        </div>

        {error && (
          <div className="mb-5 border border-accent-red bg-accent-red/10 p-3 text-sm text-accent-red">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !payloadId || !selectedFile}
          className="btn-tactical w-full py-3 text-sm"
        >
          {isSubmitting ? "ANALYZING..." : "ANALYZE RESPONSE"}
        </button>

        {result && (
          <section className="mt-8 space-y-5">
            <div className="border border-border bg-surface p-4">
              <div className="font-mono text-xs text-accent tracking-wider mb-2">
                ANALYSIS SUMMARY
              </div>
              <p className="text-sm text-foreground mb-2">{result.analysis.summary}</p>
              <p className="text-xs text-muted">
                Determination:{" "}
                <span className="text-foreground">{result.analysis.determination}</span>{" "}
                · Confidence:{" "}
                <span className="text-foreground">{result.analysis.confidence}</span>
              </p>
            </div>

            <div className="border border-border bg-surface p-4">
              <div className="font-mono text-xs text-accent tracking-wider mb-3">
                FDCPA ISSUES FOUND
              </div>
              {result.analysis.fdcpaIssues.length === 0 ? (
                <p className="text-sm text-muted">No specific issue flags were identified.</p>
              ) : (
                <ul className="space-y-3">
                  {result.analysis.fdcpaIssues.map((issue, index) => (
                    <li key={`${issue.title}-${index}`} className="text-sm">
                      <div className="text-foreground font-semibold">
                        {index + 1}. {issue.title}
                      </div>
                      <div className="text-muted text-xs">
                        Severity: {issue.severity}
                        {issue.lawReference ? ` · ${issue.lawReference}` : ""}
                      </div>
                      <p className="text-foreground mt-1">{issue.explanation}</p>
                      {issue.evidence && (
                        <p className="text-muted mt-1 text-xs">
                          Evidence: {issue.evidence}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-border bg-surface p-4">
              <div className="font-mono text-xs text-accent tracking-wider mb-3">
                RECOMMENDED NEXT STEPS
              </div>
              {result.analysis.recommendedNextSteps.length === 0 ? (
                <p className="text-sm text-muted">
                  No additional steps were returned.
                </p>
              ) : (
                <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                  {result.analysis.recommendedNextSteps.map((step, index) => (
                    <li key={`${step}-${index}`}>{step}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-border bg-surface p-4">
              <div className="font-mono text-xs text-accent tracking-wider mb-3">
                FOLLOW-UP LETTER DRAFT
              </div>
              <pre className="whitespace-pre-wrap text-sm text-foreground">
                {result.analysis.responseLetter}
              </pre>
            </div>

            {result.artifactsFolder && (
              <div className="text-xs text-muted">
                Artifacts saved to Dropbox path:{" "}
                <span className="text-foreground">{result.artifactsFolder}</span>
              </div>
            )}
          </section>
        )}

        <div className="mt-8 text-xs text-muted">
          DebtStrike.io is not a law firm and does not provide legal advice.
        </div>
      </main>
    </div>
  );
}

export default function UploadResponsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
          <div className="spinner-tactical" />
        </div>
      }
    >
      <UploadResponseContent />
    </Suspense>
  );
}
