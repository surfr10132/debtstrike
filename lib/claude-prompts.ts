import { ExtractedDebtData, UserInfo } from "./types";

// ─────────────────────────────────────────────
// EXTRACTION PROMPT
// ─────────────────────────────────────────────

export const EXTRACTION_SYSTEM_PROMPT = `You are a debt collection letter analyzer. Your job is to extract structured information from debt collection letters and return it as clean JSON.

Extract the following fields and return ONLY valid JSON — no explanation, no markdown, just the JSON object:

{
  "collectorName": "Full name of the company sending this letter (from the letterhead or signature block)",
  "collectorAddress": "Full mailing address of that company (multi-line is fine)",
  "accountNumber": "Account number, reference number, or file number — whatever identifier they use",
  "amountClaimed": "The dollar amount they claim is owed (e.g. '$1,234.56'). If unknown, use 'Unknown'",
  "originalCreditor": "The original creditor name if different from the sender. If same or not mentioned, use empty string",
  "isThirdPartyCollector": true or false — see decision logic below,
  "collectorTypeConfidence": "high" or "medium" or "low" — how confident you are in the isThirdPartyCollector determination,
  "recipientName": "Full name of the person this letter was sent to — see extraction rules below",
  "recipientStreetAddress": "Street address only (no city/state/zip) of the recipient — see extraction rules below",
  "recipientCity": "City from the recipient's address",
  "recipientState": "Two-letter state abbreviation from the recipient's address (e.g. 'CA', 'TX')",
  "recipientZip": "ZIP code from the recipient's address (5-digit or ZIP+4)",
  "recipientPhone": "The recipient's phone number if mentioned anywhere in the letter"
}

CRITICAL — How to determine isThirdPartyCollector:

This is the most important field. It determines which laws apply. Use this decision tree:

STEP 1: Check for the Mini-Miranda disclosure.
Federal law (FDCPA) REQUIRES third-party collectors to include language like:
  - "This is an attempt to collect a debt"
  - "This communication is from a debt collector"
  - "This is a communication from a debt collector"
  - Any variation of the above
If present → strong indicator of THIRD-PARTY (true). Move to Step 2 to confirm.
If absent → possible original creditor, but not conclusive. Move to Step 2.

STEP 2: Compare the sender name to any original creditor mentioned.
- If the letter mentions an "original creditor," "original account with," or "creditor: [Name]" and that name DIFFERS from the letterhead company → THIRD-PARTY (true), high confidence.
- If the letter says "on behalf of," "our client," "the above-referenced creditor," or "placed with our office for collection" → THIRD-PARTY (true), high confidence.
- If the sender name matches the creditor and there's no Mini-Miranda → likely ORIGINAL CREDITOR (false).

STEP 3: Look at the company name pattern.
Third-party collector indicators in the company name:
  - "Recovery," "Collection," "Collectors," "Associates" (in collection context)
  - "Capital Management," "Financial Services," "Credit Services," "Receivables"
  - "Bureau," "Agency," "Solutions" (in debt context)
  - Known collectors: Midland Credit, Portfolio Recovery, LVNV Funding, Encore Capital, Unifin, IC System, CBE Group, National Credit Systems, Convergent, ERC, Transworld Systems, Allied Interstate, GC Services
Original creditor indicators in the company name:
  - Banks: Chase, Citi, Capital One, Discover, Synchrony, Wells Fargo, Bank of America
  - Medical: Hospital, Medical Center, Health System, Physician
  - Telecom: AT&T, Verizon, T-Mobile, Comcast, Spectrum
  - Utilities: Edison, Gas Company, Water, Electric
  - Retail: Macy's, Nordstrom, Amazon, store credit cards

STEP 4: Look at the letter's language patterns.
Third-party language:
  - "Your account has been placed/assigned/referred/transferred to us"
  - "We have been retained/hired/engaged to collect"
  - "We purchased/acquired this account/debt"
  - "Unless you dispute the validity of this debt within 30 days" (FDCPA validation notice — required for third-party collectors)
  - References a separate "creditor" or "original creditor" in the body
  - Uses their own "reference number" or "file number" distinct from the original account number
Original creditor language:
  - "Your account with us"
  - "As you know, you opened/used/applied for..."
  - References the original product/service directly (credit card, loan, medical visit)
  - "Your [product name] account is past due"
  - "We have attempted to contact you regarding your balance"
  - No Mini-Miranda disclosure anywhere in the letter

FINAL DECISION:
- Mini-Miranda present + different name from creditor → true, high confidence
- Mini-Miranda present + same or unclear name → true, medium confidence
- No Mini-Miranda + "on behalf of" or "placed with" language → true, high confidence
- No Mini-Miranda + collector-type company name + mentions separate original creditor → true, medium confidence
- No Mini-Miranda + company name matches creditor + talks about "your account with us" → false, high confidence
- No Mini-Miranda + unclear whether original or third-party → false, low confidence (flag for user review)
- When in doubt, lean toward true (third-party) — it's more common for collection letters and the letter still works either way

RECIPIENT EXTRACTION — How to find the person this letter was sent to:

Collection letters are physical mail. They almost always have the consumer's name and address printed on the letter so it shows through the envelope window. Look for it in these places, in order:

1. MAILING ADDRESS BLOCK — Usually near the top of the letter, below the date and above the greeting. Formatted like:
   John A. Smith
   1234 Oak Street, Apt 5
   Los Angeles, CA 90012
   Extract the full name, street address, city, state, and zip separately.

2. "RE:" or "REGARDING" LINE — Many letters have "Re: John Smith" or "Regarding the account of: John Smith" — use this for the name if the mailing block is unclear.

3. "DEAR [NAME]" GREETING — "Dear John Smith," or "Dear Mr. Smith" — use this as a fallback for the name. If only a last name with honorific (Mr./Mrs./Ms.), still extract it.

4. PHONE NUMBER — Collectors sometimes write "We attempted to reach you at (555) 123-4567" or "Please contact us regarding your account. Your phone number on file: (555) 123-4567." Extract any phone number that clearly belongs to the recipient (not the collector's own phone number).

IMPORTANT: The recipient address is DIFFERENT from the collector's address. The collector's address is usually in the letterhead or return address area. The recipient's address is in the mailing block — the part of the letter that would show through an envelope window.

If you cannot find a field, use an empty string. Partial info is fine — extract whatever is visible.

General rules:
- If a field cannot be determined, use an empty string (or false for boolean)
- Do not include any text outside the JSON object
- collectorAddress should be the full address on one or multiple lines
- amountClaimed should include the dollar sign
- accountNumber — use whatever identifier appears: account number, reference number, file number, etc.
- originalCreditor should be empty string if the sender IS the original creditor`;

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
 * Pick a random voice for each letter — ensures no two letters
 * to the same collector sound alike.
 */
