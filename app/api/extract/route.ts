import { NextResponse } from 'next/server';
import anthropic from '@/lib/claude';
import { EXTRACTION_SYSTEM_PROMPT } from '@/lib/claude-prompts';
import { ExtractedDebtData } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadType = formData.get('type') as string;

    let content: Parameters<typeof anthropic.messages.create>[0]['messages'][0]['content'];

    if (uploadType === 'pdf') {
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
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
    } else if (uploadType === 'image') {
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON - try to extract JSON from the response even if there's surrounding text
    let extractedData: ExtractedDebtData;
    try {
      extractedData = JSON.parse(responseText);
    } catch {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: 'Failed to parse extracted data. Please try again.' },
          { status: 500 }
        );
      }
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
