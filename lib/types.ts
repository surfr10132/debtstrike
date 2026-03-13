export type UploadType = "text" | "pdf" | "image";

export interface ExtractedDebtData {
  collectorName: string;
  collectorAddress: string;
  accountNumber: string;
  amountClaimed: string;
  originalCreditor: string;
  isThirdPartyCollector: boolean;
}

export interface UserInfo {
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
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
