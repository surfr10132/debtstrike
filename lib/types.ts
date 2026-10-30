export type UploadType = "text" | "upload";

export interface ExtractedDebtData {
  collectorName: string;
  collectorAddress: string;
  accountNumber: string;
  amountClaimed: string;
  originalCreditor: string;
  uploadedDocumentStagingPath?: string;
  uploadedDocumentFileName?: string;
  isThirdPartyCollector: boolean;
  collectorTypeConfidence: "high" | "medium" | "low";
  recipientName: string;
  recipientStreetAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;
  recipientPhone: string;
}

export interface UserInfo {
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  ssnLast4: string;
  dob: string;
}

export interface GeneratedLetter {
  letterText: string;
  date: string;
}

export interface SessionPayload {
  extractedData: ExtractedDebtData;
  userInfo: UserInfo;
  generatedLetter: GeneratedLetter;
}

// ── Credit Repair Types ──

export interface CreditReportItem {
  id: string;
  bureau: "TransUnion" | "Experian" | "Equifax";
  creditorName: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  status: string;
  dateOpened: string;
  dateReported: string;
  reason: string; // why it's negative — late payment, collection, charge-off, etc.
  selected: boolean; // user can toggle which items to dispute
}

export interface CreditReportAnalysis {
  items: CreditReportItem[];
  totalNegativeItems: number;
  bureauBreakdown: {
    TransUnion: number;
    Experian: number;
    Equifax: number;
  };
}

export interface DisputeLetter {
  bureau: "TransUnion" | "Experian" | "Equifax";
  letterText: string;
  itemsDisputed: number;
}

export interface CreditRepairSession {
  userInfo: UserInfo;
  analysis: CreditReportAnalysis;
  disputeLetters: DisputeLetter[];
}

// ── Debt Collector Response Analysis (Phase 2) ──

export type CollectorResponseDetermination = "proper" | "partial" | "improper";
export type AnalysisConfidence = "high" | "medium" | "low";
export type AnalysisSeverity = "low" | "medium" | "high";

export interface FdcpaIssueFinding {
  title: string;
  severity: AnalysisSeverity;
  lawReference: string;
  evidence: string;
  explanation: string;
}

export interface CollectorResponseAnalysisResult {
  determination: CollectorResponseDetermination;
  confidence: AnalysisConfidence;
  summary: string;
  isProperResponse: boolean;
  fdcpaIssues: FdcpaIssueFinding[];
  recommendedNextSteps: string[];
  groundsForLawsuit: boolean;
  lawsuitReasoning: string;
  responseLetter: string;
}
