import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { saveSession } from '@/lib/session-store';
import { SessionPayload } from '@/lib/types';
import { encodePayloadToMetadata } from '@/lib/stripe-payload';

const TEST_MODE = process.env.DEBTSTRIKE_TEST_MODE === 'true' || process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_your') || !process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const { sessionPayload, mailForMe, shareUnlocked } = (await request.json()) as {
      sessionPayload: SessionPayload;
      mailForMe?: boolean;
      shareUnlocked?: boolean;
    };

    // Store the payload server-side and get a UUID
    const payloadId = await saveSession(sessionPayload);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_BASE_URL is not configured' },
        { status: 500 }
      );
    }

    // TEST MODE: Skip Stripe and go straight to success page
    if (TEST_MODE) {
      console.log('[TEST MODE] Skipping Stripe checkout, redirecting to success page');
      const successUrl = `${baseUrl}/success?session_id=test_session_bypass&payload_id=${payloadId}${mailForMe ? '&mailed=1' : ''}`;
      return NextResponse.json({ url: successUrl });
    }

    // Build line items based on order type
    const lineItems: Array<{
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description: string };
      };
      quantity: number;
    }> = [];

    // If letter was unlocked via social share, skip the $20 letter fee
    if (!shareUnlocked) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: 2000, // $20.00
          product_data: {
            name: 'DebtStrike - Debt Validation & Cease & Desist Letter',
            description:
              'Custom-generated combined debt validation and cease & desist letter (.docx + .pdf)',
          },
        },
        quantity: 1,
      });
    }

    if (mailForMe) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: 1099, // $10.99 — covers Lob (~$10.41) + Stripe 2.9%
          product_data: {
            name: 'USPS Certified Mail with Return Receipt',
            description:
              'We print and mail your letter via USPS Certified Mail with Electronic Return Receipt. Tracking number emailed to you.',
          },
        },
        quantity: 1,
      });
    }

    // Determine order type for webhook processing
    const orderType = mailForMe
      ? (shareUnlocked ? 'share_mail' : 'debt_letter_mail')
      : 'debt_letter';

    // Encode full payload into Stripe metadata so it survives across
    // serverless invocations (the in-memory session store does NOT persist on Vercel)
    const payloadChunks = encodePayloadToMetadata(sessionPayload);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&payload_id=${payloadId}${mailForMe ? '&mailed=1' : ''}`,
      cancel_url: `${baseUrl}/generate`,
      metadata: {
        type: orderType,
        payload_id: payloadId,
        mail_for_me: mailForMe ? 'true' : 'false',
        share_unlocked: shareUnlocked ? 'true' : 'false',
        ...payloadChunks,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session.' },
      { status: 500 }
    );
  }
}
