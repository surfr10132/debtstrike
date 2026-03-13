"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ExtractedDebtData, UserInfo, GeneratedLetter, UploadType } from "@/lib/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const STEPS = ["UPLOAD", "VERIFY", "YOUR INFO", "PREVIEW & PAY"];

const UploadCloudIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

export default function GeneratePage() {
  const [step, setStep] = useState(1);
  const [uploadType, setUploadType] = useState<UploadType>("text");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedDebtData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: "",
    streetAddress: "",
    city: "",
    state: "CA",
    zip: "",
    phone: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedLetter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExtract() {
    setIsLoading(true);
    setError(null);
    setLoadingMessage("SCANNING DOCUMENT...");
    try {
      const formData = new FormData();
      formData.append("type", uploadType);
      if (uploadType === "text") {
        formData.append("text", pastedText);
      } else {
        if (!file) { setError("Please select a file to upload."); setIsLoading(false); return; }
        formData.append("file", file);
      }
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Extraction failed"); }
      const data: ExtractedDebtData = await res.json();
      setExtractedData(data);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }

  async function handleGenerateLetter() {
    setIsLoading(true);
    setError(null);
    setLoadingMessage("GENERATING YOUR LETTER...");
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedData, userInfo }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Letter generation failed"); }
      const data: GeneratedLetter = await res.json();
      setGeneratedLetter(data);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }

  async function handlePayment() {
    setIsLoading(true);
    setError(null);
    setLoadingMessage("CONNECTING TO PAYMENT...");
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPayload: { extractedData, userInfo, generatedLetter } }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Payment setup failed"); }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
      setLoadingMessage("");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) { setFile(selected); setError(null); }
  }

  const canExtract =
    (uploadType === "text" && pastedText.trim().length > 20) ||
    ((uploadType === "pdf" || uploadType === "image") && file !== null);

  const canSubmitUserInfo =
    userInfo.fullName.trim() !== "" &&
    userInfo.streetAddress.trim() !== "" &&
    userInfo.city.trim() !== "" &&
    userInfo.state !== "" &&
    userInfo.zip.trim() !== "" &&
    userInfo.phone.trim() !== "";

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="font-mono text-accent font-bold text-xl tracking-widest">
          DEBT<span className="text-accent-red">STRIKE</span><span className="text-muted">.IO</span>
        </Link>
      </nav>

      {/* Step Indicator */}
      <div className="px-6 py-5 border-b border-border bg-surface/50">
        <div className="max-w-3xl mx-auto flex items-center">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-7 h-7 flex items-center justify-center border text-xs font-mono font-bold transition-all duration-200 ${
                      isCompleted
                        ? "bg-accent text-black border-accent"
                        : isActive
                          ? "border-accent text-accent bg-accent/10"
                          : "border-border text-muted"
                    }`}
                  >
                    {isCompleted ? "✓" : stepNum}
                  </div>
                  <span
                    className={`hidden md:inline text-xs font-mono tracking-wider transition-colors duration-200 ${
                      isActive ? "text-accent" : isCompleted ? "text-accent-dim" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3 transition-colors duration-300" style={{
                    background: isCompleted
                      ? 'var(--accent-green)'
                      : 'var(--border-color)'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 border border-accent-red/60 bg-accent-red/8 text-accent-red text-sm font-mono flex items-start gap-3">
            <span className="font-bold mt-0.5">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="mb-6 p-5 border border-accent/40 bg-surface flex items-center gap-4">
            <div className="spinner-tactical flex-shrink-0" />
            <span className="font-mono text-accent text-sm tracking-widest cursor-blink">
              {loadingMessage}
            </span>
          </div>
        )}

        {/* ── STEP 1: Upload ── */}
        {step === 1 && !isLoading && (
          <div>
            <div className="mb-8">
              <h2 className="font-mono text-2xl font-bold mb-2">
                <span className="text-accent">PHASE 01:</span> UPLOAD THEIR LETTER
              </h2>
              <p className="text-muted text-sm">
                Provide the debt collection letter you received. We&apos;ll scan it and extract the details.
              </p>
            </div>

            {/* Upload Type Tabs */}
            <div className="flex mb-6 border border-border overflow-hidden">
              {(["text", "pdf", "image"] as UploadType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => { setUploadType(type); setFile(null); setPastedText(""); setError(null); }}
                  className={`flex-1 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all duration-150 ${
                    uploadType === type
                      ? "bg-accent/10 text-accent border-b-2 border-accent"
                      : "text-muted hover:text-foreground hover:bg-surface-light"
                  }`}
                >
                  {type === "text" ? "Paste Text" : type === "pdf" ? "Upload PDF" : "Upload Image"}
                </button>
              ))}
            </div>

            {/* Text Input */}
            {uploadType === "text" && (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the full text of the debt collection letter here..."
                className="input-tactical w-full h-64 p-4 text-sm resize-none"
              />
            )}

            {/* File Upload */}
            {(uploadType === "pdf" || uploadType === "image") && (
              <div
                className="drop-zone p-12 text-center cursor-pointer flex flex-col items-center gap-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={uploadType === "pdf" ? ".pdf" : "image/*"}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-mono text-accent text-xs tracking-wider">FILE LOADED</div>
                    <div className="text-foreground text-sm font-medium">{file.name}</div>
                    <div className="text-muted text-xs">{(file.size / 1024).toFixed(1)} KB</div>
                    <div className="mt-1 text-muted text-xs underline underline-offset-2">Click to change</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-muted opacity-50">
                      <UploadCloudIcon />
                    </div>
                    <div>
                      <div className="font-mono text-muted text-sm mb-1">
                        {uploadType === "pdf" ? "DROP PDF HERE OR CLICK TO SELECT" : "DROP IMAGE HERE OR CLICK TO SELECT"}
                      </div>
                      <div className="text-muted text-xs">
                        {uploadType === "pdf" ? "Accepts .pdf files up to 10MB" : "Accepts .jpg .png .webp up to 10MB"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={!canExtract}
              className="btn-tactical w-full py-4 mt-6 text-base"
            >
              Analyze Letter
            </button>
          </div>
        )}

        {/* ── STEP 2: Verify Extracted Data ── */}
        {step === 2 && !isLoading && extractedData && (
          <div>
            <div className="mb-8">
              <h2 className="font-mono text-2xl font-bold mb-2">
                <span className="text-accent">PHASE 02:</span> VERIFY INTEL
              </h2>
              <p className="text-muted text-sm">
                Review the information we extracted. Edit anything that looks wrong.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">COLLECTOR / CREDITOR NAME</label>
                <input
                  type="text"
                  value={extractedData.collectorName}
                  onChange={(e) => setExtractedData({ ...extractedData, collectorName: e.target.value })}
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">COLLECTOR ADDRESS</label>
                <textarea
                  value={extractedData.collectorAddress}
                  onChange={(e) => setExtractedData({ ...extractedData, collectorAddress: e.target.value })}
                  className="input-tactical w-full p-3 text-sm h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">ACCOUNT / REFERENCE #</label>
                  <input
                    type="text"
                    value={extractedData.accountNumber}
                    onChange={(e) => setExtractedData({ ...extractedData, accountNumber: e.target.value })}
                    className="input-tactical w-full p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">AMOUNT CLAIMED ($)</label>
                  <input
                    type="text"
                    value={extractedData.amountClaimed}
                    onChange={(e) => setExtractedData({ ...extractedData, amountClaimed: e.target.value })}
                    className="input-tactical w-full p-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">ORIGINAL CREDITOR (if different)</label>
                <input
                  type="text"
                  value={extractedData.originalCreditor}
                  onChange={(e) => setExtractedData({ ...extractedData, originalCreditor: e.target.value })}
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-2 tracking-wider">CREDITOR TYPE</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExtractedData({ ...extractedData, isThirdPartyCollector: true })}
                    className={`p-3 border text-xs font-mono transition-all duration-150 ${
                      extractedData.isThirdPartyCollector
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-muted hover:border-border/80"
                    }`}
                  >
                    Third-Party Collector
                  </button>
                  <button
                    onClick={() => setExtractedData({ ...extractedData, isThirdPartyCollector: false })}
                    className={`p-3 border text-xs font-mono transition-all duration-150 ${
                      !extractedData.isThirdPartyCollector
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-muted hover:border-border/80"
                    }`}
                  >
                    Original Creditor
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="btn-tactical px-6 py-3 text-sm opacity-50">BACK</button>
              <button onClick={() => setStep(3)} className="btn-tactical flex-1 py-3 text-base">Confirm Data →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: User Info ── */}
        {step === 3 && !isLoading && (
          <div>
            <div className="mb-8">
              <h2 className="font-mono text-2xl font-bold mb-2">
                <span className="text-accent">PHASE 03:</span> YOUR INFORMATION
              </h2>
              <p className="text-muted text-sm">
                This information will appear on your letter as the sender.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">FULL LEGAL NAME</label>
                <input
                  type="text"
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                  placeholder="John A. Smith"
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">STREET ADDRESS</label>
                <input
                  type="text"
                  value={userInfo.streetAddress}
                  onChange={(e) => setUserInfo({ ...userInfo, streetAddress: e.target.value })}
                  placeholder="123 Main Street, Apt 4B"
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">CITY</label>
                  <input
                    type="text"
                    value={userInfo.city}
                    onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                    placeholder="Los Angeles"
                    className="input-tactical w-full p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">STATE</label>
                  <select
                    value={userInfo.state}
                    onChange={(e) => setUserInfo({ ...userInfo, state: e.target.value })}
                    className="input-tactical w-full p-3 text-sm"
                  >
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">ZIP</label>
                  <input
                    type="text"
                    value={userInfo.zip}
                    onChange={(e) => setUserInfo({ ...userInfo, zip: e.target.value })}
                    placeholder="90001"
                    className="input-tactical w-full p-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1.5 tracking-wider">PHONE NUMBER</label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="input-tactical w-full p-3 text-sm"
                />
                <div className="mt-2 p-3 border border-accent/25 bg-accent/5 text-xs text-muted leading-relaxed">
                  <span className="text-accent font-mono font-bold">WHY THIS MATTERS: </span>
                  Your letter invokes FDCPA § 1692c(c). Once they receive it, every call to this number is a
                  separate federal violation —{" "}
                  <span className="text-accent font-medium">$1,000 in statutory damages per call</span>,
                  plus actual damages and attorney&apos;s fees.
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="btn-tactical px-6 py-3 text-sm opacity-50">BACK</button>
              <button
                onClick={handleGenerateLetter}
                disabled={!canSubmitUserInfo}
                className="btn-tactical flex-1 py-3 text-base"
              >
                Generate Letter →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Preview & Pay ── */}
        {step === 4 && !isLoading && generatedLetter && (
          <div>
            <div className="mb-8">
              <h2 className="font-mono text-2xl font-bold mb-2">
                <span className="text-accent">PHASE 04:</span> PREVIEW &amp; PAY
              </h2>
              <p className="text-muted text-sm">
                Your letter has been generated. Preview it below, then pay to download.
              </p>
            </div>

            {/* Letter Preview with fade */}
            <div className="border border-border mb-6">
              <div className="bg-surface px-4 py-2.5 border-b border-border font-mono text-xs text-accent tracking-wider flex items-center gap-2">
                <LockIcon />
                LETTER PREVIEW
              </div>
              <div className="letter-preview-wrapper">
                <div className="letter-preview whitespace-pre-wrap text-xs">
                  {generatedLetter.letterText}
                </div>
                <div className="letter-preview-fade">
                  <div className="lock-message">
                    <LockIcon />
                    Pay to unlock full letter &amp; download
                  </div>
                </div>
              </div>
            </div>

            {/* What you get */}
            <div className="border border-border p-4 mb-5 bg-surface">
              <div className="font-mono text-xs text-accent mb-3 tracking-wider">YOUR DOWNLOAD INCLUDES:</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-accent font-bold">+</span>
                  <span>Word (.docx) — print &amp; sign by hand</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent font-bold">+</span>
                  <span>PDF — signature-ready to send</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="border border-accent p-5 mb-5 glow-green bg-surface flex items-center justify-between">
              <div>
                <div className="font-mono text-3xl font-bold text-accent">$20.00</div>
                <div className="text-muted text-xs mt-0.5 font-mono">One-time · No subscription</div>
              </div>
              <div className="text-right text-xs text-muted font-mono">
                <div>Secure payment</div>
                <div className="text-accent">via Stripe</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-muted text-xs mb-6 p-3 border border-border leading-relaxed">
              <strong className="text-foreground">Disclaimer:</strong> DebtStrike.io is not a law firm
              and does not provide legal advice. This letter is based on your rights under the FDCPA and
              California RFDCPA. Consult an attorney for advice specific to your situation.
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="btn-tactical px-6 py-3 text-sm opacity-50">BACK</button>
              <button
                onClick={handlePayment}
                className="btn-tactical flex-1 py-4 text-base pulse-glow"
              >
                Pay $20 &amp; Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
