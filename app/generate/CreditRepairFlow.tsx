"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  CreditReportItem,
  CreditReportAnalysis,
  UserInfo,
  DisputeLetter,
} from "@/lib/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const STEPS = ["UPLOAD", "REVIEW ITEMS", "YOUR INFO", "DISPUTE LETTERS"];

export default function CreditRepairFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<CreditReportAnalysis | null>(null);
  const [selectedItems, setSelectedItems] = useState<CreditReportItem[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: "",
    streetAddress: "",
    city: "",
    state: "CA",
    zip: "",
    email: "",
    phone: "",
    ssnLast4: "",
    dob: "",
  });
  const [disputeLetters, setDisputeLetters] = useState<DisputeLetter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<"scanning" | "done" | null>(null);
  const [activeLetterTab, setActiveLetterTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1: Upload ──
  const handleFileUpload = async (uploadedFile: File) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!validTypes.includes(uploadedFile.type) && !uploadedFile.type.startsWith("image/")) {
      setError("Please upload a PDF or image file (PNG, JPG, or PDF).");
      return;
    }

    if (uploadedFile.size > 25 * 1024 * 1024) {
      setError("File must be under 25MB.");
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setIsLoading(true);
    setScanPhase("scanning");
    setLoadingMessage("Scanning credit report...");

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const response = await fetch("/api/analyze-credit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Server error" }));
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();

      setScanPhase("done");
      setLoadingMessage(`Found ${data.totalNegativeItems} negative items`);

      await new Promise((r) => setTimeout(r, 1500));

      setAnalysis(data);
      setSelectedItems(data.items);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze report");
      setScanPhase(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = selectedItems.every((i) => i.selected);
    setSelectedItems((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const handleGenerateLetters = async () => {
    const itemsToDispute = selectedItems.filter((i) => i.selected);
    if (itemsToDispute.length === 0) {
      setError("Please select at least one item to dispute");
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage("Generating dispute letters...");

    try {
      const response = await fetch("/api/generate-disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToDispute,
          userInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate letters");
      }

      setDisputeLetters(data.disputeLetters);
      setActiveLetterTab(0);
      setStep(4);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate letters"
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const selectedCount = selectedItems.filter((i) => i.selected).length;
  const bureausInvolved = [
    ...new Set(selectedItems.filter((i) => i.selected).map((i) => i.bureau)),
  ];

  return (
    <>
      {/* Progress Bar */}
      <div className="relative z-10 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 sm:gap-4 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 shrink-0 flex items-center justify-center font-mono text-xs border ${
                      step > i + 1
                        ? "bg-accent text-background border-accent"
                        : step === i + 1
                        ? "border-accent text-accent"
                        : "border-border text-muted"
                    }`}
                  >
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span
                    className={`font-mono text-xs tracking-wider hidden sm:block truncate ${
                      step === i + 1 ? "text-accent" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px ${
                      step > i + 1 ? "bg-accent" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ── STEP 1: Upload ── */}
        {step === 1 && (
          <div className="step-transition">
            <div className="text-center mb-8">
              <div className="font-mono text-accent text-xs tracking-widest mb-3">
                CREDIT REPAIR MODULE
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                Upload Your Credit Report
              </h1>
              <p className="text-muted text-base max-w-lg mx-auto">
                Upload a tri-merge credit report (PDF or screenshot). We&apos;ll
                scan it, find every negative item, and generate dispute letters
                to all three bureaus.
              </p>
            </div>

            {/* Upload Zone */}
            {!isLoading ? (
              <div
                className="drop-zone p-12 text-center cursor-pointer max-w-lg mx-auto"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("drag-over");
                }}
                onDragLeave={(e) =>
                  e.currentTarget.classList.remove("drag-over")
                }
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("drag-over");
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) handleFileUpload(droppedFile);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
                <div className="mb-4">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mx-auto text-accent"
                  >
                    <path
                      d="M12 2L2 7v6c0 5.5 4.2 10.6 10 12 5.8-1.4 10-6.5 10-12V7L12 2z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8v6m-3-3l3-3 3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="font-mono text-accent text-sm mb-2">
                  DROP CREDIT REPORT HERE
                </div>
                <div className="text-muted text-sm">
                  or click to browse — PDF or image
                </div>
              </div>
            ) : (
              <div className="max-w-lg mx-auto text-center py-12">
                <div className="extract-doc-outline mx-auto mb-6">
                  <div className="p-4 space-y-3">
                    <div className="extract-doc-line w-3/4" />
                    <div className="extract-doc-line w-full" />
                    <div className="extract-doc-line w-5/6" />
                    <div className="extract-doc-line w-2/3" />
                    <div className="extract-doc-line w-full" />
                    <div className="extract-doc-line w-4/5" />
                    <div className="extract-doc-line w-3/4" />
                    <div className="extract-doc-line w-full" />
                  </div>
                  {scanPhase === "scanning" && (
                    <div className="extract-scan-line" />
                  )}
                </div>
                <div className="font-mono text-accent text-sm mb-2">
                  {scanPhase === "done" ? "✓ SCAN COMPLETE" : "SCANNING REPORT"}
                </div>
                <div className="text-muted text-sm">{loadingMessage}</div>
                {scanPhase === "scanning" && (
                  <div className="spinner-tactical mx-auto mt-4" />
                )}
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 border border-accent-red/50 bg-accent-red/5 text-center max-w-lg mx-auto">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            {/* Back to choice + Info Cards */}
            <div className="mt-8 text-center">
              <button
                onClick={onBack}
                className="font-mono text-muted text-sm hover:text-foreground transition-colors"
              >
                &larr; Back to Menu
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
              <div className="border border-border p-4 bg-surface">
                <div className="font-mono text-accent text-xs mb-2">01</div>
                <div className="text-sm font-medium mb-1">Upload Report</div>
                <div className="text-muted text-xs">
                  PDF or screenshot from IdentityIQ, myFICO, or any tri-merge
                  report
                </div>
              </div>
              <div className="border border-border p-4 bg-surface">
                <div className="font-mono text-accent text-xs mb-2">02</div>
                <div className="text-sm font-medium mb-1">AI Analysis</div>
                <div className="text-muted text-xs">
                  We identify every negative item across all three bureaus
                </div>
              </div>
              <div className="border border-border p-4 bg-surface">
                <div className="font-mono text-accent text-xs mb-2">03</div>
                <div className="text-sm font-medium mb-1">Dispute Letters</div>
                <div className="text-muted text-xs">
                  Unique FCRA dispute letters generated for each bureau —
                  download or mail
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Review Items ── */}
        {step === 2 && analysis && (
          <div className="step-transition">
            <div className="text-center mb-8">
              <div className="font-mono text-accent text-xs tracking-widest mb-3">
                SCAN RESULTS
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {analysis.totalNegativeItems} Negative Items Found
              </h2>
              <p className="text-muted text-base">
                Select the items you want to dispute. We&apos;ll generate a
                separate letter for each bureau.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {(["TransUnion", "Experian", "Equifax"] as const).map(
                (bureau) => (
                  <div
                    key={bureau}
                    className="border border-border p-3 bg-surface text-center"
                  >
                    <div className="font-mono text-accent text-lg font-bold">
                      {analysis.bureauBreakdown[bureau]}
                    </div>
                    <div className="text-muted text-xs font-mono">{bureau}</div>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleSelectAll}
                className="font-mono text-accent text-xs hover:text-accent-dim transition-colors"
              >
                {selectedItems.every((i) => i.selected)
                  ? "DESELECT ALL"
                  : "SELECT ALL"}
              </button>
              <div className="font-mono text-muted text-xs">
                {selectedCount} of {selectedItems.length} selected
              </div>
            </div>

            <div className="space-y-2 mb-8 max-h-[500px] overflow-y-auto">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className={`border p-4 cursor-pointer transition-colors ${
                    item.selected
                      ? "border-accent/50 bg-accent/5"
                      : "border-border bg-surface opacity-60"
                  }`}
                  onClick={() => handleToggleItem(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 shrink-0 border mt-0.5 flex items-center justify-center text-xs ${
                        item.selected
                          ? "border-accent bg-accent text-background"
                          : "border-border"
                      }`}
                    >
                      {item.selected && "✓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">
                          {item.creditorName}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {item.accountNumber}
                        </span>
                        <span
                          className={`font-mono text-xs px-1.5 py-0.5 ${
                            item.bureau === "TransUnion"
                              ? "bg-blue-500/10 text-blue-400"
                              : item.bureau === "Experian"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {item.bureau}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted mb-1">
                        <span>{item.accountType}</span>
                        <span>&bull;</span>
                        <span className="text-accent-red">{item.status}</span>
                        <span>&bull;</span>
                        <span>{item.balance}</span>
                      </div>
                      <div className="text-xs text-muted/80">{item.reason}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 border border-accent-red/50 bg-accent-red/5">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setAnalysis(null);
                  setScanPhase(null);
                }}
                className="font-mono text-muted text-sm hover:text-foreground transition-colors"
              >
                &larr; Upload Different Report
              </button>
              <button
                onClick={() => {
                  if (selectedCount === 0) {
                    setError("Select at least one item to dispute");
                    return;
                  }
                  setError(null);
                  setStep(3);
                }}
                className="btn-tactical px-8 py-3"
              >
                Continue &mdash; {selectedCount} Items &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Your Info ── */}
        {step === 3 && (
          <div className="step-transition">
            <div className="text-center mb-8">
              <div className="font-mono text-accent text-xs tracking-widest mb-3">
                YOUR INFORMATION
              </div>
              <h2 className="text-2xl font-bold mb-3">
                Who&apos;s Sending the Disputes?
              </h2>
              <p className="text-muted text-base">
                This goes on each letter as the return address. Use the name
                exactly as it appears on your credit report.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="font-mono text-xs text-muted mb-1 block">
                  FULL NAME
                </label>
                <input
                  type="text"
                  className="input-tactical w-full px-4 py-3"
                  placeholder="John Doe"
                  value={userInfo.fullName}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, fullName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-mono text-xs text-muted mb-1 block">
                  STREET ADDRESS
                </label>
                <input
                  type="text"
                  className="input-tactical w-full px-4 py-3"
                  placeholder="123 Main St, Apt 4"
                  value={userInfo.streetAddress}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, streetAddress: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-3">
                  <label className="font-mono text-xs text-muted mb-1 block">
                    CITY
                  </label>
                  <input
                    type="text"
                    className="input-tactical w-full px-4 py-3"
                    placeholder="Los Angeles"
                    value={userInfo.city}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, city: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-1">
                  <label className="font-mono text-xs text-muted mb-1 block">
                    STATE
                  </label>
                  <select
                    className="input-tactical w-full px-2 py-3"
                    value={userInfo.state}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, state: e.target.value })
                    }
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-mono text-xs text-muted mb-1 block">
                    ZIP
                  </label>
                  <input
                    type="text"
                    className="input-tactical w-full px-4 py-3"
                    placeholder="90001"
                    maxLength={10}
                    value={userInfo.zip}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, zip: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-muted mb-1 block">
                  PHONE (OPTIONAL)
                </label>
                <input
                  type="tel"
                  className="input-tactical w-full px-4 py-3"
                  placeholder="(555) 123-4567"
                  value={userInfo.phone}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, phone: e.target.value })
                  }
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 border border-accent-red/50 bg-accent-red/5 max-w-md mx-auto">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 max-w-md mx-auto">
              <button
                onClick={() => setStep(2)}
                className="font-mono text-muted text-sm hover:text-foreground transition-colors"
              >
                &larr; Back
              </button>
              <button
                onClick={() => {
                  if (!userInfo.fullName.trim()) {
                    setError("Please enter your full name");
                    return;
                  }
                  if (!userInfo.streetAddress.trim()) {
                    setError("Please enter your street address");
                    return;
                  }
                  if (!userInfo.city.trim()) {
                    setError("Please enter your city");
                    return;
                  }
                  if (!userInfo.zip.trim()) {
                    setError("Please enter your ZIP code");
                    return;
                  }
                  setError(null);
                  handleGenerateLetters();
                }}
                disabled={isLoading}
                className="btn-tactical px-8 py-3"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner-tactical" />
                    {loadingMessage}
                  </span>
                ) : (
                  `Generate ${bureausInvolved.length} Dispute Letter${
                    bureausInvolved.length !== 1 ? "s" : ""
                  } →`
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Dispute Letters ── */}
        {step === 4 && disputeLetters.length > 0 && (
          <div className="step-transition">
            <div className="text-center mb-8">
              <div className="font-mono text-accent text-xs tracking-widest mb-3">
                {"✓"} DISPUTE LETTERS READY
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {disputeLetters.length} Letters Generated
              </h2>
              <p className="text-muted text-base">
                One letter per bureau. Each references the specific items on your
                report and cites the FCRA. Print and mail via Certified Mail.
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              {disputeLetters.map((letter, i) => (
                <button
                  key={letter.bureau}
                  onClick={() => setActiveLetterTab(i)}
                  className={`font-mono text-xs px-4 py-2 border transition-colors ${
                    activeLetterTab === i
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {letter.bureau} ({letter.itemsDisputed})
                </button>
              ))}
            </div>

            <div className="border border-border bg-white p-6 sm:p-10 mb-6 max-h-[70vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-black text-sm font-sans leading-relaxed">
                {disputeLetters[activeLetterTab].letterText}
              </pre>
            </div>

            <div className="border border-border p-6 bg-surface">
              <div className="font-mono text-accent text-xs tracking-widest mb-4">
                NEXT STEPS
              </div>
              <div className="space-y-3 text-sm text-muted">
                <div className="flex gap-2">
                  <span className="text-accent shrink-0">[1]</span>
                  <span>
                    Print each letter and sign it by hand
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent shrink-0">[2]</span>
                  <span>
                    Include a copy of your ID and a utility bill as proof of
                    identity
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent shrink-0">[3]</span>
                  <span>
                    Send each letter via{" "}
                    <strong className="text-foreground">
                      USPS Certified Mail with Return Receipt
                    </strong>{" "}
                    to the bureau address shown in the letter
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-accent shrink-0">[4]</span>
                  <span>
                    The bureau has{" "}
                    <strong className="text-foreground">30 days</strong> to
                    investigate and respond under FCRA &sect; 1681i
                  </span>
                </div>
              </div>

              <div className="mt-6 p-3 border border-accent/30 bg-accent/5 text-xs text-muted">
                <strong className="text-accent">IMPORTANT:</strong> Keep copies
                of everything — the letters, certified mail receipts, and any
                responses. If a bureau fails to investigate within 30 days, or
                fails to delete unverifiable items, you may have a claim under
                the FCRA.
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setAnalysis(null);
                  setSelectedItems([]);
                  setDisputeLetters([]);
                  setScanPhase(null);
                  setUserInfo({
                    fullName: "",
                    streetAddress: "",
                    city: "",
                    state: "CA",
                    zip: "",
                    email: "",
                    phone: "",
                    ssnLast4: "",
                    dob: "",
                  });
                }}
                className="font-mono text-muted text-sm hover:text-foreground transition-colors"
              >
                &larr; Start Over
              </button>
              <button
                onClick={onBack}
                className="btn-tactical px-6 py-3 text-sm"
              >
                Need a Debt Validation Letter Too? &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
