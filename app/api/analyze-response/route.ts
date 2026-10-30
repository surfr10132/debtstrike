import { NextResponse } from "next/server";
import { getAnthropic } from "@/lib/claude";
import {
  buildCollectorResponseAnalysisSystemPrompt,
  buildCollectorResponseAnalysisUserPrompt,
} from "@/lib/collector-response-prompts";
import {
  CollectorResponseAnalysisResult,
  ExtractedDebtData,
  SessionPayload,
  UserInfo,
} from "@/lib/types";
import { getSession } from "@/lib/session-store";
import { findFulfillmentByPayloadId, saveFulfillment } from "@/lib/fulfillment-store";
import {
  getClientSheetRecordByPayloadId,
  insertCollectorResponseAnalysisRow,
  uploadCollectorResponseArtifacts,
} from "@/lib/client-record-sync";
import { sendCollectorResponseLawsuitAlertEmail } from "@/lib/emails";

function extractAndParseJSON(text: string): Record<string, unknown> {
  let cleanText = text.trim();
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(cleanText);
  } catch {
    // fallback below
  }

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Could not parse JSON response from model output.");
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toSeverity(value: unknown): "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function toConfidence(value: unknown): "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function toDetermination(value: unknown): "proper" | "partial" | "improper" {
  return value === "proper" || value === "partial" || value === "improper"
    ? value
    : "partial";
}

function normalizeCollectorResponseAnalysis(
  parsed: Record<string, unknown>
): CollectorResponseAnalysisResult {
  const determination = toDetermination(parsed.determination);
  const confidence = toConfidence(parsed.confidence);
  const fdcpaIssuesRaw = Array.isArray(parsed.fdcpaIssues) ? parsed.fdcpaIssues : [];
  const recommendedStepsRaw = Array.isArray(parsed.recommendedNextSteps)
    ? parsed.recommendedNextSteps
    : [];

  const fdcpaIssues = fdcpaIssuesRaw
    .map((issue) => {
      if (!issue || typeof issue !== "object") return null;
      const obj = issue as Record<string, unknown>;
      return {
        title: normalizeString(obj.title),
        severity: toSeverity(obj.severity),
        lawReference: normalizeString(obj.lawReference),
        evidence: normalizeString(obj.evidence),
        explanation: normalizeString(obj.explanation),
      };
    })
    .filter((issue): issue is NonNullable<typeof issue> => Boolean(issue && issue.title));

  const recommendedNextSteps = recommendedStepsRaw
    .map((step) => normalizeString(step))
    .filter(Boolean);

  const responseLetter = normalizeString(parsed.responseLetter);
  const summary = normalizeString(parsed.summary);
  const lawsuitReasoning = normalizeString(parsed.lawsuitReasoning);
  const groundsForLawsuit = Boolean(parsed.groundsForLawsuit);
  const isProperResponse =
    typeof parsed.isProperResponse === "boolean"
      ? parsed.isProperResponse
      : determination === "proper";

  return {
    determination,
    confidence,
    summary: summary || "Collector response analyzed.",
    isProperResponse,
    fdcpaIssues,
    recommendedNextSteps,
    groundsForLawsuit,
    lawsuitReasoning,
    responseLetter,
  };
}

function parseExtractedDataFromSheet(value: string): ExtractedDebtData {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(value || "{}") as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const confidence =
    parsed.collectorTypeConfidence === "high" ||
    parsed.collectorTypeConfidence === "medium" ||
    parsed.collectorTypeConfidence === "low"
      ? parsed.collectorTypeConfidence
      : "low";

  return {
    collectorName: normalizeString(parsed.collectorName),
    collectorAddress: normalizeString(parsed.collectorAddress),
    accountNumber: normalizeString(parsed.accountNumber),
    amountClaimed: normalizeString(parsed.amountClaimed),
    originalCreditor: normalizeString(parsed.originalCreditor),
    uploadedDocumentFileName: normalizeString(parsed.uploadedDocumentFileName) || undefined,
    uploadedDocumentStagingPath:
      normalizeString(parsed.uploadedDocumentStagingPath) || undefined,
    isThirdPartyCollector: Boolean(parsed.isThirdPartyCollector),
    collectorTypeConfidence: confidence,
    recipientName: normalizeString(parsed.recipientName),
    recipientStreetAddress: normalizeString(parsed.recipientStreetAddress),
    recipientCity: normalizeString(parsed.recipientCity),
    recipientState: normalizeString(parsed.recipientState),
    recipientZip: normalizeString(parsed.recipientZip),
    recipientPhone: normalizeString(parsed.recipientPhone),
  };
}

