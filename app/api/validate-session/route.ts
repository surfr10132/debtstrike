import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSession } from '@/lib/session-store';

const TEST_MODE = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_your') || !process.env.STRIPE_SECRET_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payloadId = searchParams.get('payloadId') || searchParams.get('payload_id');
    const sessionId = searchParams.get('session_id');

    if (!payloadId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Test mode bypass
    if (sessionId === 'test_session_bypass' && TEST_MODE) {
      return NextResponse.json({ valid: true });
    }

    // Share unlock — require corresponding server-side session payload
    if (sessionId === 'share_unlock') {
      const shareSession = await getSession(payloadId);
      if (shareSession?.generatedLetter?.letterText) {
        return NextResponse.json({ valid: true });
      }
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // For Stripe sessions: verify payment status first
    try {
      const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId);
      if (checkoutSession.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Payment not confirmed' },
          { status: 403 }
        );
      }
    } catch (err) {
      console.warn('[validate-session] Stripe check failed:', err);
    }
    // Require server-side session payload
    // Fall back to session store (local dev)
    const session = await getSession(payloadId);
    if (session?.generatedLetter?.letterText) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json(
      { error: 'Session not found or expired' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
