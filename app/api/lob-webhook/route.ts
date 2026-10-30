import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { sendMailingConfirmationEmail } from '@/lib/emails';

/**
 * Lob webhook — sends the customer the "your letter has been mailed" email
 * (with USPS tracking) once USPS has the letter.
 *
 * Setup (Lob dashboard → Webhooks):
 *   URL:    https://debtstrike.io/api/lob-webhook
 *   Events: letter.mailed, letter.certified.mailed
 *   Copy the webhook secret into Vercel env as LOB_WEBHOOK_SECRET.
 *
 * Both events can fire for a certified letter; the email uses a Resend
 * idempotency key per Lob letter ID so the customer only gets one.
 */

const MAILED_EVENTS = new Set(['letter.mailed', 'letter.certified.mailed']);
const MAX_SKEW_MS = 5 * 60 * 1000;

function verifySignature(body: string, timestamp: string | null, signature: string | null, secret: string) {
  if (!timestamp || !signature) return false;
  const tsMs = Number(timestamp) > 1e12 ? Number(timestamp) : Date.parse(timestamp);
  if (Number.isFinite(tsMs) && Math.abs(Date.now() - tsMs) > MAX_SKEW_MS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

interface LobLetter {
  id?: string;
  tracking_number?: string | null;
  expected_delivery_date?: string | null;
  metadata?: Record<string, string>;
}

export async function POST(request: Request) {
  const secret = process.env.LOB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[LOB-WEBHOOK] LOB_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const body = await request.text();
  if (
    !verifySignature(
      body,
      request.headers.get('lob-signature-timestamp'),
      request.headers.get('lob-signature'),
      secret
    )
  ) {
    console.warn('[LOB-WEBHOOK] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event_type?: { id?: string }; body?: LobLetter };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event.event_type?.id || '';
  const letter = event.body || {};
  const meta = letter.metadata || {};

  if (!MAILED_EVENTS.has(eventType) || meta.source !== 'debtstrike') {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (!meta.customer_email || !letter.tracking_number) {
    console.warn(
      `[LOB-WEBHOOK] ${eventType} for ${letter.id} missing customer_email or tracking number — skipping email`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    await sendMailingConfirmationEmail({
      customerEmail: meta.customer_email,
      fullName: meta.customer_name || 'there',
      collectorName: meta.collector_name || 'the collector',
      accountNumber: meta.account_number || undefined,
      amountClaimed: meta.amount_claimed || undefined,
      trackingNumber: letter.tracking_number,
      expectedDeliveryDate: letter.expected_delivery_date,
      lobLetterId: letter.id,
    });
  } catch (err) {
    console.error(`[LOB-WEBHOOK] Failed to send mailed email for ${letter.id}:`, err);
    // 500 so Lob retries
    return NextResponse.json({ error: 'Email failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
