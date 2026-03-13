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

  // Step 1: Extract data from the uploaded letter
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
        if (!file) {
          setError("Please select a file to upload.");
          setIsLoading(false);
          return;
        }
        formData.append("file", file);
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Extraction failed");
      }

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

  // Step 3: Generate the letter
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Letter generation failed");
      }

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

  // Step 4: Create checkout and redirect to Stripe
  async function handlePayment() {
    setIsLoading(true);
    setError(null);
    setLoadingMessage("CONNECTING TO PAYMENT...");

    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionPayload: {
            extractedData,
            userInfo,
            generatedLetter,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Payment setup failed");
      }

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
    if (selected) {
      setFile(selected);
      setError(null);
    }
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
          DEBTSTRIKE<span className="text-accent-red">.IO</span>
        </Link>
      </nav>

      {/* Step Indicator */}
      <div className="px-6 py-6 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 flex items-center justify-center border text-xs font-mono font-bold ${
                    isCompleted
                      ? "bg-accent text-black border-accent"
                      : isActive
                        ? "border-accent text-accent"
                        : "border-border text-muted"
                  }`}
                >
                  {isCompleted ? "+" : stepNum}
                </div>
                <span
                  className={`hidden md:inline text-xs font-mono tracking-wider ${
                    isActive ? "text-accent" : "text-muted"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`hidden md:block w-12 h-px ml-2 ${
                    isCompleted ? "bg-accent" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 border border-accent-red bg-accent-red/10 text-accent-red text-sm font-mono">
            ERROR: {error}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="mb-6 p-6 border border-accent bg-surface flex items-center gap-4">
            <div className="spinner-tactical" />
            <span className="font-mono text-accent text-sm tracking-widest cursor-blink">
              {loadingMessage}
            </span>
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === 1 && !isLoading && (
          <div>
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 01:</span> UPLOAD THEIR LETTER
            </h2>
            <p className="text-muted text-sm mb-8">
              Provide the debt collection letter you received. We&apos;ll scan it and extract the details.
            </p>

            {/* Upload Type Tabs */}
            <div className="flex gap-0 mb-6">
              {(["text", "pdf", "image"] as UploadType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setUploadType(type);
                    setFile(null);
                    setPastedText("");
                    setError(null);
                  }}
                  className={`px-6 py-3 font-mono text-sm uppercase tracking-wider border ${
                    uploadType === type
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {type === "text" ? "PASTE TEXT" : type === "pdf" ? "UPLOAD PDF" : "UPLOAD IMAGE"}
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
                className="drop-zone p-12 text-center cursor-pointer"
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
                  <div>
                    <div className="font-mono text-accent text-sm mb-2">FILE LOADED</div>
                    <div className="text-foreground text-sm">{file.name}</div>
                    <div className="text-muted text-xs mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-mono text-muted text-sm mb-2">
                      {uploadType === "pdf"
                        ? "DROP PDF HERE OR CLICK TO SELECT"
                        : "DROP IMAGE HERE OR CLICK TO SELECT"}
                    </div>
                    <div className="text-muted text-xs">
                      {uploadType === "pdf" ? "Accepts .pdf files" : "Accepts .jpg, .png, .webp"}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={!canExtract}
              className="btn-tactical w-full py-4 mt-6 text-lg"
            >
              ANALYZE LETTER
            </button>
          </div>
        )}

        {/* STEP 2: Verify Extracted Data */}
        {step === 2 && !isLoading && extractedData && (
          <div>
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 02:</span> VERIFY INTEL
            </h2>
            <p className="text-muted text-sm mb-8">
              Review the information we extracted. Edit anything that looks wrong.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  COLLECTOR / CREDITOR NAME
                </label>
                <input
                  type="text"
                  value={extractedData.collectorName}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, collectorName: e.target.value })
                  }
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  COLLECTOR ADDRESS
                </label>
                <textarea
                  value={extractedData.collectorAddress}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, collectorAddress: e.target.value })
                  }
                  className="input-tactical w-full p-3 text-sm h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    ACCOUNT / REFERENCE #
                  </label>
                  <input
                    type="text"
                    value={extractedData.accountNumber}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, accountNumber: e.target.value })
                    }
                    className="input-tactical w-full p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    AMOUNT CLAIMED ($)
                  </label>
                  <input
                    type="text"
                    value={extractedData.amountClaimed}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, amountClaimed: e.target.value })
                    }
                    className="input-tactical w-full p-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  ORIGINAL CREDITOR (if different)
                </label>
                <input
                  type="text"
                  value={extractedData.originalCreditor}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, originalCreditor: e.target.value })
                  }
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-2 tracking-wider">
                  CREDITOR TYPE
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setExtractedData({ ...extractedData, isThirdPartyCollector: true })
                    }
                    className={`flex-1 p-3 border text-sm font-mono ${
                      extractedData.isThirdPartyCollector
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-muted"
                    }`}
                  >
                    THIRD-PARTY COLLECTOR
                  </button>
                  <button
                    onClick={() =>
                      setExtractedData({ ...extractedData, isThirdPartyCollector: false })
                    }
                    className={`flex-1 p-3 border text-sm font-mono ${
                      !extractedData.isThirdPartyCollector
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-muted"
                    }`}
                  >
                    ORIGINAL CREDITOR
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="btn-tactical px-6 py-3 text-sm opacity-60"
              >
                BACK
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-tactical flex-1 py-3 text-lg"
              >
                CONFIRM DATA
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: User Info */}
        {step === 3 && !isLoading && (
          <div>
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 03:</span> YOUR INFORMATION
            </h2>
            <p className="text-muted text-sm mb-8">
              This information will appear on your letter as the sender.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  FULL LEGAL NAME
                </label>
                <input
                  type="text"
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                  placeholder="John A. Smith"
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  STREET ADDRESS
                </label>
                <input
                  type="text"
                  value={userInfo.streetAddress}
                  onChange={(e) => setUserInfo({ ...userInfo, streetAddress: e.target.value })}
                  placeholder="123 Main Street, Apt 4B"
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    CITY
                  </label>
                  <input
                    type="text"
                    value={userInfo.city}
                    onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                    placeholder="Los Angeles"
                    className="input-tactical w-full p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    STATE
                  </label>
                  <select
                    value={userInfo.state}
                    onChange={(e) => setUserInfo({ ...userInfo, state: e.target.value })}
                    className="input-tactical w-full p-3 text-sm"
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    ZIP CODE
                  </label>
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
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  PHONE NUMBER
                </label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="input-tactical w-full p-3 text-sm"
                />
                <div className="mt-2 p-3 border border-accent/30 bg-accent/5 text-xs text-muted">
                  <span className="text-accent font-mono font-bold">WHY THIS MATTERS:</span>{" "}
                  Your letter invokes FDCPA &sect; 1692c(c), ordering them to stop calling you. Once they
                  receive it, every call to this number is a separate federal violation &mdash; <span className="text-accent">$1,000
                  in statutory damages per call</span>, plus actual damages and attorney&apos;s fees. Your phone
                  number on the letter creates the paper trail.
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="btn-tactical px-6 py-3 text-sm opacity-60"
              >
                BACK
              </button>
              <button
                onClick={handleGenerateLetter}
                disabled={!canSubmitUserInfo}
                className="btn-tactical flex-1 py-3 text-lg"
              >
                GENERATE LETTER
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview & Pay */}
        {step === 4 && !isLoading && generatedLetter && (
          <div>
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 04:</span> PREVIEW & PAY
            </h2>
            <p className="text-muted text-sm mb-8">
              Your letter has been generated. Preview it below, then pay to download.
            </p>

            {/* Letter Preview */}
            <div className="border border-border mb-6">
              <div className="bg-surface px-4 py-2 border-b border-border font-mono text-xs text-accent tracking-wider">
                LETTER PREVIEW
              </div>
              <div className="letter-preview whitespace-pre-wrap text-xs">
                {generatedLetter.letterText}
              </div>
            </div>

            {/* What you get */}
            <div className="border border-border p-4 mb-6 bg-surface">
              <div className="font-mono text-xs text-accent mb-3 tracking-wider">
                YOUR DOWNLOAD INCLUDES:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex gap-2">
                  <span className="text-accent">+</span>
                  <span>Word document (.docx) - print & sign by hand</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent">+</span>
                  <span>PDF document (.pdf) - with signature included</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="border border-accent p-6 mb-6 glow-green bg-surface text-center">
              <div className="font-mono text-3xl font-bold text-accent">$20.00</div>
              <div className="text-muted text-xs mt-1">Secure payment via Stripe</div>
            </div>

            {/* Disclaimer */}
            <div className="text-muted text-xs mb-6 p-3 border border-border">
              <strong>Disclaimer:</strong> DebtStrike.io is not a law firm and does not provide
              legal advice. This letter is based on your rights under the FDCPA and California
              RFDCPA. Consult an attorney for legal advice specific to your situation.
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="btn-tactical px-6 py-3 text-sm opacity-60"
              >
                BACK
              </button>
              <button
                onClick={handlePayment}
                className="btn-tactical flex-1 py-4 text-lg pulse-glow"
              >
                PAY $20 & DOWNLOAD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
