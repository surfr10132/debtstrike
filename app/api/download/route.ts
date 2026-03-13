import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSession } from '@/lib/session-store';
import { generateDocx } from '@/lib/generate-docx';
import { generatePdf } from '@/lib/generate-pdf';

const TEST_MODE = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_your') || !process.env.STRIPE_SECRET_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payloadId = searchParams.get('payloadId');
    const format = searchParams.get('format') as 'docx' | 'pdf';
    const sessionId = searchParams.get('session_id');

    if (!payloadId || !format || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify payment with Stripe (skip in test mode)
    if (sessionId === 'test_session_bypass' && TEST_MODE) {
      console.log('[TEST MODE] Skipping Stripe payment verification');
    } else {
      const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId);
      if (checkoutSession.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Payment not confirmed' },
          { status: 403 }
        );
      }
    }

    // Get the stored payload
    const payload = getSession(payloadId);
    if (!payload) {
      return NextResponse.json(
        { error: 'Session expired. Please generate a new letter.' },
        { status: 410 }
      );
    }

    if (format === 'docx') {
      const buffer = await generateDocx(payload);
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
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            'attachment; filename="DebtStrike-Letter.pdf"',
        },
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document.' },
      { status: 500 }
    );
  }
}
