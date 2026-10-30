import { resend, isEmailConfigured } from "./resend";
import { SessionPayload } from "./types";
import { generatePdf } from "./generate-pdf";
import { generateDocx } from "./generate-docx";

const FROM_EMAIL = "DebtStrike.io <noreply@debtstrike.io>";
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "jason@robenzlaw.com";

function checkEmail() {
  if (!isEmailConfigured) {
    console.warn("[EMAIL] Resend API key not configured ‚Äî skipping email send");
    return false;
  }
  return true;
}

/**
 * Email #1: Download-only customer ($20)
 * Delivers the letter (DOCX + PDF) via email with certified mail instructions
 * and a "we'll mail it for you" upsell CTA.
 */
export async function sendDownloadEmail(
  customerEmail: string,
  payload: SessionPayload
): Promise<void> {
  if (!checkEmail()) return;

  const { userInfo, extractedData } = payload;

  // Generate both file formats
  const pdfBytes = await generatePdf(payload);
  const docxBuffer = await generateDocx(payload);

  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const docxBase64 = Buffer.from(docxBuffer).toString("base64");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://debtstrike.io";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `Your letter to ${extractedData.collectorName} is ready ‚Äî here's your next move`,
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 32px;">

  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #00ff41;">DEBTSTRIKE</span><span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #ff3333;">.IO</span>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 15px;">Hi ${userInfo.fullName},</p>
    <p style="margin: 0 0 16px; font-size: 15px;">Your debt validation and cease &amp; desist letter is attached. You've got two copies ‚Äî a Word doc you can edit and sign by hand, and a PDF with a signature already on it. Either one works.</p>
    <p style="margin: 0 0 8px; font-size: 15px;"><strong>Collector:</strong> ${extractedData.collectorName}</p>
    <p style="margin: 0 0 8px; font-size: 15px;"><strong>Account:</strong> ${extractedData.accountNumber || "As referenced"}</p>
    <p style="margin: 0 0 16px; font-size: 15px;"><strong>Amount claimed:</strong> ${extractedData.amountClaimed || "As stated"}</p>
  </div>

  <!-- TIME-SENSITIVE: Mail it NOW -->
  <div style="border: 2px solid #ff3333; padding: 24px; margin-bottom: 24px; background: rgba(255,51,51,0.05);">
    <div style="font-family: monospace; font-size: 12px; color: #ff3333; letter-spacing: 2px; font-weight: bold; margin-bottom: 12px;">‚ö† DON'T SIT ON THIS</div>
    <p style="margin: 0 0 12px; font-size: 15px; color: #ffffff;">Under the FDCPA, you have <strong>30 days from when you received the collector's letter</strong> to dispute the debt in writing. If you wait too long, the collector can assume the debt is valid and keep coming after you.</p>
    <p style="margin: 0 0 12px; font-size: 15px; font-weight: bold; color: #ffffff;">Mail this letter THIS WEEK. Here's how:</p>
    <ol style="margin: 0 0 16px; padding-left: 20px; font-size: 14px; line-height: 1.8;">
      <li>Print the letter (either version)</li>
      <li>Sign it if using the Word version</li>
      <li>Go to any USPS post office</li>
      <li>Ask for <strong>"Certified Mail with Return Receipt"</strong> (~$4-5)</li>
      <li><strong>KEEP THE RECEIPT ‚Äî that's your proof</strong></li>
    </ol>
    <div style="border: 2px solid #00ff41; padding: 16px; background: rgba(0,255,65,0.04);">
      <p style="margin: 0; font-size: 14px; color: #ffffff;"><strong>Why certified mail?</strong> Once the collector receives this letter, continued calls may violate federal law and can support <span style="color: #00ff41; font-weight: bold;">up to $1,000 in statutory damages per case</span>. The tracking receipt is your proof they got it. No receipt = no proof = no case.</p>
    </div>
  </div>

  <!-- UPSELL: We'll mail it for you -->
  <div style="border: 2px solid #00ff41; padding: 24px; margin-bottom: 24px; background: rgba(0,255,65,0.04); text-align: center;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 12px;">DON'T WANT TO GO TO THE POST OFFICE?</div>
    <p style="margin: 0 0 16px; font-size: 15px;">We'll print your letter and mail it via <strong>USPS Certified Mail with Return Receipt</strong> ‚Äî tracking number sent straight to your inbox. No trip to the post office.</p>
    <a href="${baseUrl}/generate" style="display: inline-block; padding: 14px 32px; background: #00ff41; color: #000; font-family: monospace; font-size: 14px; font-weight: bold; text-decoration: none; letter-spacing: 2px;">MAIL IT FOR ME ‚Äî $10.99</a>
    <p style="margin: 12px 0 0; font-size: 12px; color: #666;">Includes printing, USPS Certified Mail, electronic return receipt, and tracking.</p>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 16px;">WHAT HAPPENS AFTER YOU MAIL IT</div>
    <div style="margin-bottom: 12px; font-size: 14px;">
      <strong style="color: #00ff41;">Immediately after delivery</strong> — All phone calls from the collector must stop. If they call anyway, write down the date, time, and number. Continued calls may violate federal law and can support up to $1,000 in statutory damages per case.
    </div>
    <div style="margin-bottom: 12px; font-size: 14px;">
      <strong style="color: #00ff41;">Within 30 days</strong> ‚Äî They must send you proof the debt is real. If they can't, they have to stop collecting and remove it from your credit report.
    </div>
    <div style="font-size: 14px;">
      <strong style="color: #00ff41;">After 30 days with no response</strong> ‚Äî The debt is effectively dead. If they keep contacting you, a consumer protection attorney can sue them for you ‚Äî most take these cases for free on contingency.
    </div>
  </div>

  <!-- Social share CTA -->
  <div style="border: 1px solid #222; padding: 20px; margin-bottom: 24px; text-align: center;">
    <p style="margin: 0 0 8px; font-size: 14px; color: #ccc;">Know someone dealing with debt collectors?</p>
    <p style="margin: 0 0 12px; font-size: 14px; color: #ffffff;">Share DebtStrike so they know their rights too.</p>
    <a href="https://twitter.com/intent/tweet?text=I%20just%20used%20debtstrike.io%20to%20send%20a%20cease%20%26%20desist%20to%20a%20debt%20collector.%20If%20you%27re%20getting%20harassed%20over%20a%20debt%2C%20check%20it%20out.%20%40debtstrikeusa&url=https%3A%2F%2Fdebtstrike.io" style="display: inline-block; padding: 10px 24px; border: 1px solid #00ff41; color: #00ff41; font-family: monospace; font-size: 12px; font-weight: bold; text-decoration: none; letter-spacing: 1px; margin: 0 4px;">SHARE ON X</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdebtstrike.io" style="display: inline-block; padding: 10px 24px; border: 1px solid #00ff41; color: #00ff41; font-family: monospace; font-size: 12px; font-weight: bold; text-decoration: none; letter-spacing: 1px; margin: 0 4px;">SHARE ON FB</a>
  </div>

  <div style="text-align: center; padding: 16px; font-size: 12px; color: #666;">
    <p style="margin: 0 0 8px;">Questions? Reply to this email or contact <a href="mailto:info@debtstrike.io" style="color: #00ff41;">info@debtstrike.io</a></p>
    <p style="margin: 0 0 8px; font-size: 11px; color: #555;">Follow us: <a href="https://instagram.com/debtstrikeusa" style="color: #00ff41;">@debtstrikeusa</a></p>
    <p style="margin: 0; font-size: 11px; color: #444;">DebtStrike.io is not a law firm and does not provide legal advice.</p>
  </div>
</div>
    `,
    attachments: [
      {
        filename: `DebtStrike-Letter-${userInfo.fullName.replace(/\s+/g, "-")}.pdf`,
        content: pdfBase64,
        contentType: "application/pdf",
      },
      {
        filename: `DebtStrike-Letter-${userInfo.fullName.replace(/\s+/g, "-")}.docx`,
        content: docxBase64,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    ],
  });

  console.log(`[EMAIL] Download email sent to ${customerEmail}`);
}

const BRAND_HEADER = `
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #00ff41;">DEBTSTRIKE</span><span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #ff3333;">.IO</span>
  </div>`;

const EMAIL_FOOTER = `
  <div style="text-align: center; padding: 16px; font-size: 12px; color: #666;">
    <p style="margin: 0 0 8px;">Questions? Reply to this email or contact <a href="mailto:info@debtstrike.io" style="color: #00ff41;">info@debtstrike.io</a></p>
    <p style="margin: 0 0 8px; font-size: 11px; color: #555;">Follow us: <a href="https://instagram.com/debtstrikeusa" style="color: #00ff41;">@debtstrikeusa</a></p>
    <p style="margin: 0; font-size: 11px; color: #444;">DebtStrike.io is not a law firm and does not provide legal advice.</p>
  </div>`;

function esc(value: string | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * Email #2a: Mail-for-me ORDER CONFIRMATION — sent immediately after payment.
 * Receipt + what happens next. Tracking comes in a separate email once USPS has it.
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  payload: SessionPayload,
  amountPaid: string,
  isShareOrder = false,
  orderId?: string
): Promise<void> {
  if (!checkEmail()) return;

  const { userInfo, extractedData } = payload;

  const receiptRows = isShareOrder
    ? `<tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #222;">USPS Certified Mail + Return Receipt</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #222; text-align: right;">$10.99</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #222; color: #00ff41;">Debt Validation Letter (unlocked via social share)</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #222; text-align: right; color: #00ff41;">FREE</td>
      </tr>`
    : `<tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #222;">Debt Validation Letter</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #222; text-align: right;">$20.00</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #222;">USPS Certified Mail + Return Receipt</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #222; text-align: right;">$10.99</td>
      </tr>`;

  await resend.emails.send(
    {
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Order confirmed — your letter to ${extractedData.collectorName || "the collector"} is being prepared`,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 32px;">
${BRAND_HEADER}

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 15px;">Hi ${esc(userInfo.fullName)},</p>
    <p style="margin: 0 0 16px; font-size: 15px;">We received your order. Your debt validation letter to <strong>${esc(extractedData.collectorName)}</strong> is being printed and will go out by <strong>USPS Certified Mail with Return Receipt</strong>.</p>
    <p style="margin: 0; font-size: 15px;">You'll get a second email with your <strong>USPS tracking number</strong> as soon as it's mailed — usually within 1–2 business days.</p>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 16px;">RECEIPT</div>
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      ${receiptRows}
      <tr>
        <td style="padding: 12px 0; font-weight: bold; color: #ffffff;">Total Paid</td>
        <td style="padding: 12px 0; font-weight: bold; color: #00ff41; text-align: right;">${esc(amountPaid)}</td>
      </tr>
    </table>
    <div style="margin-top: 12px; font-size: 13px; color: #888;">
      <p style="margin: 0 0 4px;"><strong>Collector:</strong> ${esc(extractedData.collectorName)}</p>
      <p style="margin: 0 0 4px;"><strong>Account:</strong> ${esc(extractedData.accountNumber || "As referenced")}</p>
      <p style="margin: 0 0 4px;"><strong>Amount disputed:</strong> ${esc(extractedData.amountClaimed || "As stated")}</p>
      ${orderId ? `<p style="margin: 0;"><strong>Order #:</strong> ${esc(orderId.slice(-10).toUpperCase())}</p>` : ""}
    </div>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 12px;">UNTIL IT'S DELIVERED</div>
    <p style="margin: 0 0 8px; font-size: 14px;">Don't call the collector or agree to any payment. If they call you, write down the date, time, and number.</p>
    <p style="margin: 0; font-size: 14px;">Keep any letters they send you.</p>
  </div>
${EMAIL_FOOTER}
</div>
      `,
    },
    orderId ? { idempotencyKey: `order-confirmation-${orderId}` } : undefined
  );

  console.log(`[EMAIL] Order confirmation sent to ${customerEmail}`);
}

export interface MailedEmailParams {
  customerEmail: string;
  fullName: string;
  collectorName: string;
  accountNumber?: string;
  amountClaimed?: string;
  trackingNumber: string;
  expectedDeliveryDate?: string | null;
  lobLetterId?: string;
}

/**
 * Email #2b: Mail-for-me LETTER MAILED — sent when USPS has the letter.
 * Triggered by the Lob webhook (letter.mailed / letter.certified.mailed),
 * or at Lob submission when LOB_WEBHOOK_SECRET isn't configured.
 */
export async function sendMailingConfirmationEmail(params: MailedEmailParams): Promise<void> {
  if (!checkEmail()) return;

  const { customerEmail, fullName, collectorName, accountNumber, amountClaimed, trackingNumber, expectedDeliveryDate, lobLetterId } = params;
  const tn = trackingNumber.replace(/\s+/g, "");
  const tnDisplay = tn.replace(/(.{4})/g, "$1 ").trim();
  const eta = formatDate(expectedDeliveryDate);

  await resend.emails.send(
    {
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Your letter has been mailed — USPS tracking #${tn}`,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 32px;">
${BRAND_HEADER}

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 15px;">Hi ${esc(fullName)},</p>
    <p style="margin: 0; font-size: 15px;">Your letter to <strong>${esc(collectorName)}</strong> has been mailed by <strong>USPS Certified Mail with Return Receipt</strong>.${eta ? ` Expected delivery: <strong>${esc(eta)}</strong>.` : ""}</p>
  </div>

  <div style="border: 2px solid #00ff41; padding: 24px; margin-bottom: 24px; background: rgba(0,255,65,0.04); text-align: center;">
    <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 2px; margin-bottom: 8px;">USPS TRACKING NUMBER</div>
    <div style="font-family: monospace; font-size: 20px; font-weight: bold; color: #00ff41; letter-spacing: 1px; margin-bottom: 12px;">${esc(tnDisplay)}</div>
    <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tn)}" style="font-size: 13px; color: #00ff41; text-decoration: underline;">Track on USPS.com →</a>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #222;">
      <p style="margin: 0; font-size: 14px; font-weight: bold; color: #ffffff;">Save this tracking number. It's your proof of delivery.</p>
    </div>
    <div style="margin-top: 12px; font-size: 13px; color: #888;">
      ${accountNumber ? `Account: ${esc(accountNumber)}` : ""}${accountNumber && amountClaimed ? " · " : ""}${amountClaimed ? `Amount disputed: ${esc(amountClaimed)}` : ""}
    </div>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 16px;">WHAT HAPPENS NOW</div>

    <div style="margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #00ff41;">
      <div style="font-family: monospace; font-size: 11px; color: #00ff41; letter-spacing: 1px; margin-bottom: 4px;">WHEN TRACKING SAYS "DELIVERED"</div>
      <p style="margin: 0; font-size: 14px;">Note the delivery date. Your letter told the collector to stop calling. If they call after delivery, write down the date, time, and number — continued calls may violate federal law and can support up to $1,000 in statutory damages per case.</p>
    </div>

    <div style="margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #888;">
      <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 1px; margin-bottom: 4px;">WATCH YOUR MAILBOX</div>
      <p style="margin: 0; font-size: 14px;">If the collector responds, keep everything they send and compare names, balances, and account details carefully. If you disputed within 30 days of their first notice, they must stop collecting until they send you verification.</p>
    </div>

    <div style="padding-left: 16px; border-left: 3px solid #888;">
      <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 1px; margin-bottom: 4px;">IF THEY KEEP COLLECTING</div>
      <p style="margin: 0; font-size: 14px;">Don't pay or restart contact by phone. Keep your tracking number, call log, and any letters — a consumer protection attorney can review them, often at no cost to you.</p>
    </div>
  </div>
