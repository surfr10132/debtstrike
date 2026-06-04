import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { getAnthropic } from '@/lib/claude';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/claude-prompts';
import { ExtractedDebtData } from '@/lib/types';
import { stageUploadedDocumentForDropbox } from '@/lib/client-record-sync';

export const maxDuration = 60;

type SupportedUploadMediaType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

type LocalExtractionCandidate = {
  data: ExtractedDebtData;
  confidence: number;
  rawText: string;
};

const LOCAL_CONFIDENCE_SHORT_CIRCUIT = 0.78;
const LOCAL_CONFIDENCE_FALLBACK = 0.38;
const PDF_TEXT_HINT_MAX_CHARS = 14000;

function isCollectorTypeConfidence(
  value: unknown
): value is ExtractedDebtData['collectorTypeConfidence'] {
  return value === 'high' || value === 'medium' || value === 'low';
}

function sanitizeUploadedFileName(fileName: string) {
  return fileName
    .replace(/[<>:\"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return fileName.slice(dotIndex + 1).toLowerCase();
}

function normalizeUploadedMediaType(file: File): SupportedUploadMediaType | null {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'application/pdf';
  }
  if (
    mimeType === 'image/jpeg' ||
    mimeType === 'image/jpg' ||
    extension === 'jpg' ||
    extension === 'jpeg'
  ) {
    return 'image/jpeg';
  }
  if (mimeType === 'image/png' || extension === 'png') {
    return 'image/png';
  }
  if (mimeType === 'image/gif' || extension === 'gif') {
    return 'image/gif';
  }
  if (mimeType === 'image/webp' || extension === 'webp') {
    return 'image/webp';
  }

  return null;
}

function extractAndParseJSON(text: string): Record<string, unknown> {
  let cleanText = text.trim();

  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(cleanText);
  } catch {
    // Fall through to object match
  }

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Could not extract valid JSON from model output.');
}

function validateAndNormalizeData(parsed: Record<string, unknown>): ExtractedDebtData {
  return {
    collectorName:
      typeof parsed.collectorName === 'string' ? parsed.collectorName.trim() : '',
    collectorAddress:
      typeof parsed.collectorAddress === 'string' ? parsed.collectorAddress.trim() : '',
    accountNumber:
      typeof parsed.accountNumber === 'string' ? parsed.accountNumber.trim() : '',
    amountClaimed:
      typeof parsed.amountClaimed === 'string' ? parsed.amountClaimed.trim() : 'Unknown',
    originalCreditor:
      typeof parsed.originalCreditor === 'string' ? parsed.originalCreditor.trim() : '',
    isThirdPartyCollector:
      typeof parsed.isThirdPartyCollector === 'boolean'
        ? parsed.isThirdPartyCollector
        : false,
    collectorTypeConfidence: isCollectorTypeConfidence(parsed.collectorTypeConfidence)
      ? parsed.collectorTypeConfidence
      : 'low',
    recipientName:
      typeof parsed.recipientName === 'string' ? parsed.recipientName.trim() : '',
    recipientStreetAddress:
      typeof parsed.recipientStreetAddress === 'string'
        ? parsed.recipientStreetAddress.trim()
        : '',
    recipientCity:
      typeof parsed.recipientCity === 'string' ? parsed.recipientCity.trim() : '',
    recipientState:
      typeof parsed.recipientState === 'string'
        ? parsed.recipientState.trim().toUpperCase()
        : '',
    recipientZip:
      typeof parsed.recipientZip === 'string' ? parsed.recipientZip.trim() : '',
    recipientPhone:
      typeof parsed.recipientPhone === 'string' ? parsed.recipientPhone.trim() : '',
  };
}

function sanitizeLine(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s:,\-–—]+|[\s:,\-–—]+$/g, '')
    .trim();
}

