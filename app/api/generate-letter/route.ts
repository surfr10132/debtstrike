import { NextResponse } from 'next/server';
import anthropic from '@/lib/claude';
import { buildLetterGenerationPrompt } from '@/lib/claude-prompts';
import { ExtractedDebtData, UserInfo } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { extractedData, userInfo } = (await request.json()) as {
      extractedData: ExtractedDebtData;
      userInfo: UserInfo;
    };

    const todayDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const { system, user } = buildLetterGenerationPrompt(
      extractedData,
      userInfo,
      todayDate
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const letterText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ letterText, date: todayDate });
  } catch (error) {
    console.error('Letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate letter. Please try again.' },
      { status: 500 }
    );
  }
}
