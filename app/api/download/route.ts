import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSession } from '@/lib/session-store';
import { generateDocx } from '@/lib/generate-docx';
import { generatePdf } from '@/lib/generate-pdf';
import { SessionPayload } from '@/lib/types';

const TEST_MODE = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_your') || !process.env.STRIPE_SECRET_KEY;

/**
 * Retrieve the payload from short-lived server session storage.
 */
async function resolvePayload(
  payloadId: string
): Promise<SessionPayload | null> {
  const fromStore = await getSession(payloadId);
  if (fromStore) return fromStore;

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Accept both camelCase and snake_case param names
    const payloadId = searchParams.get('payloadId') || searchParams.get('payload_id');
    const format = searchParams.get('format') as 'docx' | 'pdf';
    const sessionId = searchParams.get('session_id');

    if (!payloadId || !format || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (format !== 'docx' && format !== 'pdf') {
      return NextResponse.json(
        { error: 'Invalid format. Must be docx or pdf.' },
        { status: 400 }
      );
    }

    // Verify payment with Stripe (skip in test mode and share unlock)
    if (sessionId === 'test_session_bypass' && TEST_MODE) {
      console.log('[TEST MODE] Skipping Stripe payment verification');
    } else if (sessionId === 'share_unlock') {
      console.log('[SHARE] Skipping Stripe — letter unlocked via social share');
    } else {
      const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId);
      if (checkoutSession.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Payment not confirmed' },
          { status: 403 }
        );
      }
    }

    // Resolve payload from server session storage
    const payload = await resolvePayload(payloadId);
    if (!payload) {
      return NextResponse.json(
        { error: 'Session expired. Please generate a new letter.' },
        { status: 410 }
      );
    }

    if (!payload.generatedLetter?.letterText) {
      console.error('Payload missing letterText:', payloadId);
      return NextResponse.json(
        { error: 'Document content is empty. Please generate a new letter.' },
        { status: 422 }
      );
    }

    return generateDownloadResponse(payload, format);
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document.' },
      { status: 500 }
    );
  }
}

/**
 * POST handler: accepts payload directly in the request body.
 * Used only for immediate share-unlock downloads.
 */
export async function POST(request: Request) {
  try {
    const { payload, format, sessionId } = (await request.json()) as {
      payload: SessionPayload;
      format: 'docx' | 'pdf';
      sessionId: string;
    };

    if (!payload || !format || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (format !== 'docx' && format !== 'pdf') {
      return NextResponse.json(
        { error: 'Invalid format. Must be docx or pdf.' },
        { status: 400 }
      );
    }

    const isTestBypass = sessionId === 'test_session_bypass' && TEST_MODE;
    const isShareUnlock = sessionId === 'share_unlock';
    if (!isTestBypass && !isShareUnlock) {
      return NextResponse.json(
        { error: 'Direct payload download is only available for share unlock flow.' },
        { status: 403 }
      );
    }

    if (!payload.generatedLetter?.letterText) {
      return NextResponse.json(
        { error: 'Document content is empty.' },
        { status: 422 }
      );
    }

    return generateDownloadResponse(payload, format);
  } catch (error) {
    console.error('Download POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document.' },
      { status: 500 }
    );
  }
}

async function generateDownloadResponse(
  payload: SessionPayload,
  format: 'docx' | 'pdf'
) {
  if (format === 'docx') {
    const buffer = await generateDocx(payload);
    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate document - empty content.' },
        { status: 500 }
      );
    }
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition':
          'attachment; filename="DebtStrike-Letter.docx"',
      },
    });
  } else {
    const pdfBytes = await generatePdf(payload);
    if (!pdfBytes || pdfBytes.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate document - empty content.' },
        { status: 500 }
      );
    }
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="DebtStrike-Letter.pdf"',
      },
    });
  }
}
