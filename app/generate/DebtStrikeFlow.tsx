"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ExtractedDebtData, UserInfo, GeneratedLetter, UploadType } from "@/lib/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const STEPS = ["UPLOAD", "VERIFY", "YOUR INFO", "PREVIEW & PAY"];

const SUGGESTED_CAPTIONS = [
  "I just used debtstrike.io to send a cease & desist letter to a debt collector. If you're getting harassed over a debt, check it out — takes 60 seconds. @debtstrikeusa #debtstrike #fdcpa",
  "Debt collectors kept calling me nonstop. I found debtstrike.io and now they have to prove the debt is real AND stop calling. Know your rights. @debtstrikeusa #debtstrike #fdcpa",
  "Just sent a debt validation letter through debtstrike.io. Collectors legally have to stop calling and prove the debt within 30 days. Wild that more people don't know about this. @debtstrikeusa #debtfree",
];

export default function DebtStrikeFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [uploadType, setUploadType] = useState<UploadType>("upload");
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
    ssnLast4: "",
    dob: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedLetter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [extractionPhase, setExtractionPhase] = useState<"scanning" | "revealing" | null>(null);
  const [revealedFields, setRevealedFields] = useState<string[]>([]);
  const [generationPhase, setGenerationPhase] = useState<"generating" | null>(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share flow state
  const [shareMode, setShareMode] = useState(false);
  const [shareScreenshot, setShareScreenshot] = useState<File | null>(null);
  const [shareUnlocked, setShareUnlocked] = useState(false);
  const [shareDownloadUrl, setShareDownloadUrl] = useState("");
  const [sharePlatform, setSharePlatform] = useState("");
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const [letterApproved, setLetterApproved] = useState(false);
  const shareInputRef = useRef<HTMLInputElement>(null);

  const revealExtractedFields = useCallback((data: ExtractedDebtData) => {
    const fieldKeys = [
      "collectorName",
      "accountNumber",
      "amountClaimed",
      "originalCreditor",
      "creditorType",
      "recipientName",
    ];
    setRevealedFields([]);
    setExtractionPhase("revealing");

    fieldKeys.forEach((key, idx) => {
      setTimeout(() => {
        setRevealedFields((prev) => [...prev, key]);
      }, (idx + 1) * 600);
    });

    setTimeout(() => {
      setExtractionPhase(null);
      setRevealedFields([]);
      setIsLoading(false);
      setLoadingMessage("");
      setStep(2);
    }, (fieldKeys.length + 1) * 600 + 400);
  }, []);

  async function handleExtract() {
    setIsLoading(true);
    setError(null);
    setExtractionPhase("scanning");
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
          setExtractionPhase(null);
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

      setUserInfo((prev) => ({
        fullName: data.recipientName || prev.fullName,
        streetAddress: data.recipientStreetAddress || prev.streetAddress,
        city: data.recipientCity || prev.city,
        state: data.recipientState || prev.state || "CA",
        zip: data.recipientZip || prev.zip,
        phone: data.recipientPhone || prev.phone,
        ssnLast4: prev.ssnLast4,
        dob: prev.dob,
      }));

      revealExtractedFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setExtractionPhase(null);
      setIsLoading(false);
      setLoadingMessage("");
    }
  }

  async function handleGenerateLetter() {
    setIsLoading(true);
    setError(null);
    setGenerationPhase("generating");
    setGenerationStep(0);
    setLoadingMessage("GENERATING YOUR LETTER...");

    const stepTimers = [
      setTimeout(() => setGenerationStep(1), 800),
      setTimeout(() => setGenerationStep(2), 2500),
      setTimeout(() => setGenerationStep(3), 4500),
      setTimeout(() => setGenerationStep(4), 6500),
    ];

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
      setGenerationStep(5);

      await new Promise((resolve) => setTimeout(resolve, 800));
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      stepTimers.forEach(clearTimeout);
      setIsLoading(false);
      setLoadingMessage("");
      setGenerationPhase(null);
      setGenerationStep(0);
    }
  }

  async function handlePayment(mailForMe = false) {
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
          mailForMe,
          shareUnlocked: shareUnlocked || undefined,
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

  async function handleShareUpload() {
    if (!shareScreenshot) {
      setError("Please upload a screenshot of your social media post.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage("VERIFYING YOUR POST...");

    try {
      const formData = new FormData();
      formData.append("screenshot", shareScreenshot);
      formData.append(
        "payload",
        JSON.stringify({
          extractedData,
          userInfo,
          generatedLetter,
        })
      );

      const res = await fetch("/api/share-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setShareUnlocked(true);
      setShareDownloadUrl(data.downloadUrl);
      setSharePlatform(data.platform || "social media");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (selected.size > maxSizeBytes) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB. Your file is ${(selected.size / 1024 / 1024).toFixed(1)}MB.`);
        return;
      }

      if (uploadType === "upload" && selected.type !== "application/pdf" && !selected.type.startsWith("image/")) {
        setError("Please upload a PDF or image file (JPG, PNG, WebP).");
        return;
      }

      setFile(selected);
      setError(null);

      if (selected.type.startsWith("image/")) {
        setUploadPreviewUrl(URL.createObjectURL(selected));
      } else {
        setUploadPreviewUrl(null);
      }
    }
  }

  function handleShareScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, WebP).");
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError("Image must be under 10MB.");
        return;
      }
      setShareScreenshot(selected);
      setError(null);
    }
  }

  function copyCaption(index: number) {
    navigator.clipboard.writeText(SUGGESTED_CAPTIONS[index]);
    setCopiedCaption(index);
    setTimeout(() => setCopiedCaption(null), 2000);
  }

  const canExtract =
    (uploadType === "text" && pastedText.trim().length > 20) ||
    (uploadType === "upload" && file !== null);

  const isValidPhone = /\d{10,}/.test(userInfo.phone.replace(/\D/g, ""));
  const isValidZip = /^\d{5}(-\d{4})?$/.test(userInfo.zip);
  const isValidSsn4 = /^\d{4}$/.test(userInfo.ssnLast4);
  const isValidDob = userInfo.dob.trim() !== "" && !isNaN(Date.parse(userInfo.dob));

  const canSubmitUserInfo =
    userInfo.fullName.trim() !== "" &&
    userInfo.streetAddress.trim() !== "" &&
    userInfo.city.trim() !== "" &&
    userInfo.state !== "" &&
    isValidZip &&
    isValidPhone &&
    isValidSsn4 &&
    isValidDob;

  return (
    <>
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

        {/* Loading: Extraction Scanner Animation */}
        {isLoading && extractionPhase !== null && (
          <div className="mb-6 border border-border bg-surface step-transition">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
              <div className="spinner-tactical" style={{ width: 16, height: 16 }} />
              <span className="font-mono text-accent text-xs tracking-widest font-bold">
                {extractionPhase === "scanning" ? "ANALYZING DOCUMENT" : "EXTRACTION COMPLETE"}
              </span>
            </div>

            <div className="flex" style={{ minHeight: 280 }}>
              <div className="flex-1 flex items-center justify-center border-r border-border p-6">
                <div className="extract-doc-outline" style={uploadPreviewUrl ? { background: 'transparent' } : undefined}>
                  {extractionPhase === "scanning" && <div className="extract-scan-line" />}
                  {uploadPreviewUrl ? (
                    <img
                      src={uploadPreviewUrl}
                      alt="Uploaded document"
                      className="w-full h-full object-cover rounded"
                      style={{ opacity: 0.85, filter: 'grayscale(30%)' }}
                    />
                  ) : pastedText ? (
                    <div className="p-3 w-full h-full overflow-hidden">
                      <div className="font-mono text-[6px] leading-[8px] text-border-color opacity-60 break-words whitespace-pre-wrap">
                        {pastedText.slice(0, 600)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex flex-col items-center gap-1.5 w-full">
                      {file?.type === "application/pdf" && (
                        <div className="mb-2 text-center">
                          <div className="font-mono text-accent text-[10px] tracking-widest opacity-50">PDF</div>
                          <div className="text-muted text-[8px] truncate max-w-[140px]">{file.name}</div>
                        </div>
                      )}
                      {[80, 55, 95, 90, 75, 50, 95, 90, 80, 95, 55, 90, 75, 95, 50].map((w, i) => (
                        <div key={i} className="extract-doc-line" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-[1.3] p-5 flex flex-col">
                <div className={`extract-feed-item ${revealedFields.includes("collectorName") ? "visible" : ""}`}>
                  <div className="font-mono text-accent text-[10px] tracking-widest mb-1">COLLECTOR</div>
                  <div className="flex items-center gap-2 text-sm">
                    {revealedFields.includes("collectorName") ? (
                      <>
                        <span className="extract-feed-typing">{extractedData?.collectorName || "—"}</span>
                        <span className="text-accent">&#10003;</span>
                      </>
                    ) : extractionPhase === "scanning" ? (
                      <span className="text-muted font-mono text-xs">Searching...</span>
                    ) : null}
                  </div>
                </div>

                <div className={`extract-feed-item ${revealedFields.includes("accountNumber") ? "visible" : ""}`}>
                  <div className="font-mono text-accent text-[10px] tracking-widest mb-1">ACCOUNT #</div>
                  <div className="flex items-center gap-2 text-sm">
                    {revealedFields.includes("accountNumber") ? (
                      <>
                        <span className="extract-feed-typing">{extractedData?.accountNumber || "—"}</span>
                        <span className="text-accent">&#10003;</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className={`extract-feed-item ${revealedFields.includes("amountClaimed") ? "visible" : ""}`}>
                  <div className="font-mono text-accent text-[10px] tracking-widest mb-1">AMOUNT CLAIMED</div>
                  <div className="flex items-center gap-2 text-sm">
                    {revealedFields.includes("amountClaimed") ? (
                      <>
                        <span className="extract-feed-typing">{extractedData?.amountClaimed || "—"}</span>
                        <span className="text-accent">&#10003;</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className={`extract-feed-item ${revealedFields.includes("originalCreditor") ? "visible" : ""}`}>
                  <div className="font-mono text-accent text-[10px] tracking-widest mb-1">ORIGINAL CREDITOR</div>
                  <div className="flex items-center gap-2 text-sm">
                    {revealedFields.includes("originalCreditor") ? (
                      <>
                        <span className="extract-feed-typing">{extractedData?.originalCreditor || "Same as collector"}</span>
                        <span className="text-accent">&#10003;</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className={`extract-feed-item ${revealedFields.includes("creditorType") ? "visible" : ""}`}>
                  <div className="font-mono text-accent text-[10px] tracking-widest mb-1">CREDITOR TYPE</div>
                  <div className="flex items-center gap-2 text-sm">
                    {revealedFields.includes("creditorType") ? (
                      <>
                        <span className="extract-feed-typing">
                          {extractedData?.isThirdPartyCollector ? "Third-party collector" : "Original creditor"}
                          {extractedData?.collectorTypeConfidence ? ` (${extractedData.collectorTypeConfidence} confidence)` : ""}
                        </span>
                        <span className="text-accent">&#10003;</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className={`extract-feed-item ${revealedFields.includes("recipientName") ? "visible" : ""}`}>
                  <div className="font-mono text-accent text-[10px] tracking-widest mb-1">RECIPIENT</div>
                  <div className="flex items-center gap-2 text-sm">
                    {revealedFields.includes("recipientName") ? (
                      <>
                        <span className="extract-feed-typing">
                          {[extractedData?.recipientName, extractedData?.recipientCity, extractedData?.recipientState].filter(Boolean).join(", ") || "Not found on letter"}
                        </span>
                        <span className="text-accent">&#10003;</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 border-t border-border">
              <span className="font-mono text-muted text-[11px] tracking-wider">EXTRACTION PROGRESS</span>
              <div className="flex-1 h-[3px] bg-border rounded-sm overflow-hidden">
                <div
                  className="h-full bg-accent rounded-sm transition-all duration-500 ease-out"
                  style={{ width: extractionPhase === "scanning" ? "30%" : `${Math.round((revealedFields.length / 6) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-accent text-[11px]">
                {extractionPhase === "scanning" ? "..." : `${Math.round((revealedFields.length / 6) * 100)}%`}
              </span>
            </div>
          </div>
        )}

        {/* Loading: Letter Generation Animation */}
        {isLoading && generationPhase !== null && (
          <div className="mb-6 border border-border bg-surface step-transition">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
              <div className="spinner-tactical" style={{ width: 16, height: 16 }} />
              <span className="font-mono text-accent text-xs tracking-widest font-bold">
                GENERATING YOUR LETTER
              </span>
            </div>
            <div className="p-5">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-sm transition-all duration-500 ${generationStep >= i ? 'bg-accent' : 'bg-border'}`}
                    style={generationStep >= i ? { boxShadow: '0 0 6px rgba(0,255,65,0.4)' } : {}} />
                ))}
              </div>

              <div className="space-y-0">
                {[
                  { step: 1, label: "Selecting voice and tone...", done: "Voice selected — writing as a real person, not a lawyer" },
                  { step: 2, label: "Drafting debt validation demand...", done: "Validation demand written — citing FDCPA § 1692g" },
                  { step: 3, label: "Adding cease & desist protections...", done: "Cease & desist added — phone, workplace, robocalls blocked" },
                  { step: 4, label: "Applying California RFDCPA protections...", done: "State protections applied — Cal. Civ. Code § 1788" },
                  { step: 5, label: "Finalizing letter...", done: "Letter complete — ready for review" },
                ].map(({ step: s, label, done }) => (
                  <div key={s} className={`extract-feed-item ${generationStep >= s ? 'visible' : ''}`}>
                    <div className="flex items-center gap-2 text-sm py-1">
                      {generationStep > s ? (
                        <>
                          <span className="text-accent flex-shrink-0">&#10003;</span>
                          <span className="text-accent text-xs">{done}</span>
                        </>
                      ) : generationStep === s ? (
                        <>
                          <div className="spinner-tactical flex-shrink-0" style={{ width: 12, height: 12 }} />
                          <span className="text-foreground text-xs">{label}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading: Other */}
        {isLoading && extractionPhase === null && generationPhase === null && (
          <div className="mb-6 p-6 border border-accent bg-surface flex items-center gap-4">
            <div className="spinner-tactical" />
            <span className="font-mono text-accent text-sm tracking-widest cursor-blink">
              {loadingMessage}
            </span>
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === 1 && !isLoading && (
          <div className="step-transition">
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 01:</span> TELL US WHO&apos;S COLLECTING
            </h2>
            <p className="text-muted text-base mb-8">
              Upload a collection letter if you have one, or manually enter the collector&apos;s details from your credit report.
            </p>

            <div className="flex gap-0 mb-6">
              {(["upload", "text"] as UploadType[]).map((type) => (
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
                  {type === "upload" ? "UPLOAD DOCUMENT" : "MANUAL ENTRY"}
                </button>
              ))}
            </div>

            {uploadType === "text" && (
              <div>
                <div className="flex gap-3 mb-4 p-4 border border-border bg-surface text-sm">
                  <div className="flex-1">
                    <div className="font-mono text-accent text-[10px] tracking-widest mb-1.5 font-bold">OPTION A: HAVE A LETTER?</div>
                    <div className="text-muted leading-relaxed">Paste the full text of the collection letter you received.</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div className="flex-1">
                    <div className="font-mono text-accent text-[10px] tracking-widest mb-1.5 font-bold">OPTION B: NO LETTER?</div>
                    <div className="text-muted leading-relaxed">Type the account info as it appears on your credit report: the creditor or collector name, account number, and their mailing address (found in the &ldquo;creditor contacts&rdquo; section of your report).</div>
                  </div>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={"Paste your collection letter here...\n\nOr type the details manually:\n\nCreditor/Collector name: \nAccount number(s): (list each on its own line if more than one)\nCreditor address: \nAmount owed (if known): "}
                  className="input-tactical w-full h-48 sm:h-64 p-4 text-sm resize-none"
                />
              </div>
            )}

            {uploadType === "upload" && (
              <div
                className="drop-zone p-6 sm:p-12 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload PDF or image of collection letter"
                />
                {file ? (
                  <div>
                    <div className="font-mono text-accent text-sm mb-2">FILE LOADED</div>
                    <div className="text-foreground text-sm">{file.name}</div>
                    <div className="text-muted text-xs mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                    <div className="text-muted text-xs mt-2">
                      (Click to replace)
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-mono text-muted text-sm mb-2">
                      DROP YOUR DOCUMENT HERE OR CLICK TO SELECT
                    </div>
                    <div className="text-muted text-xs">
                      Max 10MB &bull; PDF, JPG, PNG, or photo of the letter
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={!canExtract || isLoading}
              className="btn-tactical w-full py-4 mt-6 text-lg"
            >
              ANALYZE & EXTRACT
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={onBack}
                className="font-mono text-muted text-sm hover:text-foreground transition-colors"
              >
                &larr; Back to Menu
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Verify Extracted Data */}
        {step === 2 && !isLoading && extractedData && (
          <div className="step-transition">
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 02:</span> VERIFY INTEL
            </h2>
            <p className="text-muted text-base mb-4">
              Review the information below. Fill in anything that&apos;s missing and fix anything that looks wrong.
            </p>
            <div className="p-3 border border-accent/30 bg-accent/5 text-sm text-foreground/80 mb-8">
              <span className="text-accent font-mono font-bold">IMPORTANT:</span>{" "}
              The collector name and their mailing address are required to generate your letter.
              If we couldn&apos;t find them automatically, enter them manually. You can find the collector&apos;s
              address on the letter they sent you, or in the &ldquo;creditor contacts&rdquo; section of your credit report.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  COLLECTOR / CREDITOR NAME <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={extractedData.collectorName}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, collectorName: e.target.value })
                  }
                  placeholder="e.g. Midland Credit Management, IC System, Capital One"
                  className={`input-tactical w-full p-3 text-sm ${
                    !extractedData.collectorName.trim() ? "border-accent-red" : ""
                  }`}
                />
                {!extractedData.collectorName.trim() && (
                  <div className="text-accent-red text-xs mt-1">
                    Required — enter the name of the company contacting you about the debt
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  COLLECTOR MAILING ADDRESS <span className="text-accent-red">*</span>
                </label>
                <textarea
                  value={extractedData.collectorAddress}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, collectorAddress: e.target.value })
                  }
                  placeholder={"e.g.\n350 Camino de la Reina, Suite 100\nSan Diego, CA 92108"}
                  className={`input-tactical w-full p-3 text-sm h-24 resize-none ${
                    !extractedData.collectorAddress.trim() ? "border-accent-red" : ""
                  }`}
                />
                {!extractedData.collectorAddress.trim() && (
                  <div className="text-accent-red text-xs mt-1">
                    Required — check your collection letter or the creditor contacts section of your credit report
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  ACCOUNT / REFERENCE # (one per line if multiple)
                </label>
                <textarea
                  value={extractedData.accountNumber}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, accountNumber: e.target.value })
                  }
                  placeholder={"e.g.\n6274-8839-2201\n6274-8839-2202"}
                  className="input-tactical w-full p-3 text-sm h-20 resize-none"
                />
                <div className="text-muted text-xs mt-1">
                  Have multiple accounts with this same collector? Enter each account number on its own line. Your letter will reference all of them.
                </div>
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
                  placeholder="e.g. $3,247.56 (total across all accounts, or leave blank if unsure)"
                  className="input-tactical w-full p-3 text-sm"
                />
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
                  placeholder="e.g. if Midland is collecting, but the original card was with Capital One"
                  className="input-tactical w-full p-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-2 tracking-wider">
                  CREDITOR TYPE <span className="text-accent-red">*</span>
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
                <p className="mt-2 text-xs text-muted">
                  Not sure? If the company contacting you is different from who you originally had the account with, they&apos;re a third-party collector.
                </p>
                {extractedData.collectorTypeConfidence === "low" && (
                  <p className="mt-2 text-sm text-yellow-400 font-mono">
                    &#9888; We weren&apos;t sure about this one — please double-check.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="btn-tactical px-6 py-3 text-sm opacity-60"
              >
                BACK
              </button>
              <button
                onClick={() => {
                  if (!extractedData.collectorName.trim() || !extractedData.collectorAddress.trim()) {
                    setError("Please fill in the collector name and mailing address before continuing.");
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
                disabled={!extractedData.collectorName.trim() || !extractedData.collectorAddress.trim()}
                className="btn-tactical flex-1 py-3 text-lg"
              >
                CONFIRM DATA
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: User Info */}
        {step === 3 && !isLoading && (
          <div className="step-transition">
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 03:</span> YOUR INFORMATION
            </h2>
            <p className="text-muted text-base mb-8">
              This information will appear on your letter as the sender.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  FULL LEGAL NAME <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                  placeholder="John A. Smith"
                  className="input-tactical w-full p-3 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  STREET ADDRESS <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  value={userInfo.streetAddress}
                  onChange={(e) => setUserInfo({ ...userInfo, streetAddress: e.target.value })}
                  placeholder="123 Main Street, Apt 4B"
                  className="input-tactical w-full p-3 text-sm"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    CITY <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfo.city}
                    onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                    placeholder="Los Angeles"
                    className="input-tactical w-full p-3 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    STATE <span className="text-accent-red">*</span>
                  </label>
                  <select
                    value={userInfo.state}
                    onChange={(e) => setUserInfo({ ...userInfo, state: e.target.value })}
                    className="input-tactical w-full p-3 text-sm"
                    required
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
                    ZIP CODE <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfo.zip}
                    onChange={(e) => setUserInfo({ ...userInfo, zip: e.target.value })}
                    placeholder="90001 or 90001-1234"
                    className={`input-tactical w-full p-3 text-sm ${
                      userInfo.zip && !isValidZip ? "border-accent-red" : ""
                    }`}
                    required
                  />
                  {userInfo.zip && !isValidZip && (
                    <div className="text-accent-red text-xs mt-1">
                      ZIP code must be 5 digits or 5+4 format (e.g., 90001 or 90001-1234)
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                  PHONE NUMBER <span className="text-accent-red">*</span>
                </label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={`input-tactical w-full p-3 text-sm ${
                    userInfo.phone && !isValidPhone ? "border-accent-red" : ""
                  }`}
                  required
                />
                {userInfo.phone && !isValidPhone && (
                  <div className="text-accent-red text-xs mt-1">
                    Phone number must contain at least 10 digits
                  </div>
                )}
                <div className="mt-2 p-3 border border-accent/30 bg-accent/5 text-sm text-foreground/80">
                  <span className="text-accent font-mono font-bold">WHY THIS MATTERS:</span>{" "}
                  Your letter invokes FDCPA &sect; 1692c(c), ordering them to stop calling you. Once they
                  receive it, every call to this number is a separate federal violation &mdash; <span className="text-accent">$1,000
                  in statutory damages per call</span>, plus actual damages and attorney&apos;s fees. Your phone
                  number on the letter creates the paper trail.
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    LAST 4 OF SSN <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={userInfo.ssnLast4}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setUserInfo({ ...userInfo, ssnLast4: val });
                    }}
                    placeholder="1234"
                    className={`input-tactical w-full p-3 text-sm ${
                      userInfo.ssnLast4 && !isValidSsn4 ? "border-accent-red" : ""
                    }`}
                    required
                  />
                  {userInfo.ssnLast4 && !isValidSsn4 && (
                    <div className="text-accent-red text-xs mt-1">
                      Enter exactly 4 digits
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-mono text-xs text-accent mb-1 tracking-wider">
                    DATE OF BIRTH <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={userInfo.dob}
                    onChange={(e) => setUserInfo({ ...userInfo, dob: e.target.value })}
                    className={`input-tactical w-full p-3 text-sm ${
                      userInfo.dob && !isValidDob ? "border-accent-red" : ""
                    }`}
                    required
                  />
                </div>
              </div>
              <div className="p-3 border border-accent/30 bg-accent/5 text-sm text-foreground/80">
                <span className="text-accent font-mono font-bold">WHY WE NEED THIS:</span>{" "}
                Collectors use your SSN and date of birth to look up your accounts. Including the last 4 of your SSN
                and DOB in the subject line of your letter ensures they can identify you and pull <em>all</em> accounts
                associated with your name &mdash; not just the one they wrote to you about.
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                className="btn-tactical px-6 py-3 text-sm opacity-60"
              >
                BACK
              </button>
              <button
                onClick={handleGenerateLetter}
                disabled={!canSubmitUserInfo || isLoading}
                className="btn-tactical flex-1 py-3 text-lg"
              >
                GENERATE LETTER
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview & Pay */}
        {step === 4 && !isLoading && generatedLetter && !shareMode && !shareUnlocked && (
          <div className="step-transition">
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">PHASE 04:</span> PREVIEW & PAY
            </h2>
            <p className="text-muted text-base mb-8">
              Your letter has been generated. Preview it below, then pay to download.
            </p>

            <div className="border border-border mb-6">
              <div className="bg-surface px-4 py-2 border-b border-border font-mono text-xs text-accent tracking-wider">
                LETTER PREVIEW
              </div>
              <div
                className="letter-preview whitespace-pre-wrap text-xs overflow-hidden p-4 bg-background relative letter-no-copy"
                style={{ maxHeight: '180px' }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="letter-watermark">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="letter-watermark-text">DEBTSTRIKE.IO — PREVIEW ONLY</div>
                  ))}
                </div>
                {generatedLetter.letterText.slice(0, Math.floor(generatedLetter.letterText.length * 0.25))}
                <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--background) 75%)' }}
                />
                <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                  <span className="font-mono text-[10px] text-muted tracking-widest">
                    PAY TO VIEW FULL LETTER
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-border mb-6 bg-surface">
              <div className="bg-surface px-4 py-2 border-b border-border font-mono text-xs text-accent tracking-wider">
                LETTER STRENGTH
              </div>
              <div className="p-4">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-sm bg-accent" style={{ boxShadow: '0 0 6px rgba(0,255,65,0.4)' }} />
                  ))}
                </div>
                <div className="font-mono text-accent text-xs tracking-wider font-bold mb-4">
                  {extractedData?.isThirdPartyCollector ? "5" : "4"} FEDERAL & STATE PROTECTIONS CITED
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2.5 border border-border bg-background text-sm">
                    <span className="text-accent flex-shrink-0 mt-0.5">&#9632;</span>
                    <div>
                      <div className="text-foreground font-medium">Debt validation demand</div>
                      <div className="text-muted text-xs">FDCPA &sect; 1692g &mdash; forces them to prove the debt is real</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 border border-border bg-background text-sm">
                    <span className="text-accent flex-shrink-0 mt-0.5">&#9632;</span>
                    <div>
                      <div className="text-foreground font-medium">Cease &amp; desist on phone calls</div>
                      <div className="text-muted text-xs">FDCPA &sect; 1692c &mdash; $1,000 per call after receipt</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 border border-border bg-background text-sm">
                    <span className="text-accent flex-shrink-0 mt-0.5">&#9632;</span>
                    <div>
                      <div className="text-foreground font-medium">No workplace contact</div>
                      <div className="text-muted text-xs">FDCPA &sect; 1692c(a)(3) &mdash; blocks calls to your employer</div>
                    </div>
                  </div>
                  {extractedData?.isThirdPartyCollector && (
                    <div className="flex items-start gap-3 p-2.5 border border-border bg-background text-sm">
                      <span className="text-accent flex-shrink-0 mt-0.5">&#9632;</span>
                      <div>
                        <div className="text-foreground font-medium">Credit reporting dispute</div>
                        <div className="text-muted text-xs">FDCPA &sect; 1692e(8) &mdash; must mark as disputed on your report</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-2.5 border border-border bg-background text-sm">
                    <span className="text-accent flex-shrink-0 mt-0.5">&#9632;</span>
                    <div>
                      <div className="text-foreground font-medium">California RFDCPA protection</div>
                      <div className="text-muted text-xs">Cal. Civ. Code &sect; 1788 &mdash; state-level enforcement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border p-4 mb-6 bg-surface">
              <div className="font-mono text-xs text-accent mb-3 tracking-wider">
                YOUR DOWNLOAD INCLUDES:
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex gap-2">
                  <span className="text-accent flex-shrink-0">+</span>
                  <span>Word document (.docx) - print &amp; sign by hand</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent flex-shrink-0">+</span>
                  <span>PDF document (.pdf) - with signature included</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 mb-6">
              <div className="border-2 border-accent p-6 glow-green bg-surface relative">
                <div className="absolute -top-3 left-4 bg-accent text-background font-mono text-[10px] font-bold tracking-widest px-3 py-0.5">
                  RECOMMENDED
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-left">
                    <div className="font-mono text-lg font-bold text-accent mb-1">WE MAIL IT FOR YOU</div>
                    <div className="text-sm text-foreground mb-1">
                      We print and send your letter via <strong>USPS Certified Mail with Return Receipt</strong>.
                    </div>
                    <div className="text-xs text-muted">
                      Tracking number provided instantly. No trip to the post office.
                    </div>
                  </div>
                  <div className="text-center md:text-right flex-shrink-0">
                    <div className="font-mono text-3xl font-bold text-accent">$30.99</div>
                    <div className="text-muted text-[10px] mb-2">Letter + Certified Mail</div>
                    <button
                      onClick={() => handlePayment(true)}
                      disabled={isLoading}
                      className="btn-tactical px-8 py-3 text-sm w-full md:w-auto"
                    >
                      PAY & MAIL
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-border p-5 bg-surface text-center hover:border-accent/50 transition-colors">
                  <div className="font-mono text-sm text-muted tracking-wider mb-2">DOWNLOAD ONLY</div>
                  <div className="font-mono text-2xl font-bold text-accent mb-1">$20.00</div>
                  <div className="text-muted text-xs mb-3">Download .docx + .pdf — mail it yourself</div>
                  <button
                    onClick={() => handlePayment(false)}
                    disabled={isLoading}
                    className="btn-tactical w-full py-2.5 text-xs"
                  >
                    PAY & DOWNLOAD
                  </button>
                </div>

                <div className="border border-border p-5 bg-surface text-center hover:border-accent/50 transition-colors">
                  <div className="font-mono text-sm text-muted tracking-wider mb-2">SOCIAL SHARE</div>
                  <div className="font-mono text-2xl font-bold text-accent mb-1">FREE</div>
                  <div className="text-muted text-xs mb-3">Share on social media to unlock</div>
                  <button
                    onClick={() => {
                      setShareMode(true);
                      setError(null);
                    }}
                    className="btn-tactical w-full py-2.5 text-xs"
                  >
                    SHARE & UNLOCK
                  </button>
                </div>
              </div>
            </div>

            <div className="text-muted text-xs mb-6 p-3 border border-border">
              <strong>Disclaimer:</strong> DebtStrike.io is not a law firm and does not provide
              legal advice. This letter is based on your rights under the FDCPA and California
              RFDCPA. Consult an attorney for legal advice specific to your situation.
            </div>

            <button
              onClick={() => {
                setError(null);
                setStep(3);
              }}
              className="btn-tactical px-6 py-3 text-sm opacity-60"
            >
              BACK
            </button>
          </div>
        )}

        {/* SHARE FLOW: Post & Upload Screenshot */}
        {step === 4 && !isLoading && shareMode && !shareUnlocked && (
          <div className="step-transition">
            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">SHARE</span> FOR FREE
            </h2>
            <p className="text-muted text-base mb-8">
              Post about DebtStrike on Instagram or TikTok, then upload a screenshot of your post to unlock your letter for free.
            </p>

            <div className="border border-border p-5 mb-6 bg-surface">
              <div className="font-mono text-xs text-accent mb-4 tracking-wider">
                STEP 1: POST ON SOCIAL MEDIA
              </div>
              <p className="text-muted text-base mb-4">
                Copy one of these captions (or write your own) and post it on Instagram, TikTok, Twitter, or Facebook. Make sure to tag <span className="text-accent font-mono">@debtstrikeusa</span>.
              </p>
              <div className="space-y-3">
                {SUGGESTED_CAPTIONS.map((caption, i) => (
                  <div key={i} className="border border-border p-3 bg-background">
                    <p className="text-foreground text-sm mb-2 leading-relaxed">{caption}</p>
                    <button
                      onClick={() => copyCaption(i)}
                      className="font-mono text-xs text-accent hover:text-accent-dim transition-colors"
                    >
                      {copiedCaption === i ? "COPIED!" : "COPY CAPTION"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border p-5 mb-6 bg-surface">
              <div className="font-mono text-xs text-accent mb-4 tracking-wider">
                STEP 2: UPLOAD SCREENSHOT OF YOUR POST
              </div>
              <p className="text-muted text-base mb-4">
                Take a screenshot of your published post and upload it here. Our AI will verify it mentions DebtStrike.
              </p>
              <div
                className="drop-zone p-6 text-center cursor-pointer"
                onClick={() => shareInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    shareInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={shareInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleShareScreenshotChange}
                  className="hidden"
                  aria-label="Upload screenshot of social media post"
                />
                {shareScreenshot ? (
                  <div>
                    <div className="font-mono text-accent text-sm mb-2">SCREENSHOT LOADED</div>
                    <div className="text-foreground text-sm">{shareScreenshot.name}</div>
                    <div className="text-muted text-xs mt-1">
                      {(shareScreenshot.size / 1024).toFixed(1)} KB
                    </div>
                    <div className="text-muted text-xs mt-2">(Click to replace)</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-mono text-muted text-sm mb-2">
                      DROP SCREENSHOT HERE OR CLICK TO SELECT
                    </div>
                    <div className="text-muted text-xs">Max 10MB &bull; JPG, PNG, WebP</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShareMode(false);
                  setShareScreenshot(null);
                  setError(null);
                }}
                className="btn-tactical px-6 py-3 text-sm opacity-60"
              >
                BACK
              </button>
              <button
                onClick={handleShareUpload}
                disabled={!shareScreenshot || isLoading}
                className="btn-tactical flex-1 py-4 text-lg pulse-glow"
              >
                VERIFY & UNLOCK
              </button>
            </div>
          </div>
        )}

        {/* SHARE UNLOCKED: Full Letter Review & Approve */}
        {shareUnlocked && !letterApproved && (
          <div className="step-transition">
            <div className="flex items-center gap-3 mb-6 p-4 border border-accent bg-accent/10">
              <span className="text-accent text-xl font-bold">&#10003;</span>
              <div>
                <div className="font-mono text-accent text-sm font-bold tracking-wider">POST VERIFIED</div>
                <div className="text-muted text-xs">Your {sharePlatform} post has been confirmed. Your letter is unlocked.</div>
              </div>
            </div>

            <h2 className="font-mono text-2xl font-bold mb-2">
              <span className="text-accent">REVIEW</span> YOUR LETTER
            </h2>
            <p className="text-muted text-base mb-6">
              Read through your letter below. Once you approve it, you can download it for free or have us mail it via USPS Certified Mail.
            </p>

            <div className="border border-border mb-6">
              <div className="bg-surface px-4 py-2 border-b border-border font-mono text-xs text-accent tracking-wider">
                YOUR LETTER — FULL TEXT
              </div>
              <div className="whitespace-pre-wrap text-sm p-5 bg-background leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                {generatedLetter?.letterText}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShareMode(false);
                  setShareUnlocked(false);
                  setShareScreenshot(null);
                  setError(null);
                }}
                className="btn-tactical px-6 py-3 text-sm opacity-60"
              >
                BACK
              </button>
              <button
                onClick={() => setLetterApproved(true)}
                className="btn-tactical flex-1 py-4 text-lg pulse-glow"
              >
                I APPROVE THIS LETTER
              </button>
            </div>
          </div>
        )}

        {/* SHARE APPROVED: Download Free + Mail Option */}
        {shareUnlocked && letterApproved && (
          <div className="step-transition text-center">
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
                <h2 className="font-mono text-3xl md:text-4xl font-bold mb-2">
                  <span className="text-accent">LETTER</span>{" "}
                  <span className="text-accent-red">APPROVED</span>
                </h2>
                <p className="text-muted text-sm mb-1">
                  Your letter is ready to go.
                </p>
              </div>
            </div>

            <div className="border border-border p-5 mb-6 bg-surface text-left">
              <div className="font-mono text-xs text-accent mb-3 tracking-wider text-center">
                FREE DOWNLOAD — THANKS FOR SHARING
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href={shareDownloadUrl.replace('/success?', '/api/download?format=docx&')}
                  className="btn-tactical p-4 text-center block"
                >
                  <div className="font-mono text-xl mb-1">DOCX</div>
                  <div className="text-xs text-muted normal-case tracking-normal font-normal">
                    Word doc &mdash; print &amp; sign
                  </div>
                </a>
                <a
                  href={shareDownloadUrl.replace('/success?', '/api/download?format=pdf&')}
                  className="btn-tactical p-4 text-center block"
                >
                  <div className="font-mono text-xl mb-1">PDF</div>
                  <div className="text-xs text-muted normal-case tracking-normal font-normal">
                    PDF with signature
                  </div>
                </a>
              </div>
            </div>

            <div className="border-2 border-accent p-6 glow-green bg-surface mb-8 text-left relative">
              <div className="absolute -top-3 left-4 bg-accent text-background font-mono text-[10px] font-bold tracking-widest px-3 py-0.5">
                RECOMMENDED
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-mono text-lg font-bold text-accent mb-1">WANT US TO MAIL IT FOR YOU?</div>
                  <div className="text-sm text-foreground mb-1">
                    We&apos;ll print and send your approved letter via <strong>USPS Certified Mail with Return Receipt</strong>.
                  </div>
                  <div className="text-xs text-muted">
                    Tracking number emailed to you instantly. No trip to the post office.
                  </div>
                </div>
                <div className="text-center md:text-right flex-shrink-0">
                  <div className="font-mono text-3xl font-bold text-accent">$10.99</div>
                  <div className="text-muted text-[10px] mb-2">Certified Mail + Tracking</div>
                  <button
                    onClick={() => handlePayment(true)}
                    disabled={isLoading}
                    className="btn-tactical px-8 py-3 text-sm w-full md:w-auto"
                  >
                    PAY & MAIL
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-border bg-surface text-left mb-8">
              <div className="px-5 py-3 border-b border-border font-mono text-xs text-accent tracking-wider font-bold">
                WHAT HAPPENS NEXT
              </div>
              <div className="p-5 relative">
                <div className="absolute left-[39px] top-5 bottom-5 w-0.5 bg-border" />

                <div className="flex gap-4 mb-6 relative">
                  <div className="w-5 h-5 rounded-full bg-accent flex-shrink-0 z-10 flex items-center justify-center">
                    <span className="text-background text-[10px] font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-accent tracking-widest mb-1">RIGHT NOW</div>
                    <div className="text-base font-bold text-foreground mb-2">Send your letter via USPS Certified Mail</div>
                    <div className="border-2 border-accent-red bg-accent-red/10 p-4 rounded mb-2">
                      <div className="font-mono text-xs text-accent-red tracking-wider font-bold mb-2">&#9888; CRITICAL — DO NOT SKIP THIS</div>
                      <p className="text-sm text-foreground leading-relaxed mb-2">
                        Your letter <strong>must</strong> be sent via <strong>USPS Certified Mail with Return Receipt Requested</strong>.
                        This is the only way to prove the collector received it.
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        <strong>Pay $10.99 above and we handle everything</strong> — or print the letter yourself and take it to any USPS post office (~$4-5). Either way, <strong>keep the tracking number</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mb-6 relative">
                  <div className="w-5 h-5 rounded-full border-2 border-accent flex-shrink-0 z-10 bg-background" />
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-accent tracking-widest mb-1">WITHIN 5 DAYS</div>
                    <div className="text-base font-bold text-foreground mb-1">All collection calls must stop</div>
                    <p className="text-sm text-muted leading-relaxed">
                      Once they receive your letter, they are legally required to stop calling you.
                      Every call after that is a separate FDCPA violation worth <span className="text-accent font-bold">$1,000 in statutory damages</span>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mb-6 relative">
                  <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 z-10 bg-background" />
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-muted tracking-widest mb-1">30 DAYS</div>
                    <div className="text-base font-bold text-foreground mb-1">Collector must respond with proof</div>
                    <p className="text-sm text-muted leading-relaxed">
                      They have 30 days to send you documentation proving the debt is valid.
                      If they can&apos;t prove it, they must stop all collection activity and remove it from your credit report.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 z-10 bg-background" />
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-muted tracking-widest mb-1">AFTER 30 DAYS</div>
                    <div className="text-base font-bold text-foreground mb-1">Check your results</div>
                    <p className="text-sm text-muted leading-relaxed">
                      If they didn&apos;t respond, the debt is effectively dead. If they keep contacting you,
                      you may have grounds for a lawsuit &mdash; contact a consumer protection attorney (most take these cases for free).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-muted text-xs mb-6 p-3 border border-border text-left">
              <strong>Disclaimer:</strong> DebtStrike.io is not a law firm and does not provide
              legal advice. This letter is based on your rights under the FDCPA and California
              RFDCPA. Consult an attorney for legal advice specific to your situation.
            </div>

            <Link href="/" className="btn-tactical px-8 py-3 text-sm opacity-60">
              RETURN TO BASE
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
