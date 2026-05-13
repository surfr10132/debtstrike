import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSession } from '@/lib/session-store';
import { decodePayloadFromMetadata } from '@/lib/stripe-payload';

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

    // Share unlock — trust it (the share-upload endpoint already validated)
    if (sessionId === 'share_unlock') {
      return NextResponse.json({ valid: true });
    }

    // For Stripe sessions: verify payment AND that payload exists in metadata
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (checkoutSession.payment_status === 'paid') {
        // Check if payload is in Stripe metadata
        const payload = decodePayloadFromMetadata(
          checkoutSession.metadata as Record<string, string>
        );
        if (payload?.generatedLetter?.letterText) {
          return NextResponse.json({ valid: true });
        }
      }
    } catch (err) {
      console.warn('[validate-session] Stripe check failed:', err);
    }

    // Fall back to session store (local dev)
    const session = await getSession(payloadId);
    if (session) {
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