function normalizeExtractedText(rawText: string): string {
  return rawText
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toTitleCaseIfShouting(value: string): string {
  const letters = value.replace(/[^A-Za-z]/g, '');
  if (!letters || letters !== letters.toUpperCase()) {
    return value;
  }

  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\b([a-z])'([a-z])/g, (_, a, b) => `${a.toUpperCase()}'${b}`);
}

function extractFirstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return sanitizeLine(match[1]);
    }
  }
  return '';
}

function normalizeComparable(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function formatCurrency(value: string): string {
  const numericString = value.replace(/[^0-9.]/g, '');
  if (!numericString) return 'Unknown';

  const amount = Number(numericString);
  if (Number.isNaN(amount)) {
    return value.startsWith('$') ? value : `$${value}`;
  }

  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isLikelyCollectorName(value: string): boolean {
  const normalized = value.toLowerCase();
  if (!normalized || normalized.length < 3) return false;
  if (/\d{3,}/.test(normalized)) return false;

  return /(collection|collector|recovery|credit|agency|associates?|services?|solutions?|management|financial|capital|portfolio|midland|swift|receivables|bureau|payment)/i.test(
    normalized
  );
}

function parseCollectorNameFromText(lines: string[], text: string): string {
  const forwardedFrom = text.match(
    /Forwarded message[\s\S]{0,800}?From:\s*([^<\n]+)\s*</i
  );
  if (forwardedFrom?.[1]) {
    const candidate = sanitizeLine(forwardedFrom[1]);
    if (isLikelyCollectorName(candidate)) {
      return candidate;
    }
  }

  const fromMatches = Array.from(text.matchAll(/From:\s*([^<\n]+)\s*</gi));
  for (const match of fromMatches) {
    const candidate = sanitizeLine(match[1] || '');
    if (isLikelyCollectorName(candidate)) {
      return candidate;
    }
  }

  const explicit = extractFirstMatch(text, [
    /Collector(?: Name)?\s*[:\-]\s*([^\n]+)/i,
    /Agency\s*[:\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*([A-Z][A-Za-z0-9 .&',\-]{3,70}(?:LLC|Inc\.?|Corp\.?|Company|Solutions?|Collections?|Recovery|Agency|Services?))/m,
  ]);
  if (explicit) return explicit;

  for (const line of lines.slice(0, 60)) {
    if (isLikelyCollectorName(line)) {
      return line;
    }
  }

  return '';
}

function parseCollectorAddressFromText(text: string, collectorName: string): string {
  const footerPipe = text.match(
    /\|\s*([^|\n]+)\|\s*([A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)(?:\s+US)?/i
  );
  if (footerPipe?.[1] && footerPipe?.[2]) {
    return `${sanitizeLine(footerPipe[1])}, ${sanitizeLine(footerPipe[2])}`;
  }

  const inlineAddress = extractFirstMatch(text, [
    /(\d{1,6}\s+[A-Za-z0-9 .#,'\-]+,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
    /(P\.?\s*O\.?\s*Box\s+[A-Za-z0-9\- ]+,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
  ]);
  if (inlineAddress) return inlineAddress;

  if (collectorName) {
    const collectorAnchor = new RegExp(
      `${collectorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,180}?(\\d{1,6}\\s+[A-Za-z0-9 .#,'\\-]+(?:,\\s*[A-Za-z .'-]+,\\s*[A-Z]{2}\\s+\\d{5}(?:-\\d{4})?)?)`,
      'i'
    );
    const anchored = text.match(collectorAnchor);
    if (anchored?.[1]) {
      return sanitizeLine(anchored[1]);
    }
  }

  return '';
}

function parseAccountNumberFromText(text: string): string {
  const identifiers = new Set<string>();

  const idPattern =
    /\b(?:account|acct|order|reference|ref|membership)\s*(?:id|no\.?|number|#)?\s*[:#]?\s*([A-Z0-9\-]{4,})/gi;
  for (const match of text.matchAll(idPattern)) {
    const candidate = sanitizeLine(match[1] || '');
    if (candidate.length >= 4 && /[\dXx*]/.test(candidate)) {
      identifiers.add(candidate);
    }
  }

  if (identifiers.size === 0) {
    const fallbackMatch = text.match(/\b([0-9]{6,})\b/);
    if (fallbackMatch?.[1]) {
      identifiers.add(fallbackMatch[1]);
    }
  }

  return Array.from(identifiers).slice(0, 4).join('\n');
}

function parseAmountClaimedFromText(text: string): string {
  const rawAmount = extractFirstMatch(text, [
    /(?:balance(?:\s+due)?|amount(?:\s+due)?|total(?:\s+balance|\s+due)?|has a)\s*\$?\s*([0-9][0-9,]*(?:\.\d{2})?)/i,
    /(?:^|\n)\s*Balance\s+([0-9][0-9,]*(?:\.\d{2})?)/i,
  ]);

  if (!rawAmount) return 'Unknown';
  return formatCurrency(rawAmount);
}

function parseOriginalCreditorFromText(
  text: string,
  collectorName: string
): string {
  const candidate = extractFirstMatch(text, [
    /your\s+([A-Z0-9 &'.,\-\n]{3,120}?)\s+(?:membership|account)\s*#/i,
    /Original Creditor(?: Name)?\s*[:\-]\s*([^\n]+)/i,
    /Creditor(?: Name)?\s*[:\-]\s*([^\n]+)/i,
  ]);

  if (!candidate) return '';
  if (isLikelyCollectorName(candidate)) return '';
  if (
    collectorName &&
    normalizeComparable(candidate) === normalizeComparable(collectorName)
  ) {
    return '';
  }

  return candidate;
}

function parseRecipientNameFromText(text: string): string {
  const fromDear = extractFirstMatch(text, [
    /Dear,?\s*([A-Za-z][A-Za-z .'\-]{1,60})[,]/i,
  ]);
  if (fromDear) {
    return toTitleCaseIfShouting(fromDear);
  }

  const fromToLine = extractFirstMatch(text, [
    /To:\s*([^<\n]+)\s*</i,
    /To:\s*([^\n]+)/i,
  ]);
  if (fromToLine && !/@/.test(fromToLine)) {
    return toTitleCaseIfShouting(fromToLine);
  }

  return '';
}

function parseRecipientAddressFromText(text: string): Pick<
  ExtractedDebtData,
  'recipientStreetAddress' | 'recipientCity' | 'recipientState' | 'recipientZip'
> {
  const blockMatch = text.match(
    /(?:^|\n)\s*([A-Za-z][A-Za-z .'\-]{2,60})\s*\n\s*(\d{1,6}[^\n]+)\s*\n\s*([A-Za-z .'\-]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/m
  );
  if (!blockMatch) {
    return {
      recipientStreetAddress: '',
      recipientCity: '',
      recipientState: '',
      recipientZip: '',
    };
  }

  const nameCandidate = sanitizeLine(blockMatch[1] || '');
  if (isLikelyCollectorName(nameCandidate)) {
    return {
      recipientStreetAddress: '',
      recipientCity: '',
      recipientState: '',
      recipientZip: '',
    };
  }

  return {
    recipientStreetAddress: sanitizeLine(blockMatch[2] || ''),
    recipientCity: sanitizeLine(blockMatch[3] || ''),
    recipientState: sanitizeLine(blockMatch[4] || '').toUpperCase(),
    recipientZip: sanitizeLine(blockMatch[5] || ''),
  };
}

function parseRecipientPhoneFromText(text: string): string {
  const explicitPhone = extractFirstMatch(text, [
    /(?:your phone number(?: on file)?|phone number on file)\s*[:\-]?\s*(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/i,
  ]);
  return sanitizeLine(explicitPhone);
}

function inferCollectorType(
  text: string,
  collectorName: string,
  originalCreditor: string
): Pick<ExtractedDebtData, 'isThirdPartyCollector' | 'collectorTypeConfidence'> {
  if (
    /this communication is from a debt collector|attempt to collect a debt/i.test(
      text
    )
  ) {
    return { isThirdPartyCollector: true, collectorTypeConfidence: 'high' };
  }

  if (
    collectorName &&
    originalCreditor &&
    normalizeComparable(collectorName) !== normalizeComparable(originalCreditor)
  ) {
    return { isThirdPartyCollector: true, collectorTypeConfidence: 'high' };
  }

  if (
    /credit reporting agencies|not yet been reviewed by an attorney|collection|balance/i.test(
      text
    ) &&
    isLikelyCollectorName(collectorName)
  ) {
    return { isThirdPartyCollector: true, collectorTypeConfidence: 'medium' };
  }

  if (isLikelyCollectorName(collectorName)) {
    return { isThirdPartyCollector: true, collectorTypeConfidence: 'medium' };
  }

  return { isThirdPartyCollector: false, collectorTypeConfidence: 'low' };
}

function calculateLocalConfidence(data: ExtractedDebtData): number {
  let score = 0;
  const maxScore = 9;

  if (data.collectorName) score += 2;
  if (data.collectorAddress) score += 1;
  if (data.accountNumber) score += 2;
  if (data.amountClaimed && data.amountClaimed !== 'Unknown') score += 1;
  if (data.originalCreditor) score += 1;
  if (data.recipientName) score += 1;
  if (data.recipientStreetAddress) score += 0.5;
  if (data.recipientCity && data.recipientState && data.recipientZip) score += 0.5;

  return score / maxScore;
}

function buildLocalCandidateFromText(rawText: string): LocalExtractionCandidate {
  const normalizedText = normalizeExtractedText(rawText);
  if (!normalizedText) {
    return {
      data: validateAndNormalizeData({}),
      confidence: 0,
      rawText: '',
    };
  }

  const lines = normalizedText
    .split('\n')
    .map(sanitizeLine)
    .filter(Boolean);

  const collectorName = parseCollectorNameFromText(lines, normalizedText);
  const collectorAddress = parseCollectorAddressFromText(normalizedText, collectorName);
  const accountNumber = parseAccountNumberFromText(normalizedText);
  const amountClaimed = parseAmountClaimedFromText(normalizedText);
  const originalCreditor = parseOriginalCreditorFromText(normalizedText, collectorName);
  const recipientName = parseRecipientNameFromText(normalizedText);
  const recipientAddress = parseRecipientAddressFromText(normalizedText);
  const recipientPhone = parseRecipientPhoneFromText(normalizedText);
  const collectorType = inferCollectorType(
    normalizedText,
    collectorName,
    originalCreditor
  );

  const data = validateAndNormalizeData({
    collectorName,
    collectorAddress,
    accountNumber,
    amountClaimed,
    originalCreditor,
    recipientName,
    recipientStreetAddress: recipientAddress.recipientStreetAddress,
    recipientCity: recipientAddress.recipientCity,
    recipientState: recipientAddress.recipientState,
    recipientZip: recipientAddress.recipientZip,
    recipientPhone,
    isThirdPartyCollector: collectorType.isThirdPartyCollector,
    collectorTypeConfidence: collectorType.collectorTypeConfidence,
  });

  return {
    data,
    confidence: calculateLocalConfidence(data),
    rawText: normalizedText,
  };
}

function hasUsableLocalCandidate(
  candidate: LocalExtractionCandidate | null
): candidate is LocalExtractionCandidate {
  if (!candidate) return false;
  if (candidate.confidence >= LOCAL_CONFIDENCE_FALLBACK) return true;
  return candidate.rawText.length >= 120;
}

function mergeModelAndLocalData(
  modelData: ExtractedDebtData,
  localCandidate: LocalExtractionCandidate | null
): ExtractedDebtData {
  if (!localCandidate) return modelData;

  const localData = localCandidate.data;
  const merged = { ...modelData };

  if (
    localData.collectorName &&
    (!merged.collectorName ||
      (!isLikelyCollectorName(merged.collectorName) &&
        isLikelyCollectorName(localData.collectorName)))
  ) {
    merged.collectorName = localData.collectorName;
  }

  if (!merged.collectorAddress && localData.collectorAddress) {
    merged.collectorAddress = localData.collectorAddress;
  }
  if (!merged.accountNumber && localData.accountNumber) {
    merged.accountNumber = localData.accountNumber;
  }
  if (
    (!merged.amountClaimed || merged.amountClaimed === 'Unknown') &&
    localData.amountClaimed &&
    localData.amountClaimed !== 'Unknown'
  ) {
    merged.amountClaimed = localData.amountClaimed;
  }
  if (
    localData.originalCreditor &&
    (!merged.originalCreditor ||
      normalizeComparable(merged.originalCreditor) ===
        normalizeComparable(merged.collectorName))
  ) {
    merged.originalCreditor = localData.originalCreditor;
  }
  if (!merged.recipientName && localData.recipientName) {
    merged.recipientName = localData.recipientName;
  }
  if (!merged.recipientStreetAddress && localData.recipientStreetAddress) {
    merged.recipientStreetAddress = localData.recipientStreetAddress;
  }
  if (!merged.recipientCity && localData.recipientCity) {
    merged.recipientCity = localData.recipientCity;
  }
  if (!merged.recipientState && localData.recipientState) {
    merged.recipientState = localData.recipientState;
  }
  if (!merged.recipientZip && localData.recipientZip) {
    merged.recipientZip = localData.recipientZip;
  }
  if (!merged.recipientPhone && localData.recipientPhone) {
    merged.recipientPhone = localData.recipientPhone;
  }
  if (
    merged.collectorTypeConfidence === 'low' &&
    localData.collectorTypeConfidence !== 'low'
  ) {
    merged.isThirdPartyCollector = localData.isThirdPartyCollector;
    merged.collectorTypeConfidence = localData.collectorTypeConfidence;
  }

  return merged;
}

async function maybeStageUploadedDocument(
  extractedData: ExtractedDebtData,
  uploadedFileBuffer?: Buffer,
  uploadedFileName?: string
) {
  if (!uploadedFileBuffer) return;

  extractedData.uploadedDocumentFileName = uploadedFileName || 'uploaded-letter';
  const stagedFilePath = await stageUploadedDocumentForDropbox({
    fileName: uploadedFileName || 'uploaded-letter',
    fileContent: new Uint8Array(uploadedFileBuffer),
  });
  if (stagedFilePath) {
    extractedData.uploadedDocumentStagingPath = stagedFilePath;
  }
}

export async function POST(request: Request) {
  let localCandidate: LocalExtractionCandidate | null = null;
  let uploadedFileBuffer: Buffer | undefined;
  let uploadedFileName: string | undefined;

  try {
    const formData = await request.formData();
    const uploadType = formData.get('type') as string;
    let content: Parameters<
      ReturnType<typeof getAnthropic>['messages']['create']
    >[0]['messages'][0]['content'];

    if (uploadType === 'upload' || uploadType === 'pdf' || uploadType === 'image') {
      const fileEntry = formData.get('file');
      if (!(fileEntry instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const file = fileEntry;
      const mediaType = normalizeUploadedMediaType(file);
      if (!mediaType) {
        return NextResponse.json(
          { error: 'Please upload a PDF or image file (JPG, JPEG, PNG, WEBP, or GIF).' },
          { status: 400 }
        );
      }

      uploadedFileBuffer = Buffer.from(await file.arrayBuffer());
      uploadedFileName = sanitizeUploadedFileName(file.name || 'uploaded-letter');
      const base64 = uploadedFileBuffer.toString('base64');

      if (mediaType === 'application/pdf') {
        try {
          const parsedPdf = await pdfParse(uploadedFileBuffer);
          localCandidate = buildLocalCandidateFromText(parsedPdf.text || '');
        } catch (pdfError) {
          console.warn('Local PDF text extraction failed, continuing with model-only parse:', pdfError);
          localCandidate = buildLocalCandidateFromText('');
        }

        if (localCandidate.confidence >= LOCAL_CONFIDENCE_SHORT_CIRCUIT) {
          const extractedData = { ...localCandidate.data };
          await maybeStageUploadedDocument(
            extractedData,
            uploadedFileBuffer,
            uploadedFileName
          );
          return NextResponse.json(extractedData);
        }

        const pdfHint = localCandidate.rawText
          ? `\n\nPDF pre-read text (may be noisy):\n${localCandidate.rawText.slice(
              0,
              PDF_TEXT_HINT_MAX_CHARS
            )}`
          : '';

        content = [
          {
            type: 'document' as const,
            source: {
              type: 'base64' as const,
              media_type: 'application/pdf' as const,
              data: base64,
            },
          },
          {
            type: 'text' as const,
            text: `Extract debt collection information from this document. If the PDF contains an email thread or forwarded message, ignore forwarding headers and prioritize the embedded collector notice details (collector name, amount, account/order/reference identifiers, original creditor, and recipient in the notice).${pdfHint}`,
          },
        ];
      } else {
        content = [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text' as const,
            text: 'Extract the debt collection information from this letter image.',
          },
        ];
      }
    } else {
      const textValue = formData.get('text');
      if (typeof textValue !== 'string' || !textValue.trim()) {
        return NextResponse.json({ error: 'No text provided' }, { status: 400 });
      }

      localCandidate = buildLocalCandidateFromText(textValue);
      if (localCandidate.confidence >= LOCAL_CONFIDENCE_SHORT_CIRCUIT) {
        return NextResponse.json(localCandidate.data);
      }

      content = [
        {
          type: 'text' as const,
          text: `Extract debt collection information from this text:\n\n${textValue}`,
        },
      ];
    }

    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const responseText = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();

    let extractedData: ExtractedDebtData;
    try {
      const parsed = extractAndParseJSON(responseText);
      extractedData = validateAndNormalizeData(parsed);
      extractedData = mergeModelAndLocalData(extractedData, localCandidate);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      if (hasUsableLocalCandidate(localCandidate)) {
        extractedData = { ...localCandidate.data };
      } else {
        return NextResponse.json(
          { error: 'Failed to parse extracted data. Please try again.' },
          { status: 500 }
        );
      }
    }

    await maybeStageUploadedDocument(extractedData, uploadedFileBuffer, uploadedFileName);
    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Extraction error:', error);

    if (hasUsableLocalCandidate(localCandidate)) {
      const extractedData = { ...localCandidate.data };
      try {
        await maybeStageUploadedDocument(
          extractedData,
          uploadedFileBuffer,
          uploadedFileName
        );
      } catch (stageError) {
        console.warn('Could not stage uploaded file during fallback response:', stageError);
      }
      return NextResponse.json(extractedData);
    }

    return NextResponse.json(
      { error: 'Failed to extract data from the letter. Please try again.' },
      { status: 500 }
    );
  }
}
