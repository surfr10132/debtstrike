import { NextResponse } from "next/server";
import anthropic from "@/lib/claude";
import { CreditReportItem, UserInfo, DisputeLetter } from "@/lib/types";

export const maxDuration = 120; // Allow up to 120s for generating multiple letters

interface GenerateDisputesRequest {
  items: CreditReportItem[];
  userInfo: UserInfo;
}

// Bureau mailing addresses
const BUREAU_ADDRESSES: Record<string, string> = {
  TransUnion:
    "TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016",
  Experian:
    "Experian\nP.O. Box 4500\nAllen, TX 75013",
  Equifax:
    "Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374",
};

// ─────────────────────────────────────────────
// VOICE LIBRARY — 8 distinct consumer voices
// ─────────────────────────────────────────────

const VOICE_DESCRIPTIONS: Record<string, string> = {
  A: "Short and fed up — blunt, annoyed, gets straight to the point. Shorter sentences, no patience for runarounds.",
  B: "Polite but firm — respectful tone, clear expectations. Says please, but makes demands sound like they're not optional.",
  C: "Casual and conversational — writes like they're explaining this to a friend. Relaxed but still hits every point.",
  D: "Detailed and thorough — methodical, walks through each item carefully, explains their reasoning. Longest voice.",
  E: "Skeptical and questioning — doesn't trust the bureau, questions everything, asks pointed questions about accuracy.",
  F: "Worried and protective — anxious about their credit score affecting their family, mortgage, job. Emotional but focused.",
  G: "Very brief and no-nonsense — bare minimum words. Gets in, makes demands, gets out.",
  H: "Reflective and personal — shares how these errors have actually impacted their life. Makes it real, not abstract.",
};

function pickVoice(): string {
  const voices = Object.keys(VOICE_DESCRIPTIONS);
  return voices[Math.floor(Math.random() * voices.length)];
}

/**
 * Generate a random variation seed to diversify letter structure.
 */