function buildSessionPayloadFromSheetRecord(record: {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  extractedDataJson: string;
  generatedLetterText: string;
}): SessionPayload {
  const userInfo: UserInfo = {
    fullName: record.fullName,
    streetAddress: record.streetAddress,
    city: record.city,
    state: record.state,
    zip: record.zip,
    email: record.email,
    phone: record.phone,
    ssnLast4: "",
    dob: "",
  };

  return {
    extractedData: parseExtractedDataFromSheet(record.extractedDataJson),
    userInfo,
    generatedLetter: {
      letterText: record.generatedLetterText || "",
      date: new Date().toISOString().slice(0, 10),
    },
  };
}

function buildIssueSummary(result: CollectorResponseAnalysisResult) {
  if (!result.fdcpaIssues.length) {
    return result.summary;
  }
  return result.fdcpaIssues
    .map((issue, index) => {
      const lawPart = issue.lawReference ? ` (${issue.lawReference})` : "";
      return `${index + 1}. ${issue.title}${lawPart}: ${issue.explanation}`;
    })
    .join(" | ");
}

function buildMockCollectorResponseAnalysis(
  payload: SessionPayload
): CollectorResponseAnalysisResult {
  return {
    determination: "improper",
    confidence: "high",
    summary:
      "Mock analysis mode is enabled. This synthetic result marks the collector response as improper for local workflow testing.",
    isProperResponse: false,
    fdcpaIssues: [
      {
        title: "Inadequate debt validation package",
        severity: "high",
        lawReference: "15 U.S.C. § 1692g(b)",
        evidence:
          "Synthetic test fixture does not include itemized statements, chain of title, or signed agreement.",
        explanation:
          "Collector claims of validation without supporting records are treated as insufficient in this local mock test.",
      },
      {
        title: "Cease-contact compliance risk",
        severity: "medium",
        lawReference: "15 U.S.C. § 1692c(c)",
        evidence:
          "Synthetic fixture does not confirm written cessation or limited-contact compliance.",
        explanation:
          "Any continued collection contacts after a proper cease request may create exposure.",
      },
    ],
    recommendedNextSteps: [
      "Send a follow-up dispute letter demanding full validation records.",
      "Preserve all collector communications and envelope metadata.",
      "Document any calls or collection attempts after your cease-contact demand.",
    ],
    groundsForLawsuit: true,
    lawsuitReasoning:
      "Mock mode intentionally flags potential lawsuit grounds so escalation and notification logic can be tested.",
    responseLetter: `${payload.userInfo.fullName}
${payload.userInfo.streetAddress}
${payload.userInfo.city}, ${payload.userInfo.state} ${payload.userInfo.zip}

RE: Account ${payload.extractedData.accountNumber || "Unknown"}

To ${payload.extractedData.collectorName},

I dispute your recent response as incomplete under 15 U.S.C. § 1692g(b). You have not provided competent validation documentation supporting this alleged debt.

Until you provide complete validation, you must cease collection activity and comply with 15 U.S.C. § 1692c(c).

Send all future correspondence in writing to the address above.

Sincerely,
${payload.userInfo.fullName}`,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payloadId = normalizeString(formData.get("payload_id"));
    const rawFile = formData.get("file");

    if (!payloadId) {
      return NextResponse.json({ error: "Missing payload_id." }, { status: 400 });
    }
    if (!(rawFile instanceof File)) {
      return NextResponse.json({ error: "Missing collector response file." }, { status: 400 });
    }
    const file = rawFile;

    let payload = await getSession(payloadId);
    const sheetRecord = await getClientSheetRecordByPayloadId(payloadId);
    if (!payload && sheetRecord) {
      payload = buildSessionPayloadFromSheetRecord(sheetRecord);
    }
    if (!payload) {
      return NextResponse.json(
        { error: "Could not find client case data for this payload." },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const useMockAnalysis = process.env.DEBTSTRIKE_PHASE2_MOCK_ANALYSIS === "true";
    let analysis: CollectorResponseAnalysisResult;

    if (useMockAnalysis) {
      analysis = buildMockCollectorResponseAnalysis(payload);
    } else {
      const base64 = buffer.toString("base64");
      const anthropic = getAnthropic();
      const content: Parameters<
        typeof anthropic.messages.create
      >[0]["messages"][0]["content"] = [];

      if (file.type === "application/pdf") {
        content.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        });
      } else if (file.type.startsWith("image/")) {
        const mediaType =
          file.type === "image/png" ||
          file.type === "image/gif" ||
          file.type === "image/webp"
            ? file.type
            : "image/jpeg";
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64,
          },
        });
      } else {
        const fileText = await file.text();
        content.push({
          type: "text",
          text: `Collector response text:\n\n${fileText}`,
        });
      }

      content.push({
        type: "text",
        text: buildCollectorResponseAnalysisUserPrompt({
          payload,
          collectorResponseFileName: file.name || "collector-response",
        }),
      });

      const message = await anthropic.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 6400,
        thinking: { type: "adaptive" },
        system: buildCollectorResponseAnalysisSystemPrompt(),
        messages: [{ role: "user", content }],
      });

      const responseText = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      const parsed = extractAndParseJSON(responseText);
      analysis = normalizeCollectorResponseAnalysis(parsed);
    }
    const issueSummary = buildIssueSummary(analysis);

    const responseFolderPath = await uploadCollectorResponseArtifacts({
      payloadId,
      clientFullName: payload.userInfo.fullName,
      baseDropboxFolderPath: sheetRecord?.dropboxFolderPath || undefined,
      uploadedResponse: {
        fileName: file.name || "collector-response-upload",
        fileContent: new Uint8Array(buffer),
      },
      analysisJson: JSON.stringify(analysis, null, 2),
      issueSummaryText: `${analysis.summary}\n\n${issueSummary}`,
      followupLetterText: analysis.responseLetter,
    });

    const analysisRowPayload: SessionPayload = {
      ...payload,
      generatedLetter: {
        letterText: analysis.responseLetter,
        date: new Date().toISOString().slice(0, 10),
      },
    };
    await insertCollectorResponseAnalysisRow({
      payload: analysisRowPayload,
      context: {
        payloadId,
        orderType: "collector_response_analysis",
        mailingStatus: analysis.isProperResponse ? "response_proper" : "response_improper",
        lastError: issueSummary,
        dropboxFolderPath: sheetRecord?.dropboxFolderPath || responseFolderPath,
      },
    });

    const fulfillment = await findFulfillmentByPayloadId(payloadId);
    if (fulfillment) {
      fulfillment.responseReceivedAt = new Date().toISOString();
      fulfillment.responseAnalysisSummary = analysis.summary;
      fulfillment.responseHasLawsuitGrounds = analysis.groundsForLawsuit;
      await saveFulfillment(fulfillment);
    }

    if (analysis.groundsForLawsuit) {
      await sendCollectorResponseLawsuitAlertEmail({
        payloadId,
        consumerName: payload.userInfo.fullName,
        consumerEmail: payload.userInfo.email,
        collectorName: payload.extractedData.collectorName,
        analysisSummary: analysis.summary,
        lawsuitReasoning: analysis.lawsuitReasoning,
        issueSummary,
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
      artifactsFolder: responseFolderPath || sheetRecord?.dropboxFolderPath || null,
    });
  } catch (error) {
    console.error("[analyze-response] Failed to analyze collector response:", error);
    return NextResponse.json(
      { error: "Failed to analyze collector response. Please try again." },
      { status: 500 }
    );
  }
}
