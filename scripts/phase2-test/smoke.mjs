import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const manifestPath =
  process.env.PHASE2_TEST_MANIFEST ||
  path.join(os.tmpdir(), "debtstrike-phase2-test-manifest.json");

const manifestRaw = await readFile(manifestPath, "utf8");
const manifest = JSON.parse(manifestRaw);

const baseUrl =
  process.env.PHASE2_TEST_BASE_URL ||
  manifest.baseUrl ||
  "http://127.0.0.1:4010";
const cronSecret =
  process.env.PHASE2_TEST_CRON_SECRET || process.env.CRON_SECRET || "";

async function readJsonResponse(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

async function callReminder(secret = "") {
  const headers = {};
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }
  const response = await fetch(`${baseUrl}/api/reminders/collector-response`, {
    method: "GET",
    headers,
  });
  const body = await readJsonResponse(response);
  return { status: response.status, body };
}

let reminderBefore = await callReminder();
if (reminderBefore.status === 401 && cronSecret) {
  reminderBefore = await callReminder(cronSecret);
}
if (reminderBefore.status !== 200) {
  throw new Error(
    `Reminder endpoint failed before analysis: ${reminderBefore.status} ${JSON.stringify(
      reminderBefore.body
    )}`
  );
}

const uploadResponsePage = await fetch(
  `${baseUrl}/upload-response?payload_id=${encodeURIComponent(manifest.payloadId)}`
);
if (!uploadResponsePage.ok) {
  throw new Error(`Upload page failed: HTTP ${uploadResponsePage.status}`);
}
const uploadHtml = await uploadResponsePage.text();

const uploadFileBuffer = await readFile(manifest.uploadFilePath);
const formData = new FormData();
formData.append("payload_id", manifest.payloadId);
formData.append(
  "file",
  new Blob([uploadFileBuffer], { type: "text/plain" }),
  path.basename(manifest.uploadFilePath)
);

const analyzeResponse = await fetch(`${baseUrl}/api/analyze-response`, {
  method: "POST",
  body: formData,
});
const analyzeBody = await readJsonResponse(analyzeResponse);
if (analyzeResponse.status !== 200 || !analyzeBody.success) {
  throw new Error(
    `Analyze response failed: ${analyzeResponse.status} ${JSON.stringify(
      analyzeBody
    )}`
  );
}

let reminderAfter = await callReminder();
if (reminderAfter.status === 401 && cronSecret) {
  reminderAfter = await callReminder(cronSecret);
}
if (reminderAfter.status !== 200) {
  throw new Error(
    `Reminder endpoint failed after analysis: ${reminderAfter.status} ${JSON.stringify(
      reminderAfter.body
    )}`
  );
}

console.log(
  JSON.stringify(
    {
      success: true,
      manifestPath,
      payloadId: manifest.payloadId,
      checks: {
        reminderBefore,
        uploadPage: {
          status: uploadResponsePage.status,
          containsUploadRouteCode: uploadHtml.includes("app/upload-response/page"),
        },
        analyzeResponse: {
          status: analyzeResponse.status,
          determination: analyzeBody.analysis?.determination ?? null,
          issueCount: Array.isArray(analyzeBody.analysis?.fdcpaIssues)
            ? analyzeBody.analysis.fdcpaIssues.length
            : 0,
          groundsForLawsuit: analyzeBody.analysis?.groundsForLawsuit ?? null,
          artifactsFolder: analyzeBody.artifactsFolder ?? null,
        },
        reminderAfter,
      },
    },
    null,
    2
  )
);
