import { NextResponse } from "next/server";
import { sendCollectorResponseReminderEmail } from "@/lib/emails";
import { listFulfillments, saveFulfillment } from "@/lib/fulfillment-store";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

function isDue(reminderDueAt: string | undefined, nowMs: number) {
  if (!reminderDueAt) return false;
  const dueMs = Date.parse(reminderDueAt);
  if (Number.isNaN(dueMs)) return false;
  return dueMs <= nowMs;
}

async function runReminderJob() {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const fulfillments = await listFulfillments();

  let dueCount = 0;
  let sentCount = 0;
  let failedCount = 0;
  let skippedMissingDataCount = 0;

  for (const record of fulfillments) {
    const isMailOrder =
      record.orderType === "debt_letter_mail" || record.orderType === "share_mail";
    if (!isMailOrder) continue;
    if (record.responseReminderSentAt || record.responseReceivedAt) continue;
    if (!isDue(record.responseReminderDueAt, nowMs)) continue;

    dueCount += 1;

    if (!record.customerEmail || !record.payloadId) {
      skippedMissingDataCount += 1;
      continue;
    }

    try {
      await sendCollectorResponseReminderEmail({
        customerEmail: record.customerEmail,
        consumerName: record.consumerName || "there",
        collectorName: record.collectorName || "the collector",
        payloadId: record.payloadId,
      });
      record.responseReminderSentAt = nowIso;
      record.lastError = undefined;
      await saveFulfillment(record);
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      record.lastError =
        error instanceof Error
          ? `Response reminder email failed: ${error.message}`
          : "Response reminder email failed.";
      await saveFulfillment(record);
      console.error(
        `[collector-response-reminders] Failed to send reminder for payload ${record.payloadId}:`,
        error
      );
    }
  }

  return {
    scannedCount: fulfillments.length,
    dueCount,
    sentCount,
    failedCount,
    skippedMissingDataCount,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runReminderJob();
    return NextResponse.json({ success: true, ...stats });
  } catch (error) {
    console.error("[collector-response-reminders] Job failed:", error);
    return NextResponse.json(
      { error: "Failed running collector response reminder job." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
