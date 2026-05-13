import { NextResponse } from 'next/server';
import anthropic from '@/lib/claude';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/claude-prompts';
import { ExtractedDebtData } from '@/lib/types';

/**
 * Robust JSON parsing that handles:
 * - Markdown code blocks (```json ... ```)
 * - Mixed text + JSON responses
 * - Partial JSON (will try to parse what we can)
 */
function extractAndParseJSON(text: string): Record<string, any> {
  let cleanText = text.trim();

  // Remove markdown code block wrappers
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanText = codeBlockMatch[1].trim();
  }

  // Try direct parse first
  try {
    return JSON.parse(cleanText);
  } catch {
    // Ignore and continue
  }

  // Try to find JSON object in the text
  // Look for { ... } pattern, preferring the first complete object
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Ignore and continue
    }
  }

  // If all else fails, throw with helpful debug info
  throw new Error(
    `Could not extract valid JSON from response. Raw response (first 500 chars): ${cleanText.substring(0, 500)}`
  );
}

/**
 * Validates and fills in defaults for ExtractedDebtData
 */
function validateAndNormalizeData(
  parsed: Record<string, any>
): ExtractedDebtData {
  return {
    collectorName: typeof parsed.collectorName === 'string' ? parsed.collectorName.trim() : '',
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
    collectorTypeConfidence:
      ['high', 'medium', 'low'].includes(parsed.collectorTypeConfidence)
        ? parsed.collectorTypeConfidence
        : 'low',
    recipientName:
      typeof parsed.recipientName === 'string' ? parsed.recipientName.trim() : '',
    recipientStreetAddress:
      typeof parsed.recipientStreetAddress === 'string' ? parsed.recipientStreetAddress.trim() : '',
    recipientCity:
      typeof parsed.recipientCity === 'string' ? parsed.recipientCity.trim() : '',
    recipientState:
      typeof parsed.recipientState === 'string' ? parsed.recipientState.trim().toUpperCase() : '',
    recipientZip:
      typeof parsed.recipientZip === 'string' ? parsed.recipientZip.trim() : '',
    recipientPhone:
      typeof parsed.recipientPhone === 'string' ? parsed.recipientPhone.trim() : '',
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadType = formData.get('type') as string;

    let content: Parameters<typeof anthropic.messages.create>[0]['messages'][0]['content'];

    if (uploadType === 'upload' || uploadType === 'pdf' || uploadType === 'image') {
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');

      // Detect whether it's a PDF or image from the file's MIME type
      if (file.type === 'application/pdf') {
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
            text: 'Extract the debt collection information from this document.',
          },
        ];
      } else {
        const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
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
      const text = formData.get('text') as string;
      if (!text) {
        return NextResponse.json({ error: 'No text provided' }, { status: 400 });
      }
      content = [
        {
          type: 'text' as const,
          text: `Extract the debt collection information from this letter:\n\n${text}`,
        },
      ];
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content },
        // Prefill assistant response with opening brace to force JSON format
        {
          role: 'assistant',
          content: '{',
        },
      ],
    });

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : '';
    // Prepend the prefilled '{' since Claude's response continues after it
    const responseText = '{' + rawText;

    // Robust JSON parsing and schema validation
    let extractedData: ExtractedDebtData;
    try {
      const parsed = extractAndParseJSON(responseText);
      extractedData = validateAndNormalizeData(parsed);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse extracted data. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract data from the letter. Please try again.' },
      { status: 500 }
    );
  }
}
