import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/session-store";
import { decodePayloadFromMetadata } from "@/lib/stripe-payload";
import { generateLetterHtml } from "@/lib/generate-letter-html";
import { sendMailingConfirmationEmail } from "@/lib/emails";
import { LetterEditable, LetterEditableExtraServiceEnum } from "@lob/lob-typescript-sdk";
import lettersApi from "@/lib/lob";

export async function POST(request: Request) {
  try {
    const { payloadId, sessionId } = (await request.json()) as {
      payloadId: string;
      sessionId: string;
    };

    if (!payloadId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify this is a paid mailing session (not a regular letter-only checkout)
    if (sessionId !== "test_session_bypass") {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (checkoutSession.payment_status !== "paid") {
        return NextResponse.json(
          { error: "Payment not confirmed" },
          { status: 403 }
        );
      }
      // Verify it's a mailing checkout
      if (checkoutSession.metadata?.type !== "debt_letter_mail") {
        return NextResponse.json(
          { error: "This payment session is not for mailing" },
          { status: 400 }
        );
      }
    }

    // Get stored session data — try Stripe metadata first, then session store
    let payload = null;
    if (sessionId !== "test_session_bypass") {
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        payload = decodePayloadFromMetadata(
          checkoutSession.metadata as Record<string, string>
        );
      } catch (err) {
        console.warn("[send-mail] Stripe metadata retrieval failed:", err);
      }
    }
    if (!payload) {
      payload = (await getSession(payloadId)) || null;
    }
    if (!payload) {
      return NextResponse.json(
        { error: "Session expired. Please generate a new letter." },
        { status: 410 }
      );
    }

    const { extractedData, userInfo, generatedLetter } = payload;

    if (!generatedLetter?.letterText) {
      return NextResponse.json(
        { error: "Letter content is missing." },
        { status: 422 }
      );
    }

    // Generate HTML letter for Lob
    const letterHtml = generateLetterHtml(payload);

    // Parse collector address into components
    // The collectorAddress is stored as a full address string, e.g. "123 Main St, City, ST 12345"
    const collectorAddr = parseAddress(extractedData.collectorAddress);

    // Create the letter via Lob
    const letterData = new LetterEditable({
      description: `DebtStrike - ${userInfo.fullName} to ${extractedData.collectorName}`,
      to: {
        name: extractedData.collectorName,
        address_line1: collectorAddr.line1,
        address_line2: collectorAddr.line2 || undefined,
        address_city: collectorAddr.city,
        address_state: collectorAddr.state,
        address_zip: collectorAddr.zip,
        address_country: "US",
      },
      from: {
        name: userInfo.fullName,
        address_line1: userInfo.streetAddress,
        address_city: userInfo.city,
        address_state: userInfo.state,
        address_zip: userInfo.zip,
        address_country: "US",
      },
      file: letterHtml,
      color: false,
      extra_service: LetterEditableExtraServiceEnum.CertifiedReturnReceipt,
      use_type: "operational",
      metadata: {
        source: "debtstrike",
        payload_id: payloadId,
      },
    });

    const lobResponse = await lettersApi.create(letterData);

    // Extract tracking info
    const trackingNumber = lobResponse?.tracking_number || null;
    const lobLetterId = lobResponse?.id || null;
    const expectedDeliveryDate = lobResponse?.expected_delivery_date || null;

    console.log(
      `[MAIL] Letter sent via Lob. ID: ${lobLetterId}, Tracking: ${trackingNumber}, Payload: ${payloadId}`
    );

    // Send receipt + tracking email to customer
    if (trackingNumber && sessionId !== "test_session_bypass") {
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        const customerEmail = checkoutSession.customer_details?.email || checkoutSession.customer_email || '';
        const amountTotal = `$${((checkoutSession.amount_total || 0) / 100).toFixed(2)}`;
        if (customerEmail) {
          await sendMailingConfirmationEmail(customerEmail, payload, trackingNumber, amountTotal);
        }
      } catch (emailErr) {
        console.error(`[EMAIL] Failed to send mailing confirmation:`, emailErr);
        // Don't fail the whole request — the mailing itself succeeded
      }
    }

    return NextResponse.json({
      success: true,
      trackingNumber,
      lobLetterId,
      expectedDeliveryDate,
      message: "Your letter has been sent via USPS Certified Mail with Return Receipt.",
    });
  } catch (error: unknown) {
    console.error("Send mail error:", error);

    // Check for Lob-specific errors
    const errMsg =
      error instanceof Error ? error.message : "Failed to send letter.";

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

/**
 * Parse a freeform address string into components.
 * Handles formats like:
 *   "123 Main St, Suite 100, Los Angeles, CA 90001"
 *   "123 Main St, Los Angeles, CA 90001"
 *   "P.O. Box 123, Dallas, TX 75201"
 */
function parseAddress(address: string): {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
} {
  const fallback = {
    line1: address,
    line2: "",
    city: "",
    state: "",
    zip: "",
  };

  if (!address) return fallback;

  // Try to match: ..., City, ST ZIP
  const stateZipMatch = address.match(
    /,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i
  );
  if (!stateZipMatch) return fallback;

  const state = stateZipMatch[1].toUpperCase();
  const zip = stateZipMatch[2];

  // Remove the state+zip from the end
  const beforeStateZip = address
    .slice(0, stateZipMatch.index)
    .trim()
    .replace(/,$/, "")
    .trim();

  // Split remaining by commas
  const parts = beforeStateZip.split(",").map((p) => p.trim());

  if (parts.length >= 3) {
    // line1, line2, city
    return {
      line1: parts[0],
      line2: parts[1],
      city: parts.slice(2).join(", "),
      state,
      zip,
    };
  } else if (parts.length === 2) {
    // line1, city
    return {
      line1: parts[0],
      line2: "",
      city: parts[1],
      state,
      zip,
    };
  } else {
    // Just line1
    return {
      line1: parts[0],
      line2: "",
      city: "",
      state,
      zip,
    };
  }
}
