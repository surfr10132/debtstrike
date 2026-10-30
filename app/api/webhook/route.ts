import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSession } from '@/lib/session-store';
import {
  buildInitialFulfillmentRecord,
  getFulfillment,
  OrderType,
  saveFulfillment,
} from '@/lib/fulfillment-store';
import { generateLetterHtml } from '@/lib/generate-letter-html';
import { LetterEditable, LetterEditableExtraServiceEnum } from '@lob/lob-typescript-sdk';
import lettersApi from '@/lib/lob';
import {
  sendDownloadEmail,
  sendMailingConfirmationEmail,
  sendMailingExpectationsFollowupEmail,
  sendMailingFailureAlert,
  sendOrderConfirmationEmail,
} from '@/lib/emails';
import {
  finalizeClientDropboxFolder,
  syncClientRecordToGoogleSheet,
} from '@/lib/client-record-sync';
import Stripe from 'stripe';

const FOLLOWUP_EMAIL_TEST_MODE = process.env.DEBTSTRIKE_TEST_MODE === 'true';
// When a Lob webhook is configured, the "letter mailed" email is sent from
// /api/lob-webhook when USPS actually has the letter. Otherwise it's sent here
// as soon as Lob accepts the letter.
const LOB_WEBHOOK_ENABLED = !!process.env.LOB_WEBHOOK_SECRET;

function lobMeta(value: string | undefined | null): string {
  return String(value ?? '').slice(0, 450);
}

function calculateResponseReminderDueDate(expectedDeliveryDate?: string) {
  const baseDate =
    expectedDeliveryDate && !Number.isNaN(Date.parse(expectedDeliveryDate))
      ? new Date(expectedDeliveryDate)
      : new Date();
  baseDate.setUTCDate(baseDate.getUTCDate() + 30);
  return baseDate.toISOString();
}

/**
 * Parse a freeform address string into components.
 */
