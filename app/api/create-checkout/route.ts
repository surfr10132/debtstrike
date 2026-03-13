import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { saveSession } from '@/lib/session-store';
import { SessionPayload } from '@/lib/types';

const TEST_MODE = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_your') || !process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const { sessionPayload } = (await request.json()) as {
      sessionPayload: SessionPayload;
    };

    // Store the payload server-side and get a UUID
    const payloadId = saveSession(sessionPayload);

    // TEST MODE: Skip Stripe and go straight to success page
    if (TEST_MODE) {
      console.log('[TEST MODE] Skipping Stripe checkout, redirecting to success page');
      const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id=test_session_bypass&payload_id=${payloadId}`;
      return NextResponse.json({ url: successUrl });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
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
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&payload_id=${payloadId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/generate`,
      metadata: {
        type: 'debt_letter',
        payload_id: payloadId,
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