${EMAIL_FOOTER}
</div>
      `,
    },
    { idempotencyKey: `letter-mailed-${lobLetterId || tn}` }
  );

  console.log(`[EMAIL] Letter-mailed email sent to ${customerEmail} — tracking: ${tn}`);
}

/**
 * Internal alert to the owner when a paid mail order fails to go out.
 */
export async function sendMailingFailureAlert(params: {
  customerName: string;
  customerEmail: string;
  collectorName: string;
  stripeSessionId: string;
  payloadId: string;
  error: string;
}): Promise<void> {
  if (!checkEmail()) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `⚠️ DebtStrike mailing FAILED — ${params.customerName} vs ${params.collectorName}`,
      html: `
<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #c00; margin: 0 0 12px;">Paid mail order did not go out</h2>
  <p>The customer paid but the Lob submission failed. Mail it manually and send them tracking.</p>
  <table style="font-size: 14px; border-collapse: collapse;">
    <tr><td style="padding: 4px 12px 4px 0; color: #666;">Customer</td><td>${esc(params.customerName)} &lt;${esc(params.customerEmail)}&gt;</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #666;">Collector</td><td>${esc(params.collectorName)}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #666;">Stripe session</td><td style="font-family: monospace;">${esc(params.stripeSessionId)}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #666;">Payload ID</td><td style="font-family: monospace;">${esc(params.payloadId)}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #666; vertical-align: top;">Error</td><td style="font-family: monospace; color: #c00;">${esc(params.error)}</td></tr>
  </table>