function parseAddress(address: string, recipientName?: string) {
  const fallback = { line1: address, line2: '', city: '', state: '', zip: '' };
  if (!address) return fallback;
  // Normalize: newlines -> commas, strip periods after state codes, collapse whitespace
  let lines = address
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  // Drop a leading line that is just the recipient's name (it goes in the "name" field)
  if (
    recipientName &&
    lines.length > 1 &&
    lines[0].toLowerCase().replace(/[^a-z0-9]/g, '') ===
      recipientName.toLowerCase().replace(/[^a-z0-9]/g, '')
  ) {
    lines = lines.slice(1);
  }
  const normalized = lines
    .join(', ')
    .replace(/\b([A-Z]{2})\.\s*(\d{5})/i, '$1 $2')
    .replace(/\bP\.?\s*O\.?\s*(Box\s*)?(\d)/i, 'PO Box $2')
    .replace(/\s+/g, ' ')
    .trim();
  const m = normalized.match(/,?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (!m) return { ...fallback, line1: normalized };
  const state = m[1].toUpperCase();
  const zip = m[2];
  const before = normalized.slice(0, m.index).trim().replace(/,$/, '').trim();
  let parts = before.split(',').map((p) => p.trim()).filter(Boolean);
  // Strip leading segments that are just the recipient's name (e.g. "Unifin", "Inc.")
  if (recipientName) {
    const key = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameKey = key(recipientName);
    let consumed = '';
    let i = 0;
    while (i < parts.length - 1 && nameKey.startsWith(consumed + key(parts[i])) && key(parts[i])) {
      consumed += key(parts[i]);
      i++;
    }
    if (i > 0 && consumed === nameKey) parts = parts.slice(i);
  }
  if (parts.length >= 3) return { line1: parts[0], line2: parts.slice(1, -1).join(', '), city: parts[parts.length - 1], state, zip };
  if (parts.length === 2) return { line1: parts[0], line2: '', city: parts[1], state, zip };
  // "123 Main St Springfield" with no comma: can't safely split city
  return { line1: parts[0] || '', line2: '', city: '', state, zip };
}
function toOrderType(input: string | undefined): OrderType | undefined {
  if (
    input === 'debt_letter' ||
    input === 'debt_letter_mail' ||
    input === 'share_mail'
  ) {
    return input;
  }
  return undefined;
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
      event = getStripe().webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ received: true }, { status: 200 });
    }
    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email || session.customer_email || '';
    const payloadId = session.metadata?.payload_id;
    const orderType = toOrderType(session.metadata?.type);
    const amountTotal = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

    console.log(
      `Payment completed: ${session.id}, amount: ${amountTotal}, type: ${orderType ?? 'unknown'}, email: ${customerEmail}`
    );

    if (!payloadId || !orderType) {
      console.error('[WEBHOOK] Missing or invalid metadata for fulfillment');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const isMailOrder = orderType === 'debt_letter_mail' || orderType === 'share_mail';
    const isShareOrder = orderType === 'share_mail';

    let record = await getFulfillment(session.id);
    if (!record) {
      record = buildInitialFulfillmentRecord({
        sessionId: session.id,
        payloadId,
        orderType,
      });
      await saveFulfillment(record);
    }

    const payload = await getSession(payloadId);
    if (!payload) {
      record.lastError = 'Session payload expired before fulfillment could complete.';
      if (isMailOrder) {
        record.mailingStatus = 'failed';
      }
      await saveFulfillment(record);
      console.error(`[WEBHOOK] Could not retrieve payload: ${payloadId}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const previousCustomerEmail = record.customerEmail;
    const previousConsumerName = record.consumerName;
    const previousCollectorName = record.collectorName;
    if (customerEmail) {
      record.customerEmail = customerEmail;
    }
    if (payload.userInfo.fullName) {
      record.consumerName = payload.userInfo.fullName;
    }
    if (payload.extractedData.collectorName) {
      record.collectorName = payload.extractedData.collectorName;
    }
    if (
      previousCustomerEmail !== record.customerEmail ||
      previousConsumerName !== record.consumerName ||
      previousCollectorName !== record.collectorName
    ) {
      await saveFulfillment(record);
    }

    // ── DOWNLOAD-ONLY ORDER ($20) ──
    if (orderType === 'debt_letter' && customerEmail && !record.downloadEmailSent) {
      try {
        await sendDownloadEmail(customerEmail, payload);
        record.downloadEmailSent = true;
        record.lastError = undefined;
      } catch (emailErr) {
        record.lastError = 'Download email failed to send.';
        console.error(`[EMAIL] Failed to send download email to ${customerEmail}:`, emailErr);
      }
      await saveFulfillment(record);
    }

    // ── MAIL-FOR-ME ORDERS ($30.99 full / $10.99 share) ──
    if (isMailOrder) {
      // Email 1: order confirmation (sent before mailing so the customer
      // always hears from us, even if mailing fails)
      if (customerEmail && !record.orderConfirmationEmailSent) {
        try {
          await sendOrderConfirmationEmail(
            customerEmail,
            payload,
            amountTotal,
            isShareOrder,
            session.id
          );
          record.orderConfirmationEmailSent = true;
        } catch (emailErr) {
          console.error(
            `[EMAIL] Failed to send order confirmation to ${customerEmail}:`,
            emailErr
          );
        }
        await saveFulfillment(record);
      }

      const currentlyProcessing = record.mailingStatus === 'processing';
      const processedRecently =
        !Number.isNaN(Date.parse(record.updatedAt)) &&
        Date.now() - Date.parse(record.updatedAt) < 10 * 60 * 1000;

      if (record.mailingStatus !== 'submitted' && !(currentlyProcessing && processedRecently)) {
        record.mailingStatus = 'processing';
        record.lastError = undefined;
        await saveFulfillment(record);

        const { extractedData, userInfo } = payload;

        try {
          const letterHtml = generateLetterHtml(payload);
          const collectorAddr = parseAddress(extractedData.collectorAddress, extractedData.collectorName);

          if (!collectorAddr.line1 || !collectorAddr.city || !collectorAddr.state || !collectorAddr.zip) {
            throw new Error(`Collector address could not be parsed: ${JSON.stringify(extractedData.collectorAddress)}`);
          }

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
            address_placement: 'insert_blank_page',
            metadata: {
              source: 'debtstrike',
              payload_id: payloadId,
              stripe_session: session.id,
              customer_email: lobMeta(customerEmail),
              customer_name: lobMeta(userInfo.fullName),
              collector_name: lobMeta(extractedData.collectorName),
              account_number: lobMeta(extractedData.accountNumber),
              amount_claimed: lobMeta(extractedData.amountClaimed),
            },
          });

          const lobResponse = await lettersApi.create(letterData);
          record.mailingStatus = 'submitted';
          record.trackingNumber = lobResponse?.tracking_number || undefined;
          record.lobLetterId = lobResponse?.id || undefined;
          record.expectedDeliveryDate = lobResponse?.expected_delivery_date || undefined;
          record.responseReminderDueAt = calculateResponseReminderDueDate(
            record.expectedDeliveryDate
          );
          record.responseReminderSentAt = undefined;
          record.lastError = undefined;

          console.log(
            `[MAIL] Letter created. Lob ID: ${record.lobLetterId}, Tracking: ${record.trackingNumber || 'N/A'}`
          );
        } catch (lobError) {
          record.mailingStatus = 'failed';
          record.lastError =
            lobError instanceof Error ? lobError.message : 'Unknown Lob submission error.';
          console.error(`[MAIL] Lob API error for payload ${payloadId}:`, lobError);
          if (!record.failureAlertSent) {
            await sendMailingFailureAlert({
              customerName: userInfo.fullName,
              customerEmail,
              collectorName: extractedData.collectorName,
              stripeSessionId: session.id,
              payloadId,
              error: record.lastError || 'Unknown error',
            });
            record.failureAlertSent = true;
          }
        }

        await saveFulfillment(record);
      }

      // Email 2: letter mailed + tracking. With a Lob webhook configured this
      // is sent from /api/lob-webhook when USPS has the letter instead.
      if (
        !LOB_WEBHOOK_ENABLED &&
        customerEmail &&
        record.mailingStatus === 'submitted' &&
        record.trackingNumber &&
        !record.confirmationEmailSent
      ) {
        try {
          await sendMailingConfirmationEmail({
            customerEmail,
            fullName: payload.userInfo.fullName,
            collectorName: payload.extractedData.collectorName,
            accountNumber: payload.extractedData.accountNumber,
            amountClaimed: payload.extractedData.amountClaimed,
            trackingNumber: record.trackingNumber,
            expectedDeliveryDate: record.expectedDeliveryDate,
            lobLetterId: record.lobLetterId,
          });
          record.confirmationEmailSent = true;
          record.lastError = undefined;
        } catch (emailErr) {
          record.lastError = 'Mailing confirmation email failed to send.';
          console.error(
            `[EMAIL] Failed to send mailing confirmation to ${customerEmail}:`,
            emailErr
          );
        }
        await saveFulfillment(record);
      }

      if (
        FOLLOWUP_EMAIL_TEST_MODE &&
        customerEmail &&
        record.mailingStatus === 'submitted' &&
        record.trackingNumber &&
        record.confirmationEmailSent &&
        !record.followupEmailSent
      ) {
        try {
          await sendMailingExpectationsFollowupEmail(
            customerEmail,
            payload,
            record.trackingNumber
          );
          record.followupEmailSent = true;
          record.lastError = undefined;
        } catch (emailErr) {
          record.lastError = 'Mailing follow-up email failed to send.';
          console.error(
            `[EMAIL] Failed to send mailing follow-up to ${customerEmail}:`,
            emailErr
          );
        }
        await saveFulfillment(record);
      }
    }

    const dropboxFolderPath = await finalizeClientDropboxFolder({
      payloadId,
      payload,
    });
    const sheetMailingStatus = isMailOrder
      ? record.mailingStatus || 'pending'
      : 'paid_download';
    await syncClientRecordToGoogleSheet(payload, {
      payloadId,
      stripeSessionId: session.id,
      orderType,
      mailingStatus: sheetMailingStatus,
      trackingNumber: record.trackingNumber,
      lobLetterId: record.lobLetterId,
      expectedDeliveryDate: record.expectedDeliveryDate,
      lastError: record.lastError || '',
      dropboxFolderPath,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