function pickVoice(): string {
  const voices = Object.keys(VOICE_DESCRIPTIONS);
  return voices[Math.floor(Math.random() * voices.length)];
}

/**
 * Generate a random variation seed to further diversify letter structure.
 * Returns a set of structural instructions that vary paragraph ordering,
 * demand grouping, and rhetorical approach.
 */
function generateVariationSeed(): string {
  const openingStyles = [
    "Start with why you're writing — you got their letter and you have questions.",
    "Start with a direct challenge — you don't recognize this debt and want proof.",
    "Start by mentioning how long this has been going on and that you're tired of it.",
    "Start with a brief personal note — how the calls/letters have been affecting your life — then pivot to your demands.",
    "Start cold — no pleasantries, just straight into what you need from them.",
    "Start by referencing their specific letter — the date you got it, what it said — then respond.",
    "Start with the bottom line: stop calling, prove the debt, or drop it.",
    "Start by asking them a question — do they even have proof this is yours?",
  ];

  const demandGroupings = [
    "Combine the validation demand and the proof list into one flowing paragraph, then handle the phone/contact stuff in a separate paragraph.",
    "Lead with the cease & desist on calls first (that's what's bothering you most), then get into the debt validation demands.",
    "Weave the demands together naturally — don't separate them into distinct sections. Let the letter flow like a real person thinking through what they need.",
    "Put the credit reporting demand early — that's your biggest concern. Then cover validation and phone calls.",
    "Group everything about communication (calls, texts, work, mail-only) into one block, and everything about proving the debt into another.",
    "List your demands in order of what makes you angriest: calls first, then the shady debt, then credit reporting.",
  ];

  const closingStyles = [
    "End with a simple warning — you know your rights and you'll use them.",
    "End matter-of-factly — here's what happens next, ball's in their court.",
    "End short — just sign off, no big closing statement.",
    "End by restating the deadline — 30 days, then it's over.",
    "End with a human touch — you're not trying to dodge a real debt, you just want proof.",
    "End by mentioning you're keeping records of everything from here on out.",
  ];

  const toneModifiers = [
    "Lean slightly sarcastic when referencing their claims.",
    "Keep it dead serious throughout — no humor, no sarcasm.",
    "Add a moment of genuine frustration somewhere in the middle.",
    "Be surprisingly calm and measured, which makes the demands hit harder.",
    "Let some real anger show — but keep it controlled, not unhinged.",
    "Be almost conversational, like you're explaining this to a neighbor.",
    "Be businesslike — treat this like a transaction, not a confrontation.",
  ];

  const paragraphCounts = [
    "Write 3-4 longer paragraphs — don't break things up too much.",
    "Write 5-6 shorter paragraphs — punch each point and move on.",
    "Write 4-5 medium paragraphs with varied lengths — some short, some meaty.",
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return `STRUCTURAL VARIATION FOR THIS LETTER:
- Opening: ${pick(openingStyles)}
- Demand structure: ${pick(demandGroupings)}
- Closing: ${pick(closingStyles)}
- Tone modifier: ${pick(toneModifiers)}
- Paragraph style: ${pick(paragraphCounts)}

Follow these structural directions. They override any default structure you might fall back on. The goal is that this letter looks and feels COMPLETELY different from any other letter this system has ever produced.`;
}

// ─────────────────────────────────────────────
// LETTER GENERATION PROMPT
// ─────────────────────────────────────────────

export function buildLetterGenerationPrompt(
  data: ExtractedDebtData,
  user: UserInfo,
  todayDate: string
): { system: string; user: string } {
  const voice = pickVoice();
  const voiceDesc = VOICE_DESCRIPTIONS[voice];
  const variationSeed = generateVariationSeed();

  const system = `You are writing a letter for a regular person — someone sitting at their kitchen table, typing this on their laptop. This is NOT from a lawyer. NOT from a law office. NOT a legal document. It's a person who got a collection letter and is writing back.

VOICE STYLE: ${voice} — ${voiceDesc}

${variationSeed}

UNIQUENESS IS MANDATORY: Every letter this system produces must be completely unique. Different sentence structures, different word choices, different paragraph ordering, different ways of expressing the same legal demands. If a debt collector compared 10 letters from this system side by side, they should look like 10 different people wrote them from scratch. Never fall back on stock phrases or templated structures. Invent fresh phrasing every single time.

UNIQUENESS TECHNIQUES — use these to avoid sounding templated:
- Vary how you introduce the debt: some letters jump straight to the dispute, others start with how the collector's behavior has affected them, others start with a question.
- Vary the proof demand: sometimes a numbered list, sometimes woven into a paragraph, sometimes phrased as questions ("Can you even show me...?"), sometimes as conditions ("If you actually own this debt, then you should have no problem sending me...").
- Vary the cease & desist: sometimes it's angry ("Stop calling me — I'm serious"), sometimes matter-of-fact ("My number is X, don't use it again"), sometimes tied to consequences ("Every call after this letter is $1,000, your choice").
- Vary the level of legal detail: some letters name the specific FDCPA sections, others just reference "federal law" or "the law" more casually, others explain what the law means in plain English. All approaches are equally valid.
- Vary sentence length: mix short punchy sentences with longer ones. Don't write every sentence the same length.
- Vary how the person refers to the debt: "this so-called debt," "whatever this is," "the amount you're claiming," "this balance," "what you say I owe" — never the same phrase twice in one letter.
- NEVER start two consecutive paragraphs the same way. If one starts with "I," the next must start differently.

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
- "I want to make it clear" / "let me be clear" / "to be clear" (just state the thing)
- "going forward" (just say "from now on" or "after this" or skip it)
- "consider this letter as" / "please be advised" / "be advised that"
- "I reserve the right" (just say what you'll do)
- "governed by" / "under the provisions of"
- "demand that you" at the start of multiple sentences (vary it — "I need you to," "you have to," "here's what has to happen")
- "rest assured" / "make no mistake"

THINK OF IT THIS WAY: If your mom or your neighbor wouldn't say it in a text message, don't put it in this letter. Real people say "prove it," "show me," "stop calling me," "that's against the law." They don't say "I hereby request verification" or "cease all collection activities."

ALSO: Don't pad the letter with filler sentences that explain why the person is making each demand. A real person just MAKES the demand — they don't write a paragraph justifying each one. Keep it tight. If the voice is D (detailed), they can explain a bit more, but even then, keep it real — not like a legal memo.

HOW TO MENTION THE LAW — keep it natural and vary the approach:
- APPROACH 1 — Name the law casually: "Under the Fair Debt Collection Practices Act, section 1692g, I have the right to ask you to prove this debt is real."
- APPROACH 2 — Use the acronym with a quick explanation: "The FDCPA — that's the federal law about debt collection — says I can tell you to stop calling me. That's section 1692c."
- APPROACH 3 — Just reference it by section: "Section 1692g of the FDCPA gives me 30 days to dispute this, and that's what I'm doing."
- APPROACH 4 — Reference it without naming sections: "Federal law says you have to prove this debt is real if I ask. I'm asking."
- APPROACH 5 — Weave it naturally: "You probably already know this, but the law (FDCPA, section 1692c) says once you get this letter, the calls stop."
- APPROACH 6 — State law reference: "California has its own law too (Civil Code 1788) that backs this up."
- BAD: "Pursuant to 15 U.S.C. § 1692g, I hereby exercise my right to request validation."
- BAD: "I am invoking my rights under FDCPA § 1692c(c) to demand cessation of all telephonic communication."

Pick ONE approach for each law mention — don't use the same approach twice in one letter. Some letters should be more law-heavy (naming sections), others more casual (just referencing "the law"). Match the voice.

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
Last 4 of SSN: ${user.ssnLast4}
Date of Birth: ${user.dob}

THEY'RE WRITING TO:
${data.collectorName}
${data.collectorAddress}

ABOUT THIS DEBT:
Account number: ${data.accountNumber || "whatever they referenced in their letter"}
Amount they say is owed: ${data.amountClaimed || "whatever they claimed"}
${originalCreditorLine}
Is this a third-party collector (not the original creditor)? ${data.isThirdPartyCollector ? "Yes" : "No"}
Today's date: ${todayDate}

FORMATTING RULES:
- Names and addresses must be in NORMAL CASE (title case) — NOT all caps. Write "John Smith", not "JOHN SMITH". Write "123 Main St", not "123 MAIN ST". Write "Los Angeles, CA 90001", not "LOS ANGELES, CA 90001". ALL CAPS addresses look like a template — real people don't type their own name in all caps.
- The ONLY things that can be uppercase are the state abbreviation (CA, TX, etc.) and "Re:" subject line content.

LETTER FORMAT:
[Person's name and address — normal case, not all caps]
[Phone number]

[Date]

[Collector name and address — normal case, not all caps]

Re: Account #${data.accountNumber || "[number]"}${data.originalCreditor ? ` / ${data.originalCreditor}` : ""} — All accounts associated with SSN ending in ${user.ssnLast4}, DOB ${user.dob}, name ${user.fullName}

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

Remember: this person is NOT a lawyer. They're writing this themselves. Make it sound like them — real, direct, human.

CRITICAL — UNIQUENESS: Do NOT fall into a template. Every letter must use completely different:
- Opening line and greeting style
- Way of introducing the debt dispute
- Way of listing or weaving in the demands
- Phrasing for the cease & desist
- Sentence lengths and paragraph structure
- Closing and sign-off

The voice style and structural variation above are your guide — follow them, but also improvise within them. Two letters with the same voice should still look nothing alike. Write this letter as if you've never written one before.`;

  return { system, user: user_prompt };
}
