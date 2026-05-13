import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSession } from '@/lib/session-store';
import { decodePayloadFromMetadata } from '@/lib/stripe-payload';
import { generateLetterHtml } from '@/lib/generate-letter-html';
import { LetterEditable, LetterEditableExtraServiceEnum } from '@lob/lob-typescript-sdk';
import lettersApi from '@/lib/lob';
import { sendDownloadEmail, sendMailingConfirmationEmail } from '@/lib/emails';
import Stripe from 'stripe';

/**
 * Parse a freeform address string into components.
 */
function parseAddress(address: string) {
  const fallback = { line1: address, line2: '', city: '', state: '', zip: '' };
  if (!address) return fallback;
  const m = address.match(/,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (!m) return fallback;
  const state = m[1].toUpperCase();
  const zip = m[2];
  const before = address.slice(0, m.index).trim().replace(/,$/, '').trim();
  const parts = before.split(',').map((p) => p.trim());
  if (parts.length >= 3) return { line1: parts[0], line2: parts[1], city: parts.slice(2).join(', '), state, zip };
  if (parts.length === 2) return { line1: parts[0], line2: '', city: parts[1], state, zip };
  return { line1: parts[0], line2: '', city: '', state, zip };
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      console.warn('Webhook received without signature');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email || session.customer_email || '';
      const payloadId = session.metadata?.payload_id;
      const orderType = session.metadata?.type; // 'debt_letter', 'debt_letter_mail', or 'share_mail'
      const amountTotal = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

      console.log(
        `Payment completed: ${session.id}, amount: ${amountTotal}, type: ${orderType}, email: ${customerEmail}`
      );

      if (!payloadId) {
        console.error('[WEBHOOK] No payload_id in session metadata');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Try Stripe metadata first (production-safe), then session store fallback
      let payload = decodePayloadFromMetadata(
        session.metadata as Record<string, string>
      );
      if (!payload) {
        payload = (await getSession(payloadId)) || null;
      }
      if (!payload) {
        console.error(`[WEBHOOK] Could not retrieve payload: ${payloadId}`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // ── DOWNLOAD-ONLY ORDER ($20) ──
      // Send the letter files via email with certified mail instructions
      if (orderType === 'debt_letter' && customerEmail) {
        try {
          await sendDownloadEmail(customerEmail, payload);
        } catch (emailErr) {
          console.error(`[EMAIL] Failed to send download email to ${customerEmail}:`, emailErr);
        }
      }

      // ── MAIL-FOR-ME ORDER ($30.99 full / $10.99 share) ──
      // Trigger Lob mailing, then email the tracking number + receipt
      if (orderType === 'debt_letter_mail' || orderType === 'share_mail') {
        const { extractedData, userInfo } = payload;

        try {
          const letterHtml = generateLetterHtml(payload);
          const collectorAddr = parseAddress(extractedData.collectorAddress);

          const letterData = new LetterEditable({
            description: `DebtStrike - ${userInfo.fullName} to ${extractedData.collectorName}`,
            to: {
              name: extractedData.collectorName,
              address_line1: collectorAddr.line1,
              address_line2: collectorAddr.line2 || undefined,
              address_city: collectorAddr.city,
              address_state: collectorAddr.state,
              address_zip: collectorAddr.zip,
              address_country: 'US',
            },
            from: {
              name: userInfo.fullName,
              address_line1: userInfo.streetAddress,
              address_city: userInfo.city,
              address_state: userInfo.state,
              address_zip: userInfo.zip,
              address_country: 'US',
            },
            file: letterHtml,
            color: false,
            extra_service: LetterEditableExtraServiceEnum.CertifiedReturnReceipt,
            use_type: 'operational',
            metadata: {
              source: 'debtstrike',
              payload_id: payloadId,
              stripe_session: session.id,
            },
          });

          const lobResponse = await lettersApi.create(letterData);
          const trackingNumber = lobResponse?.tracking_number || '';
          console.log(
            `[MAIL] Letter created. Lob ID: ${lobResponse?.id}, Tracking: ${trackingNumber}`
          );

          // Send receipt + tracking number email
          if (customerEmail && trackingNumber) {
            try {
              const isShareOrder = orderType === 'share_mail';
              await sendMailingConfirmationEmail(customerEmail, payload, trackingNumber, amountTotal, isShareOrder);
            } catch (emailErr) {
              console.error(`[EMAIL] Failed to send mailing confirmation to ${customerEmail}:`, emailErr);
            }
          }
        } catch (lobError) {
          console.error(`[MAIL] Lob API error for payload ${payloadId}:`, lobError);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
