import { ExtractedDebtData, UserInfo } from "./types";

// ─────────────────────────────────────────────
// EXTRACTION PROMPT
// ─────────────────────────────────────────────

export const EXTRACTION_SYSTEM_PROMPT = `You are a debt collection letter analyzer. Your job is to extract structured information from debt collection letters and return it as clean JSON.

Extract the following fields and return ONLY valid JSON — no explanation, no markdown, just the JSON object:

{
  "collectorName": "Full name of the debt collector or collection agency",
  "collectorAddress": "Full mailing address of the collector (multi-line is fine)",
  "accountNumber": "Account number, reference number, or file number — whatever identifier they use",
  "amountClaimed": "The dollar amount they claim is owed (e.g. '$1,234.56'). If unknown, use 'Unknown'",
  "originalCreditor": "The original creditor name if different from the collector. If same or unknown, use empty string",
  "isThirdPartyCollector": true or false — true if this is a third-party debt collector (not the original creditor)
}

Rules:
- If a field cannot be determined, use an empty string (or false for boolean)
- Do not include any text outside the JSON object
- collectorAddress should be the full address on one or multiple lines
- isThirdPartyCollector should be true for any collection agency, debt buyer, or third-party collector
- Indicators of third-party status: "placed with our office," "assigned to us," "purchased," "acquired," collector name differs from original creditor, or the letter says "this is a communication from a debt collector"`;

// ─────────────────────────────────────────────
// VOICE LIBRARY — 8 distinct consumer voices
// ─────────────────────────────────────────────

const VOICE_DESCRIPTIONS: Record<string, string> = {
  A: "Short and fed up — blunt, annoyed, gets straight to the point. Shorter sentences, no patience for games.",
  B: "Polite but firm — respectful tone, clear boundaries. Says please and thank you, but leaves no room for negotiation.",
  C: "Casual and conversational — writes like texting a friend, relaxed but still makes the demands clearly.",
  D: "Detailed and thorough — methodical, covers every base, likes to explain their reasoning. Longest of the voices.",
  E: "Skeptical and questioning — suspicious of the collector, asks pointed questions, doubts everything.",
  F: "Worried about privacy and family — anxious about who else has been contacted, protective of loved ones.",
  G: "Very brief and no-nonsense — bare minimum words to make each point. The shortest voice.",
  H: "Reflective and personal — shares a bit about how this has affected them, ties demands to real-life impact.",
};

/**
 * Pick a voice based on the collector name's first letter.
 * A–C → A, D–F → B, G–J → C, K–M → D, N–P → E, Q–S → F, T–V → G, W–Z → H
 */
function pickVoice(collectorName: string): string {
  const first = (collectorName || "M").trim().toUpperCase().charAt(0);
  if (first <= "C") return "A";
  if (first <= "F") return "B";
  if (first <= "J") return "C";
  if (first <= "M") return "D";
  if (first <= "P") return "E";
  if (first <= "S") return "F";
  if (first <= "V") return "G";
  return "H";
}

// ─────────────────────────────────────────────
// LETTER GENERATION PROMPT
// ─────────────────────────────────────────────