</div>`,
    });
    console.log(`[EMAIL] Mailing failure alert sent to ${NOTIFICATION_EMAIL}`);
  } catch (err) {
    console.error("[EMAIL] Failed to send mailing failure alert:", err);
  }
}

/**
 * Email #3: Mail-for-me follow-up
 * Sends a plain-language breakdown of what to expect once USPS marks delivery.
 */
export async function sendMailingExpectationsFollowupEmail(
  customerEmail: string,
  payload: SessionPayload,
  trackingNumber: string
): Promise<void> {
  if (!checkEmail()) return;

  const { userInfo, extractedData } = payload;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: "What to expect next after your DebtStrike letter is delivered",
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 32px;">

  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #00ff41;">DEBTSTRIKE</span><span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #ff3333;">.IO</span>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 15px;">Hi ${userInfo.fullName},</p>
    <p style="margin: 0 0 16px; font-size: 15px;">Quick follow-up so you know exactly what to watch for after your letter to <strong>${extractedData.collectorName}</strong> is delivered.</p>
    <p style="margin: 0; font-size: 14px; color: #bbb;">Tracking number: <span style="font-family: monospace; color: #00ff41;">${trackingNumber}</span></p>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 16px;">WHAT TO EXPECT</div>

    <div style="margin-bottom: 14px; padding-left: 14px; border-left: 3px solid #00ff41;">
      <div style="font-family: monospace; font-size: 11px; color: #00ff41; letter-spacing: 1px; margin-bottom: 4px;">STEP 1 — WAIT FOR "DELIVERED"</div>
      <p style="margin: 0; font-size: 14px;">Use USPS tracking and note the delivery date. That date is your legal timeline anchor.</p>
    </div>

    <div style="margin-bottom: 14px; padding-left: 14px; border-left: 3px solid #00ff41;">
      <div style="font-family: monospace; font-size: 11px; color: #00ff41; letter-spacing: 1px; margin-bottom: 4px;">STEP 2 — DOCUMENT ANY CALLS AFTER DELIVERY</div>
      <p style="margin: 0; font-size: 14px;">If the collector calls after delivery, save the date, time, caller ID, and what was said. Continued collection calls may violate federal law and can support up to $1,000 in statutory damages per case.</p>
    </div>

    <div style="margin-bottom: 14px; padding-left: 14px; border-left: 3px solid #888;">
      <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 1px; margin-bottom: 4px;">STEP 3 — WATCH FOR A WRITTEN RESPONSE</div>
      <p style="margin: 0; font-size: 14px;">The collector should respond with debt validation documents. If they do, keep those records and compare names, balances, and account details carefully.</p>
    </div>

    <div style="padding-left: 14px; border-left: 3px solid #888;">
      <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 1px; margin-bottom: 4px;">STEP 4 — IF 30 DAYS PASS WITH NO VALIDATION</div>
      <p style="margin: 0; font-size: 14px;">If they fail to properly validate, do not agree to pay and do not restart communication by phone. Keep your proof package (tracking + any calls + any letters) in case you need to escalate.</p>
    </div>
  </div>

  <div style="border: 1px solid #222; padding: 20px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 10px;">KEEP THIS PROOF PACKAGE</div>
    <ul style="margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.7;">
      <li>USPS tracking number + delivery screenshot</li>
      <li>Any call logs/voicemails after delivery</li>
      <li>Any response letters from the collector</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 16px; font-size: 12px; color: #666;">
    <p style="margin: 0 0 8px;">Questions? Reply to this email or contact <a href="mailto:info@debtstrike.io" style="color: #00ff41;">info@debtstrike.io</a></p>
    <p style="margin: 0; font-size: 11px; color: #444;">DebtStrike.io is not a law firm and does not provide legal advice.</p>
  </div>
</div>
    `,
  });

  console.log(
    `[EMAIL] Mailing expectations follow-up sent to ${customerEmail} — tracking: ${trackingNumber}`
  );
}