function generateVariationSeed(): string {
  const openingStyles = [
    "Start by saying you pulled your credit report and found errors that need to be fixed.",
    "Start with frustration — you've been dealing with wrong info on your report and it's affecting your life.",
    "Start matter-of-factly — you're writing to dispute specific items and here's why.",
    "Start by mentioning you were denied credit/housing/a job because of what's on your report.",
    "Start cold — no preamble, just: I'm disputing the following accounts.",
    "Start by referencing the FCRA — you know your rights and you're using them.",
    "Start with a question — how is this account still on my report when it's wrong?",
    "Start by saying you've tried to resolve this before and nothing has changed.",
  ];

  const itemStyles = [
    "Walk through each disputed item one at a time, explaining what's wrong with each in its own paragraph.",
    "Group the items into a numbered list with a brief explanation per item, then make your demands after.",
    "Weave the items into flowing paragraphs — don't use a formal list. Mention each naturally.",
    "Lead with the worst item first (highest balance or most obviously wrong), then cover the rest.",
    "Present all items together, then explain the patterns — are they all from the same collector? All outdated? All unverifiable?",
    "For each item, ask the bureau a specific question about it — make them answer for each one.",
  ];

  const demandStyles = [
    "Make demands conversationally — tell them what you need and when, woven into the letter naturally.",
    "Put demands in a clear block after discussing the items — here's what I need you to do.",
    "Scatter demands throughout — dispute demands with the items, investigation demand in the middle, corrected report at the end.",
    "Lead with the 30-day deadline demand, then explain what you're disputing and why.",
    "End with demands — build the case first, then tell them what to do about it.",
  ];

  const closingStyles = [
    "End with the 30-day deadline reminder and what happens if they don't act.",
    "End simply — you expect to hear back, here's your contact info.",
    "End by mentioning you're sending this certified mail so there's a record.",
    "End with a note about the corrected report — you want a clean copy when this is done.",
    "End short — just sign off. No big speech.",
    "End by saying you'll escalate to the CFPB if this isn't resolved.",
  ];

  const toneModifiers = [
    "Keep it calm and steady throughout — quiet confidence.",
    "Let some frustration show, especially when describing the errors.",
    "Be businesslike — this is a transaction, not a confrontation.",
    "Be surprisingly warm but firm — you're not angry, you just want this fixed.",
    "Be direct and a little impatient — you've waited long enough.",
    "Be measured but make it clear you know the law and you're not bluffing.",
    "Sound like someone who's done their research and won't be brushed off.",
  ];

  const paragraphCounts = [
    "Write 3-4 longer paragraphs — keep things flowing together.",
    "Write 5-7 shorter paragraphs — one thought per paragraph, punchy.",
    "Write 4-5 paragraphs of varied length — some short, some more detailed.",
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return `STRUCTURAL VARIATION FOR THIS LETTER:
- Opening: ${pick(openingStyles)}
- How to present disputed items: ${pick(itemStyles)}
- How to make demands: ${pick(demandStyles)}
- Closing: ${pick(closingStyles)}
- Tone modifier: ${pick(toneModifiers)}
- Paragraph style: ${pick(paragraphCounts)}

Follow these structural directions. They override any default structure you'd fall back on. The goal is that this letter looks and feels COMPLETELY different from any other letter this system has ever produced.`;
}

// ─────────────────────────────────────────────
// SYSTEM PROMPT — credit bureau dispute letters
// ─────────────────────────────────────────────

function buildDisputeSystemPrompt(voice: string, voiceDesc: string, variationSeed: string): string {
  return `You are writing a credit bureau dispute letter for a regular person — someone who pulled their credit report, found errors, and is writing to the bureau to get them fixed. This is NOT from a lawyer. NOT a legal document. It's a person exercising their rights under the Fair Credit Reporting Act.

VOICE STYLE: ${voice} — ${voiceDesc}

${variationSeed}

UNIQUENESS IS MANDATORY: Every letter this system produces must be completely unique. Different sentence structures, different word choices, different paragraph ordering, different ways of expressing the same demands. If someone compared 10 letters from this system side by side, they should look like 10 different people wrote them from scratch. Never fall back on stock phrases or templated structures.

THE #1 RULE: This letter must sound like a normal human being wrote it. If you read it out loud and it sounds like a template or a lawyer drafted it, start over.

BANNED WORDS AND PHRASES — if you use ANY of these, the letter fails:
- "formally" / "formal" / "hereby" / "hereinafter" / "aforementioned" / "pursuant to"
- "in its entirety" / "in full" / "in accordance with"
- "I am exercising my right" / "I wish to invoke" / "invoking"
- "cease" / "cessation" (say "stop" or "remove")
- "acknowledge" when you mean "agree"
- "comprehensive documentation" / "documentation" (say "proof" or "records")
- "validate" as a standalone verb (say "prove" or "show me" or "confirm")
- "the validity of" / "legitimate" / "legitimacy"
- "above-referenced" / "aforementioned" / "alleged"
- "statutory damages"
- "obligations" / "provisions" / "enumerated" / "delineated" / "articulated"
- "I am entitled to" / "constitute a violation"
- "Furthermore," / "Additionally," / "Moreover," / "Accordingly," / "Consequently,"
- "take appropriate action" / "appropriate measures"
- "personal matter" / "this matter" (say "this" or "this situation")
- "I expect full compliance" (too formal — say "I need you to" or "you need to")
- "crystal clear"
- "failing to" at the start of a sentence
- "any and all" (just pick one)
- "I am keeping a copy of this letter for my records" (too coached)
- "the items listed below" / "the following items" (just describe them)
- "I respectfully request" (just ask or tell)
- "to the best of my knowledge" (just say "I don't recognize this" or "this is wrong")
- "Please be advised" / "Kindly" / "I would like to bring to your attention"
- "discrepancies" (say "errors" or "wrong information" or "mistakes")

THINK OF IT THIS WAY: If your neighbor wouldn't say it while explaining their credit report problem over coffee, don't put it in this letter. Real people say "this is wrong," "I never had this account," "fix this," "prove it." They don't say "I hereby dispute the validity of the aforementioned tradeline."

HOW TO MENTION THE LAW — keep it natural:
- GOOD: "Under the Fair Credit Reporting Act — that's section 1681i — you have 30 days to look into this and either fix it or prove it's right."
- GOOD: "The FCRA says if you can't verify this information, you have to take it off. That's 15 U.S.C. § 1681i(a)(5)."
- GOOD: "I know my rights under the FCRA. You have 30 days once you get this letter."
- BAD: "Pursuant to 15 U.S.C. § 1681i(a)(1)(A), I hereby request that you conduct a reasonable investigation."
- BAD: "I am exercising my rights under the Fair Credit Reporting Act to formally dispute the accuracy of the following tradelines."

The letter should feel like you can hear the person's actual voice saying it. Write in flowing paragraphs. A numbered list of the disputed items is fine — that's natural. Everything else should be paragraphs, not bullet points or numbered demands.

CRITICAL: This is a credit BUREAU dispute letter (to TransUnion, Experian, or Equifax). NOT a letter to a debt collector. The demands are different:
- Investigate the disputed items within 30 days (§ 1681i(a)(1))
- If you can't verify the information, delete it (§ 1681i(a)(5))
- Send me a corrected copy of my credit report after the investigation
- Notify anyone who pulled my report in the last 6 months (2 years for employment) about the corrections (§ 1681i(d))
- Do NOT reference FDCPA, TCPA, cease and desist, or debt collector-specific language — this is going to a credit bureau, not a collector

DO NOT include any instructions, commentary, or notes — just the letter text itself.`;
}

async function generateLetterForBureau(
  bureau: string,
  items: CreditReportItem[],
  userInfo: UserInfo
): Promise<string> {
  const voice = pickVoice();
  const voiceDesc = VOICE_DESCRIPTIONS[voice];
  const variationSeed = generateVariationSeed();

  const itemDescriptions = items
    .map(
      (item, i) =>
        `${i + 1}. Creditor: ${item.creditorName} | Account #: ${item.accountNumber} | Type: ${item.accountType} | Balance: ${item.balance} | Status: ${item.status} | Reason for dispute: ${item.reason}`
    )
    .join("\n");

  const todayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const systemPrompt = buildDisputeSystemPrompt(voice, voiceDesc, variationSeed);

  const userPrompt = `Write a credit bureau dispute letter from this person to ${bureau}. Voice style: ${voice} (${voiceDesc}).

THE PERSON WRITING THIS LETTER:
${userInfo.fullName}
${userInfo.streetAddress}
${userInfo.city}, ${userInfo.state} ${userInfo.zip}

THEY'RE WRITING TO:
${bureau}
${BUREAU_ADDRESSES[bureau]}

TODAY'S DATE: ${todayDate}

ITEMS TO DISPUTE (${items.length} total):
${itemDescriptions}

FORMATTING RULES:
- Names and addresses must be in NORMAL CASE (title case) — NOT all caps. Write "John Smith", not "JOHN SMITH". The ONLY uppercase allowed is the state abbreviation (CA, TX, etc.)
- Include a signature line at the bottom

LETTER FORMAT:
[Person's name and address — normal case]

[Date]

[Bureau name and address — normal case]

Re: Dispute of Inaccurate Information — ${userInfo.fullName}

[Greeting — match the voice. Could be "To Whom It May Concern," or "Dear ${bureau} Dispute Department," or something less formal for casual voices]

[Body — all in the person's voice, 400-700 words, covering everything below]

[Sign-off — match the voice]
[Person's name]

WHAT THE LETTER NEEDS TO COVER (in the person's own words, not lawyer words):

1. I pulled my credit report and found ${items.length} item${items.length > 1 ? "s" : ""} that ${items.length > 1 ? "are" : "is"} wrong. I'm disputing ${items.length > 1 ? "them" : "it"}.

2. For each item, explain what's wrong — why it's being disputed. Use the specific reason provided for each item. Don't be generic — be specific to each account.

3. Under the FCRA (section 1681i), you have 30 days from when you receive this letter to investigate each item I'm disputing.

4. If you can't verify the information with the creditor, you have to remove it from my report. That's section 1681i(a)(5).

5. After your investigation, send me an updated copy of my credit report showing the corrections.

6. Also notify anyone who pulled my report in the last 6 months (or 2 years if it was for employment) about the changes.

7. I'm including a copy of my ID and a utility bill to verify my identity.

8. I'm sending this certified mail so we both have a record of when you received it.

CRITICAL — UNIQUENESS: Do NOT fall into a template. Every letter must use completely different:
- Opening line and greeting style
- Way of introducing the dispute
- Way of presenting the disputed items (list vs. paragraphs vs. mixed)
- Phrasing for the legal demands
- Sentence lengths and paragraph structure
- Closing and sign-off

The voice style and structural variation are your guide — follow them, but also improvise within them. Two letters with the same voice should still look nothing alike.

Write the complete letter now.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function POST(request: Request) {
  try {
    const { items, userInfo } = (await request.json()) as GenerateDisputesRequest;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items selected for dispute" },
        { status: 400 }
      );
    }

    if (!userInfo?.fullName || !userInfo?.streetAddress) {
      return NextResponse.json(
        { error: "Missing user information" },
        { status: 400 }
      );
    }

    // Group items by bureau
    const byBureau: Record<string, CreditReportItem[]> = {};
    for (const item of items) {
      if (!byBureau[item.bureau]) byBureau[item.bureau] = [];
      byBureau[item.bureau].push(item);
    }

    // Generate letters in parallel — one per bureau
    const bureaus = Object.keys(byBureau);
    const letterPromises = bureaus.map((bureau) =>
      generateLetterForBureau(bureau, byBureau[bureau], userInfo).then(
        (letterText) => ({
          bureau: bureau as "TransUnion" | "Experian" | "Equifax",
          letterText,
          itemsDisputed: byBureau[bureau].length,
        })
      )
    );

    const disputeLetters: DisputeLetter[] = await Promise.all(letterPromises);

    return NextResponse.json({ disputeLetters });
  } catch (error) {
    console.error("Dispute letter generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate dispute letters. Please try again." },
      { status: 500 }
    );
  }
}
