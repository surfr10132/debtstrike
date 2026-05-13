import { NextResponse } from 'next/server';
import anthropic from '@/lib/claude';
import { buildLetterGenerationPrompt } from '@/lib/claude-prompts';
import { ExtractedDebtData, UserInfo } from '@/lib/types';

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { extractedData, userInfo } = body as {
      extractedData: ExtractedDebtData;
      userInfo: UserInfo;
    };

    // Validate required fields
    if (!extractedData) {
      return NextResponse.json(
        { error: 'Missing extractedData in request' },
        { status: 400 }
      );
    }

    if (!userInfo) {
      return NextResponse.json(
        { error: 'Missing userInfo in request' },
        { status: 400 }
      );
    }

    // Validate extractedData has required fields
    if (!extractedData.collectorName || !extractedData.collectorAddress) {
      return NextResponse.json(
        { error: 'Missing required debt collector information (name and/or address)' },
        { status: 400 }
      );
    }

    // Validate userInfo has required fields
    if (!userInfo.fullName || !userInfo.streetAddress || !userInfo.city || !userInfo.state || !userInfo.zip) {
      return NextResponse.json(
        { error: 'Missing required user information (name, address, city, state, zip)' },
        { status: 400 }
      );
    }

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
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    });

    // Validate Claude response has content
    if (!message.content || message.content.length === 0) {
      return NextResponse.json(
        { error: 'No content in Claude response' },
        { status: 500 }
      );
    }

    const letterText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    if (!letterText) {
      return NextResponse.json(
        { error: 'Failed to extract letter text from Claude response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ letterText, date: todayDate });
  } catch (error) {
    console.error('Letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate letter. Please try again.' },
      { status: 500 }
    );
  }
}