export async function sendCollectorResponseReminderEmail(params: {
  customerEmail: string;
  consumerName: string;
  collectorName: string;
  payloadId: string;
}) {
  if (!checkEmail()) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://debtstrike.io";
  const uploadUrl = `${baseUrl}/upload-response?payload_id=${encodeURIComponent(
    params.payloadId
  )}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.customerEmail,
    subject: "30-day check-in: Did the collector respond?",
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 32px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #00ff41;">DEBTSTRIKE</span><span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #ff3333;">.IO</span>
  </div>
  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 20px;">
    <p style="margin: 0 0 14px; font-size: 15px;">Hi ${params.consumerName || "there"},</p>
    <p style="margin: 0 0 14px; font-size: 15px;">It’s been about 30 days since your DebtStrike letter went out to <strong>${params.collectorName || "the collector"}</strong>.</p>
    <p style="margin: 0; font-size: 15px;">If they responded, upload their letter and we’ll analyze it <strong>free of charge</strong> for potential FDCPA issues and draft a follow-up letter for you.</p>
  </div>
  <div style="text-align: center; margin-bottom: 20px;">
    <a href="${uploadUrl}" style="display: inline-block; padding: 14px 28px; background: #00ff41; color: #000; font-family: monospace; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-decoration: none;">UPLOAD COLLECTOR RESPONSE</a>
  </div>
  <div style="border: 1px solid #222; padding: 20px; margin-bottom: 20px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 10px;">WHY THIS MATTERS</div>
    <p style="margin: 0 0 10px; font-size: 14px;">A follow-up letter can force the collector or creditor to produce records they often cannot produce.</p>
    <p style="margin: 0; font-size: 14px;">If their response shows possible legal violations, we can flag your case for attorney referral.</p>
  </div>
  <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
    <p style="margin: 0;">DebtStrike.io is not a law firm and does not provide legal advice.</p>
  </div>
</div>
    `,
  });

  console.log(`[EMAIL] Collector response reminder sent to ${params.customerEmail}`);
}