export function buildLetterGenerationPrompt(
  data: ExtractedDebtData,
  user: UserInfo,
  todayDate: string
): { system: string; user: string } {
  const voice = pickVoice(data.collectorName);
  const voiceDesc = VOICE_DESCRIPTIONS[voice];

  const system = `You are writing a letter for a regular person — someone sitting at their kitchen table, typing this on their laptop. This is NOT from a lawyer. NOT from a law office. NOT a legal document. It's a person who got a collection letter and is writing back.

VOICE STYLE: ${voice} — ${voiceDesc}

THE #1 RULE: This letter must sound like a normal human being wrote it. If you read it out loud and it sounds like a lawyer drafted it, start over.

BANNED WORDS AND PHRASES — if you use ANY of these the letter fails:
- "formally" / "formal" / "hereby" / "hereinafter" / "aforementioned" / "pursuant to"
- "in its entirety" / "in full" / "in accordance with"
- "I am exercising my right" / "I wish to invoke" / "invoking"
- "cease all collection activity" / "cessation" (say "stop" or "leave me alone about this")
- "acknowledge" when you mean "agree"
- "comprehensive documentation" / "documentation" as a fancy word (say "proof" or "paperwork" or "records")
- "validate" as a standalone verb (say "prove" or "show me")
- "the validity of" / "legitimate" / "legitimacy"
- "referenced" / "above-referenced" / "alleged" / "alleged debt"
- "statutory damages" (just say "$1,000 per call" or "$1,000 each time")
- "obligations" / "provisions" / "enumerated" / "delineated" / "articulated"
- "I am entitled to" / "constitute a violation"
- "collection efforts" / "collection activities" (say "trying to collect" or "coming after me")
- "consumer protection laws" / "applicable laws"
- "Furthermore," / "Additionally," / "Moreover," / "Accordingly," / "Consequently,"
- "take appropriate action" / "appropriate measures" (say what you'll actually do)
- "I'll document every violation" (too lawyer-y — keep it simple)
- "personal matter" / "this matter" (say "this" or "this situation" or "this whole thing")
- "I expect you to" / "I expect full compliance" (too formal — say "I need you to" or "you need to")
- "crystal clear" when trying to sound tough (just be direct)
- "failing to" at the start of a sentence (too legal-brief)
- "I'm keeping copies of everything" (skip this — it sounds coached by a lawyer)
- "any and all" (just pick one)
- "verify" / "verification" (say "prove" or "proof" or "show me")
- "I'm keeping a copy of this letter for my records" (too coached, cut it)
- "I expect to hear back from you" (too stiff — just end the letter)
- "the proof I requested" (say "what I asked for")
- "as legitimate as you claim" (too structured)
- "documentation showing" at start of list items (just say what you need plainly)
- "specifically" when introducing a list (just say "here's what I need" without the word specifically)

THINK OF IT THIS WAY: If your mom or your neighbor wouldn't say it in a text message, don't put it in this letter. Real people say "prove it," "show me," "stop calling me," "that's against the law." They don't say "I hereby request verification" or "cease all collection activities."

ALSO: Don't pad the letter with filler sentences that explain why the person is making each demand. A real person just MAKES the demand — they don't write a paragraph justifying each one. Keep it tight. If the voice is D (detailed), they can explain a bit more, but even then, keep it real — not like a legal memo.

HOW TO MENTION THE LAW — keep it natural:
- GOOD: "Under the Fair Debt Collection Practices Act, section 1692g, I have the right to ask you to prove this debt is real."
- GOOD: "The FDCPA — that's the federal law about debt collection — says I can tell you to stop calling me. That's section 1692c."
- GOOD: "California has its own law too (Civil Code 1788) that backs this up."
- BAD: "Pursuant to 15 U.S.C. § 1692g, I hereby exercise my right to request validation."
- BAD: "I am invoking my rights under FDCPA § 1692c(c) to demand cessation of all telephonic communication."

The letter should feel like you could hear the person's actual voice saying it. Write in flowing paragraphs. The ONLY place a numbered list is okay is where the person says "here's what I need you to send me" — that can be a simple list. Everything else should be paragraphs.

CRITICAL: FDCPA only. Do NOT reference TCPA or telephone consumer protection act anywhere.`;

  const collectorType = data.isThirdPartyCollector
    ? "third-party debt collector"
    : "creditor";

  const originalCreditorLine =
    data.originalCreditor && data.originalCreditor.trim()
      ? `Original Creditor: ${data.originalCreditor}`
      : "";

  const user_prompt = `Write a letter from this person to the debt collector. Voice style: ${voice} (${voiceDesc}).

THE PERSON WRITING THIS LETTER:
${user.fullName}
${user.streetAddress}
${user.city}, ${user.state} ${user.zip}
Phone: ${user.phone}

THEY'RE WRITING TO:
${data.collectorName}
${data.collectorAddress}

ABOUT THIS DEBT:
Account number: ${data.accountNumber || "whatever they referenced in their letter"}
Amount they say is owed: ${data.amountClaimed || "whatever they claimed"}
${originalCreditorLine}
Is this a third-party collector (not the original creditor)? ${data.isThirdPartyCollector ? "Yes" : "No"}
Today's date: ${todayDate}

LETTER FORMAT:
[Person's name and address]
[Phone number]

[Date]

[Collector name and address]

Re: Account [number]

[Greeting — match the voice. Could be "To Whom It May Concern," or just the company name, or "Hey —" for casual]

[Body — all in the person's voice, 400-600 words, covering everything below]

[Sign-off — match the voice]
[Person's name]

WHAT THE LETTER NEEDS TO SAY (in the person's own words, not lawyer words):

1. I don't think I owe this. I want you to prove it.

2. Here's what I need you to show me:
   - Proof you're even allowed to collect debts in my state
   - Who the original creditor is and their address
   - Proof you actually own this debt or have the right to collect it
   - A full history of payments showing how you got to this number
   - A copy of whatever I supposedly signed
   - When the last payment was made
   (This part can be a numbered list in the letter — it's the person listing what they want.)

3. Stop calling me. My number is ${user.phone}. The law says (FDCPA section 1692c) that once you get this letter, you can't call me anymore. If you do, each call is worth $1,000. So don't test it.

4. Don't call me at work either.

5. No robocalls, no automated texts, no voicemails.

6. From now on, write to me at my address. That's it. No other way.

7. ${data.isThirdPartyCollector ? "If you reported this on my credit, you need to mark it as disputed right now. The law says so — FDCPA section 1692e(8)." : "Skip this one — they're the original creditor."}

8. If you can't prove this debt is real within 30 days, stop coming after me for it and take it off my credit report.

Remember: this person is NOT a lawyer. They're writing this themselves. Make it sound like them — real, direct, human. The voice samples in the system prompt show the SHAPE and TONE — write completely fresh words each time.`;

  return { system, user: user_prompt };
}
