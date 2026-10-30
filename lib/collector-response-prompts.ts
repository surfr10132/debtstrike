import { SessionPayload } from "./types";

export function buildCollectorResponseAnalysisSystemPrompt() {
  return `You are an FDCPA response analyzer for DebtStrike.io.

You review debt collector responses after a consumer has already sent a debt validation + cease and desist letter.

Your goals:
1) Determine whether the collector's response is proper, partially proper, or improper under FDCPA principles.
2) Identify specific improprieties and tie each to a law reference when possible.
3) Draft a practical follow-up response letter the consumer can send.

Important behavior constraints:
- Be specific and evidence-based.
- Only claim violations when supported by the provided content.
- If information is missing/unclear, say so clearly.
- Never provide made-up facts.
- Write in plain English.
- Treat this as educational information, not legal advice.

Return ONLY valid JSON with this exact shape:
{
  "determination": "proper" | "partial" | "improper",
  "confidence": "high" | "medium" | "low",
  "summary": "one concise paragraph",
  "isProperResponse": true | false,
  "fdcpaIssues": [
    {
      "title": "short issue name",
      "severity": "low" | "medium" | "high",
      "lawReference": "e.g. 15 U.S.C. § 1692g(b)",
      "evidence": "quoted or paraphrased evidence from collector response",
      "explanation": "why this may be non-compliant"
    }
  ],
  "recommendedNextSteps": [
    "step 1",
    "step 2"
  ],
  "groundsForLawsuit": true | false,
  "lawsuitReasoning": "short explanation",
  "responseLetter": "full consumer follow-up letter text"
}

Output requirements:
- "responseLetter" must be complete, ready to send, and based on the identified issues.
- Keep the response letter firm, clear, and non-lawyerly.
- If no issues are found, still produce a short response letter requesting final written confirmation and cessation of contact.
- Do not output markdown or commentary outside JSON.`;
}

export function buildCollectorResponseAnalysisUserPrompt(params: {
  payload: SessionPayload;
  collectorResponseFileName: string;
}) {
  const { payload, collectorResponseFileName } = params;
  const { userInfo, extractedData, generatedLetter } = payload;

  return `Analyze the uploaded debt collector response.

Consumer details:
- Name: ${userInfo.fullName}
- Address: ${userInfo.streetAddress}, ${userInfo.city}, ${userInfo.state} ${userInfo.zip}
- Phone: ${userInfo.phone}
- Email: ${userInfo.email}

Collector details from original DebtStrike case:
- Collector: ${extractedData.collectorName}
- Collector Address: ${extractedData.collectorAddress}
- Account Number(s): ${extractedData.accountNumber || "Unknown"}
- Amount Claimed: ${extractedData.amountClaimed || "Unknown"}
- Original Creditor: ${extractedData.originalCreditor || "Unknown/Not listed"}

Original debt dispute letter text (consumer already sent this):
${generatedLetter.letterText}

Uploaded response filename:
${collectorResponseFileName}

Instructions:
- Evaluate whether this collector response satisfies the obligations that follow from a written dispute/validation request and cease-contact demand.
- Focus on practical FDCPA issues, especially validation adequacy, continued collection activity without validation, misrepresentations, and continued prohibited contact.
- Use only evidence from the uploaded response.
- Then draft a follow-up letter that references the problems found and demands cure.
- Keep the letter practical and assertive.`;
}