export interface CollectorResponseLawsuitAlertPayload {
  payloadId: string;
  consumerName: string;
  consumerEmail: string;
  collectorName: string;
  analysisSummary: string;
  lawsuitReasoning: string;
  issueSummary: string;
}

export async function sendCollectorResponseLawsuitAlertEmail(
  payload: CollectorResponseLawsuitAlertPayload
) {
  if (!checkEmail()) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `Potential FDCPA lawsuit lead — ${payload.consumerName} vs ${payload.collectorName}`,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 24px;">
  <div style="font-family: monospace; font-size: 16px; color: #ff3333; font-weight: bold; margin-bottom: 16px;">POTENTIAL ATTORNEY REFERRAL ALERT</div>
  <div style="border: 1px solid #222; padding: 16px; margin-bottom: 14px;">
    <p style="margin: 0 0 8px;"><strong>Payload ID:</strong> ${payload.payloadId}</p>
    <p style="margin: 0 0 8px;"><strong>Consumer:</strong> ${payload.consumerName}</p>
    <p style="margin: 0 0 8px;"><strong>Email:</strong> ${payload.consumerEmail}</p>
    <p style="margin: 0;"><strong>Collector:</strong> ${payload.collectorName}</p>
  </div>
  <div style="border: 1px solid #222; padding: 16px; margin-bottom: 14px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; font-weight: bold; margin-bottom: 6px;">ANALYSIS SUMMARY</div>
    <p style="margin: 0; font-size: 14px;">${payload.analysisSummary}</p>
  </div>
  <div style="border: 1px solid #222; padding: 16px; margin-bottom: 14px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; font-weight: bold; margin-bottom: 6px;">LAWSUIT REASONING</div>
    <p style="margin: 0; font-size: 14px;">${payload.lawsuitReasoning}</p>
  </div>
  <div style="border: 1px solid #222; padding: 16px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; font-weight: bold; margin-bottom: 6px;">KEY ISSUES</div>
    <p style="margin: 0; font-size: 14px;">${payload.issueSummary}</p>
  </div>
</div>
      `,
    });
    console.log(
      `[EMAIL] Lawsuit alert sent to ${NOTIFICATION_EMAIL} for payload ${payload.payloadId}`
    );
  } catch (error) {
    console.error("[EMAIL] Failed to send lawsuit alert email:", error);
  }
}

/**
 * Internal notification: sent to Jason when any letter is generated.
 * Fire-and-forget — never blocks the user-facing response.
 */
export interface NotificationPayload {
  letterType: "Debt Strike" | "Credit Strike";
  consumerName: string;
  consumerCity: string;
  consumerState: string;
  collectorOrBureaus: string;
  itemCount?: number;
  timestamp: string;
}

export async function sendLetterNotification(
  payload: NotificationPayload
): Promise<void> {
  if (!checkEmail()) return;

  const {
    letterType,
    consumerName,
    consumerCity,
    consumerState,
    collectorOrBureaus,
    itemCount,
    timestamp,
  } = payload;

  const subjectLine =
    letterType === "Debt Strike"
      ? `New Debt Strike letter generated — ${consumerName} vs ${collectorOrBureaus}`
      : `New Credit Strike letters generated — ${consumerName} (${itemCount} items)`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: subjectLine,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 24px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 3px; color: #00ff41;">DEBTSTRIKE</span><span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #ff3333;">.IO</span>
    <span style="font-family: monospace; font-size: 12px; color: #888; display: block; margin-top: 4px;">LETTER GENERATED</span>
  </div>

  <div style="border: 1px solid #222; padding: 20px; margin-bottom: 16px;">
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #888; width: 120px;">Type</td>
        <td style="padding: 6px 0; color: ${letterType === "Debt Strike" ? "#ff3333" : "#00ff41"}; font-weight: bold;">${letterType}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888;">Consumer</td>
        <td style="padding: 6px 0; color: #fff;">${consumerName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888;">Location</td>
        <td style="padding: 6px 0; color: #fff;">${consumerCity}, ${consumerState}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888;">${letterType === "Debt Strike" ? "Collector" : "Bureaus"}</td>
        <td style="padding: 6px 0; color: #fff;">${collectorOrBureaus}</td>
      </tr>
      ${itemCount ? `<tr><td style="padding: 6px 0; color: #888;">Items disputed</td><td style="padding: 6px 0; color: #fff;">${itemCount}</td></tr>` : ""}
      <tr>
        <td style="padding: 6px 0; color: #888;">Generated</td>
        <td style="padding: 6px 0; color: #fff;">${timestamp}</td>
      </tr>
    </table>
  </div>

  <p style="font-size: 12px; color: #555; text-align: center; margin: 0;">This is an automated notification. The consumer has not paid yet — this fires at letter generation.</p>
</div>
      `,
    });
    console.log(`[EMAIL] Notification sent to ${NOTIFICATION_EMAIL} — ${letterType} for ${consumerName}`);
  } catch (err) {
    console.error("[EMAIL] Failed to send notification (non-blocking):", err);
  }
}
