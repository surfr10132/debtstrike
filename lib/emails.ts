import { resend, isEmailConfigured } from "./resend";
import { SessionPayload } from "./types";
import { generatePdf } from "./generate-pdf";
import { generateDocx } from "./generate-docx";

const FROM_EMAIL = "DebtStrike.io <noreply@debtstrike.io>";
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "jason@robenzlaw.com";

function checkEmail() {
  if (!isEmailConfigured) {
    console.warn("[EMAIL] Resend API key not configured — skipping email send");
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
    subject: `Your letter to ${extractedData.collectorName} is ready — here's your next move`,
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 32px;">

  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #00ff41;">DEBTSTRIKE</span><span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #ff3333;">.IO</span>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 15px;">Hi ${userInfo.fullName},</p>
    <p style="margin: 0 0 16px; font-size: 15px;">Your debt validation and cease &amp; desist letter is attached. You've got two copies — a Word doc you can edit and sign by hand, and a PDF with a signature already on it. Either one works.</p>
    <p style="margin: 0 0 8px; font-size: 15px;"><strong>Collector:</strong> ${extractedData.collectorName}</p>
    <p style="margin: 0 0 8px; font-size: 15px;"><strong>Account:</strong> ${extractedData.accountNumber || "As referenced"}</p>
    <p style="margin: 0 0 16px; font-size: 15px;"><strong>Amount claimed:</strong> ${extractedData.amountClaimed || "As stated"}</p>
  </div>

  <!-- TIME-SENSITIVE: Mail it NOW -->
  <div style="border: 2px solid #ff3333; padding: 24px; margin-bottom: 24px; background: rgba(255,51,51,0.05);">
    <div style="font-family: monospace; font-size: 12px; color: #ff3333; letter-spacing: 2px; font-weight: bold; margin-bottom: 12px;">⚠ DON'T SIT ON THIS</div>
    <p style="margin: 0 0 12px; font-size: 15px; color: #ffffff;">Under the FDCPA, you have <strong>30 days from when you received the collector's letter</strong> to dispute the debt in writing. If you wait too long, the collector can assume the debt is valid and keep coming after you.</p>
    <p style="margin: 0 0 12px; font-size: 15px; font-weight: bold; color: #ffffff;">Mail this letter THIS WEEK. Here's how:</p>
    <ol style="margin: 0 0 16px; padding-left: 20px; font-size: 14px; line-height: 1.8;">
      <li>Print the letter (either version)</li>
      <li>Sign it if using the Word version</li>
      <li>Go to any USPS post office</li>
      <li>Ask for <strong>"Certified Mail with Return Receipt"</strong> (~$4-5)</li>
      <li><strong>KEEP THE RECEIPT — that's your proof</strong></li>
    </ol>
    <div style="border: 2px solid #00ff41; padding: 16px; background: rgba(0,255,65,0.04);">
      <p style="margin: 0; font-size: 14px; color: #ffffff;"><strong>Why certified mail?</strong> Once the collector receives this letter, every phone call they make to you is a <span style="color: #00ff41; font-weight: bold;">$1,000 federal violation</span>. The tracking receipt is your proof they got it. No receipt = no proof = no case.</p>
    </div>
  </div>

  <!-- UPSELL: We'll mail it for you -->
  <div style="border: 2px solid #00ff41; padding: 24px; margin-bottom: 24px; background: rgba(0,255,65,0.04); text-align: center;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 12px;">DON'T WANT TO GO TO THE POST OFFICE?</div>
    <p style="margin: 0 0 16px; font-size: 15px;">We'll print your letter and mail it via <strong>USPS Certified Mail with Return Receipt</strong> — tracking number sent straight to your inbox. No trip to the post office.</p>
    <a href="${baseUrl}/generate" style="display: inline-block; padding: 14px 32px; background: #00ff41; color: #000; font-family: monospace; font-size: 14px; font-weight: bold; text-decoration: none; letter-spacing: 2px;">MAIL IT FOR ME — $10.99</a>
    <p style="margin: 12px 0 0; font-size: 12px; color: #666;">Includes printing, USPS Certified Mail, electronic return receipt, and tracking.</p>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 16px;">WHAT HAPPENS AFTER YOU MAIL IT</div>
    <div style="margin-bottom: 12px; font-size: 14px;">
      <strong style="color: #00ff41;">Immediately after delivery</strong> — All phone calls from the collector must stop. If they call anyway, write down the date, time, and number. Each call = $1,000.
    </div>
    <div style="margin-bottom: 12px; font-size: 14px;">
      <strong style="color: #00ff41;">Within 30 days</strong> — They must send you proof the debt is real. If they can't, they have to stop collecting and remove it from your credit report.
    </div>
    <div style="font-size: 14px;">
      <strong style="color: #00ff41;">After 30 days with no response</strong> — The debt is effectively dead. If they keep contacting you, a consumer protection attorney can sue them for you — most take these cases for free on contingency.
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
    <p style="margin: 0 0 8px;">Questions? Reply to this email or contact <a href="mailto:support@debtstrike.io" style="color: #00ff41;">support@debtstrike.io</a></p>
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

/**
 * Email #2: Mail-for-me customer ($30.99 full / $10.99 share)
 * Sends a receipt, the tracking number, and next-steps instructions.
 */
export async function sendMailingConfirmationEmail(
  customerEmail: string,
  payload: SessionPayload,
  trackingNumber: string,
  amountPaid: string,
  isShareOrder = false
): Promise<void> {
  if (!checkEmail()) return;

  const { userInfo, extractedData } = payload;

  // Build receipt rows based on order type
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

  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `Your Letter Has Been Mailed — Tracking #${trackingNumber}`,
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #e0e0e0; background: #0a0a0a; padding: 32px;">

  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #00ff41;">DEBTSTRIKE</span><span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #ff3333;">.IO</span>
  </div>

  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px; font-size: 15px;">Hi ${userInfo.fullName},</p>
    <p style="margin: 0 0 16px; font-size: 15px;">Your debt validation and cease &amp; desist letter has been printed and submitted to <strong>USPS Certified Mail with Electronic Return Receipt</strong>. It's on its way.</p>
  </div>

  <!-- Receipt -->
  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 16px;">RECEIPT</div>
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      ${receiptRows}
      <tr>
        <td style="padding: 12px 0; font-weight: bold; color: #ffffff;">Total Paid</td>
        <td style="padding: 12px 0; font-weight: bold; color: #00ff41; text-align: right;">${amountPaid}</td>
      </tr>
    </table>
    <div style="margin-top: 12px; font-size: 13px; color: #666;">
      <p style="margin: 0 0 4px;"><strong>Sent to:</strong> ${extractedData.collectorName}</p>
      <p style="margin: 0 0 4px;"><strong>Account:</strong> ${extractedData.accountNumber || "As referenced"}</p>
      <p style="margin: 0;"><strong>Amount disputed:</strong> ${extractedData.amountClaimed || "As stated"}</p>
    </div>
  </div>

  <!-- Tracking Number -->
  <div style="border: 2px solid #00ff41; padding: 24px; margin-bottom: 24px; background: rgba(0,255,65,0.04); text-align: center;">
    <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 2px; margin-bottom: 8px;">USPS TRACKING NUMBER</div>
    <div style="font-family: monospace; font-size: 24px; font-weight: bold; color: #00ff41; letter-spacing: 2px; margin-bottom: 12px;">${trackingNumber}</div>
    <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}" style="font-size: 13px; color: #00ff41; text-decoration: underline;">Track on USPS.com →</a>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #222;">
      <p style="margin: 0; font-size: 14px; font-weight: bold; color: #ffffff;">Save this tracking number. This is your proof.</p>
      <p style="margin: 8px 0 0; font-size: 13px; color: #ccc;">If the collector keeps calling after this letter is delivered, every call is a <span style="color: #00ff41; font-weight: bold;">$1,000 federal violation</span>. This tracking number proves they received it.</p>
    </div>
  </div>

  <!-- What happens next -->
  <div style="border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
    <div style="font-family: monospace; font-size: 12px; color: #00ff41; letter-spacing: 2px; font-weight: bold; margin-bottom: 16px;">WHAT HAPPENS NOW</div>

    <div style="margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #00ff41;">
      <div style="font-family: monospace; font-size: 11px; color: #00ff41; letter-spacing: 1px; margin-bottom: 4px;">3–7 BUSINESS DAYS</div>
      <p style="margin: 0; font-size: 14px;">Your letter will be delivered. Check the USPS tracking link above — when it says "Delivered," the clock starts.</p>
    </div>

    <div style="margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #00ff41;">
      <div style="font-family: monospace; font-size: 11px; color: #00ff41; letter-spacing: 1px; margin-bottom: 4px;">IMMEDIATELY AFTER DELIVERY</div>
      <p style="margin: 0; font-size: 14px;">All phone calls from the collector must stop. If they call after delivery, note the date, time, and number — each call is worth $1,000.</p>
    </div>

    <div style="margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #888;">
      <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 1px; margin-bottom: 4px;">THE COLLECTOR HAS 30 DAYS TO RESPOND</div>
      <p style="margin: 0; font-size: 14px;">By law, the collector must send you written proof that the debt is legitimate within 30 days of receiving your letter. Until they prove it, they must stop all collection activity — no calls, no letters, no credit reporting.</p>
    </div>

    <div style="padding-left: 16px; border-left: 3px solid #888;">
      <div style="font-family: monospace; font-size: 11px; color: #888; letter-spacing: 1px; margin-bottom: 4px;">AFTER 30 DAYS WITH NO RESPONSE</div>
      <p style="margin: 0; font-size: 14px;">If they don't respond with proof, the debt is effectively dead. They can't legally continue collecting. If they do, you may have grounds for a lawsuit — contact a consumer protection attorney (most take these cases for free on contingency).</p>
    </div>
  </div>

  <!-- Social share CTA -->
  <div style="border: 1px solid #222; padding: 20px; margin-bottom: 24px; text-align: center;">
    <p style="margin: 0 0 8px; font-size: 14px; color: #ccc;">Just took a stand against a debt collector?</p>
    <p style="margin: 0 0 12px; font-size: 14px; color: #ffffff;">Share your experience so others know they have rights too.</p>
    <a href="https://twitter.com/intent/tweet?text=Just%20sent%20a%20certified%20letter%20to%20a%20debt%20collector%20through%20debtstrike.io.%20They%20have%2030%20days%20to%20prove%20the%20debt%20is%20real%20or%20drop%20it.%20%40debtstrikeusa&url=https%3A%2F%2Fdebtstrike.io" style="display: inline-block; padding: 10px 24px; border: 1px solid #00ff41; color: #00ff41; font-family: monospace; font-size: 12px; font-weight: bold; text-decoration: none; letter-spacing: 1px; margin: 0 4px;">SHARE ON X</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdebtstrike.io" style="display: inline-block; padding: 10px 24px; border: 1px solid #00ff41; color: #00ff41; font-family: monospace; font-size: 12px; font-weight: bold; text-decoration: none; letter-spacing: 1px; margin: 0 4px;">SHARE ON FB</a>
  </div>

  <div style="text-align: center; padding: 16px; font-size: 12px; color: #666;">
    <p style="margin: 0 0 8px;">Questions? Reply to this email or contact <a href="mailto:support@debtstrike.io" style="color: #00ff41;">support@debtstrike.io</a></p>
    <p style="margin: 0 0 8px; font-size: 11px; color: #555;">Follow us: <a href="https://instagram.com/debtstrikeusa" style="color: #00ff41;">@debtstrikeusa</a></p>
    <p style="margin: 0; font-size: 11px; color: #444;">DebtStrike.io is not a law firm and does not provide legal advice.</p>
  </div>
</div>
    `,
  });

  console.log(
    `[EMAIL] Mailing confirmation sent to ${customerEmail} — tracking: ${trackingNumber}`
  );
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
