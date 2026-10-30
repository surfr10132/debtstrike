import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const nowMs = Date.now();
const nowIso = new Date(nowMs).toISOString();

const payloadId =
  process.env.PHASE2_TEST_PAYLOAD_ID || `phase2-test-payload-${nowMs}`;
const sessionId =
  process.env.PHASE2_TEST_SESSION_ID || `phase2-test-session-${nowMs}`;
const fixtureEmail =
  process.env.PHASE2_TEST_EMAIL || "phase2-test@example.com";
const baseUrl =
  process.env.PHASE2_TEST_BASE_URL || "http://127.0.0.1:4010";

const tmpDir = os.tmpdir();
const fulfillmentDir = path.join(tmpDir, "debtstrike-fulfillment");
const sessionDir = path.join(tmpDir, "debtstrike-sessions");
const uploadFilePath = path.join(
  tmpDir,
  `${payloadId}-collector-response.txt`
);
const manifestPath = path.join(tmpDir, "debtstrike-phase2-test-manifest.json");

await mkdir(fulfillmentDir, { recursive: true });
await mkdir(sessionDir, { recursive: true });

const fulfillmentFilePath = path.join(fulfillmentDir, `${sessionId}.json`);
const sessionFilePath = path.join(sessionDir, `${payloadId}.json`);

const fulfillmentRecord = {
  sessionId,
  payloadId,
  orderType: "debt_letter_mail",
  createdAt: nowIso,
  updatedAt: nowIso,
  downloadEmailSent: false,
  confirmationEmailSent: true,
  followupEmailSent: false,
  customerEmail: fixtureEmail,
  consumerName: "Phase2 Test User",
  collectorName: "Phase2 Test Collector LLC",
  responseReminderDueAt: new Date(nowMs - 60 * 60 * 1000).toISOString(),
  responseReminderSentAt: undefined,
  responseReceivedAt: undefined,
  responseAnalysisSummary: undefined,
  responseHasLawsuitGrounds: undefined,
  mailingStatus: "submitted",
  trackingNumber: "9400000000000000000000",
  expectedDeliveryDate: new Date(nowMs - 29 * 24 * 60 * 60 * 1000).toISOString(),
};

const sessionRecord = {
  payload: {
    extractedData: {
      collectorName: "Phase2 Test Collector LLC",
      collectorAddress: "123 Debt Lane, Los Angeles, CA 90001",
      accountNumber: "PHASE2-ACC-12345",
      amountClaimed: "$1234.56",
      originalCreditor: "Original Bank",
      isThirdPartyCollector: true,
      collectorTypeConfidence: "high",
      recipientName: "Phase2 Test User",
      recipientStreetAddress: "1 Test St",
      recipientCity: "Los Angeles",
      recipientState: "CA",
      recipientZip: "90001",
      recipientPhone: "(555) 111-2222",
    },
    userInfo: {
      fullName: "Phase2 Test User",
      streetAddress: "1 Test St",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      email: fixtureEmail,
      phone: "(555) 111-2222",
      ssnLast4: "1234",
      dob: "1990-01-01",
    },
    generatedLetter: {
      letterText: "Synthetic phase2 test payload letter.",
      date: nowIso.slice(0, 10),
    },
  },
  expiresAt: nowMs + 24 * 60 * 60 * 1000,
};

const syntheticCollectorResponse = [
  "This is a synthetic collector response for local phase2 smoke testing.",
  "We have validated your debt.",
  "No account-level statements are included in this test fixture.",
].join("\n");

await writeFile(
  fulfillmentFilePath,
  JSON.stringify(fulfillmentRecord, null, 2),
  "utf8"
);
await writeFile(sessionFilePath, JSON.stringify(sessionRecord, null, 2), "utf8");
await writeFile(uploadFilePath, syntheticCollectorResponse, "utf8");

const manifest = {
  payloadId,
  sessionId,
  fixtureEmail,
  baseUrl,
  uploadFilePath,
  fulfillmentFilePath,
  sessionFilePath,
  createdAt: nowIso,
};

await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

console.log(
  JSON.stringify(
    {
      success: true,
      manifestPath,
      manifest,
    },
    null,
    2
  )
);
