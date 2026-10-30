import path from "path";
import { google } from "googleapis";
import { generateDocx } from "./generate-docx";
import { generatePdf } from "./generate-pdf";
import { SessionPayload } from "./types";

const DEFAULT_GOOGLE_SHEETS_ID = "1rIwQTc-TU8FrQRhRAC7vTg_gIOtl0Ni4kf9TDe9fN94";
const DEFAULT_DROPBOX_SHARED_LINK =
  "https://www.dropbox.com/scl/fo/hwol384ywchgvzpzkbv37/AA8GZnRY7ZUHgLPH7bYrZNc?rlkey=squ7ac2j941ebkcozns40m8qt&st=bjan4ft3&dl=0";
const SHEET_TAB = process.env.GOOGLE_SHEETS_TAB || "Sheet1";

const SHEET_HEADERS = [
  "payload_id",
  "first_name",
  "last_name",
  "full_name",
  "email",
  "phone",
  "street_address",
  "city",
  "state",
  "zip",
  "extracted_data_json",
  "generated_letter_text",
  "order_type",
  "stripe_session_id",
  "mailing_status",
  "tracking_number",
  "lob_letter_id",
  "expected_delivery_date",
  "last_error",
  "dropbox_folder_path",
  "uploaded_document_staging_path",
  "created_at",
  "updated_at",
];

const SHEET_PAYLOAD_ID_INDEX = SHEET_HEADERS.indexOf("payload_id");
const SHEET_FULL_NAME_INDEX = SHEET_HEADERS.indexOf("full_name");
const SHEET_EMAIL_INDEX = SHEET_HEADERS.indexOf("email");
const SHEET_PHONE_INDEX = SHEET_HEADERS.indexOf("phone");
const SHEET_STREET_ADDRESS_INDEX = SHEET_HEADERS.indexOf("street_address");
const SHEET_CITY_INDEX = SHEET_HEADERS.indexOf("city");
const SHEET_STATE_INDEX = SHEET_HEADERS.indexOf("state");
const SHEET_ZIP_INDEX = SHEET_HEADERS.indexOf("zip");
const SHEET_EXTRACTED_DATA_JSON_INDEX = SHEET_HEADERS.indexOf("extracted_data_json");
const SHEET_GENERATED_LETTER_TEXT_INDEX = SHEET_HEADERS.indexOf("generated_letter_text");

const SHEET_CREATED_AT_INDEX = SHEET_HEADERS.indexOf("created_at");
const SHEET_ORDER_TYPE_INDEX = SHEET_HEADERS.indexOf("order_type");
const SHEET_STRIPE_SESSION_ID_INDEX = SHEET_HEADERS.indexOf("stripe_session_id");
const SHEET_MAILING_STATUS_INDEX = SHEET_HEADERS.indexOf("mailing_status");
const SHEET_TRACKING_NUMBER_INDEX = SHEET_HEADERS.indexOf("tracking_number");
const SHEET_LOB_LETTER_ID_INDEX = SHEET_HEADERS.indexOf("lob_letter_id");
const SHEET_EXPECTED_DELIVERY_DATE_INDEX = SHEET_HEADERS.indexOf("expected_delivery_date");
const SHEET_LAST_ERROR_INDEX = SHEET_HEADERS.indexOf("last_error");
const SHEET_DROPBOX_FOLDER_PATH_INDEX = SHEET_HEADERS.indexOf("dropbox_folder_path");
const SHEET_UPLOADED_DOCUMENT_STAGING_PATH_INDEX = SHEET_HEADERS.indexOf(
  "uploaded_document_staging_path"
);

type DropboxApiResponse = Record<string, unknown>;

export interface ClientRecordSyncContext {
  payloadId: string;
  stripeSessionId?: string;
  orderType?: string;
  mailingStatus?: string;
  trackingNumber?: string;
  lobLetterId?: string;
  expectedDeliveryDate?: string;
  lastError?: string;
  dropboxFolderPath?: string;
}

export interface ClientSheetRecord {
  rowNumber: number;
  payloadId: string;
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  extractedDataJson: string;
  generatedLetterText: string;
  dropboxFolderPath: string;
  createdAt: string;
}

export interface CollectorResponseArtifactFile {
  fileName: string;
  fileContent: Uint8Array;
}

let cachedDropboxRootPath: string | null = null;
let hasWarnedMissingGoogleConfig = false;
let hasWarnedMissingDropboxConfig = false;

function getSpreadsheetId() {
  return process.env.GOOGLE_SHEETS_ID || DEFAULT_GOOGLE_SHEETS_ID;
}

function getGooglePrivateKey() {
  return process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function isGoogleSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      getGooglePrivateKey() &&
      getSpreadsheetId()
  );
}

function getDropboxAccessToken() {
  return process.env.DROPBOX_ACCESS_TOKEN;
}

function warnMissingGoogleConfigOnce() {
  if (hasWarnedMissingGoogleConfig) return;
  hasWarnedMissingGoogleConfig = true;
  console.warn(
    "[google-sheet-sync] Skipping sync: missing GOOGLE_SERVICE_ACCOUNT_EMAIL and/or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
  );
}

function warnMissingDropboxConfigOnce() {
  if (hasWarnedMissingDropboxConfig) return;
  hasWarnedMissingDropboxConfig = true;
  console.warn("[dropbox-sync] Skipping sync: missing DROPBOX_ACCESS_TOKEN.");
}

function sanitizePathSegment(input: string) {
  return input
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDropboxPath(pathValue: string) {
  const trimmed = pathValue.trim();
  if (!trimmed) return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function toSheetColumnLetter(index: number) {
  if (index <= 0) return "A";
  let n = index;
  let result = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function getSheetDataRange() {
  return buildSheetRange(1, SHEET_HEADERS.length);
}

function buildSheetRange(
  startColumnIndex: number,
  endColumnIndex: number,
  row?: number
) {
  const startCol = toSheetColumnLetter(startColumnIndex);
  const endCol = toSheetColumnLetter(endColumnIndex);
  if (typeof row === "number") {
    return `${SHEET_TAB}!${startCol}${row}:${endCol}${row}`;
  }
  return `${SHEET_TAB}!${startCol}:${endCol}`;
}

async function createSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = getGooglePrivateKey();

  if (!email || !key) {
    throw new Error("Missing Google Sheets service account credentials.");
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

async function ensureSheetHeaders(
  sheets: Awaited<ReturnType<typeof createSheetsClient>>,
  spreadsheetId: string
) {
  const headerRange = buildSheetRange(1, SHEET_HEADERS.length, 1);
  const existingHeader = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });
  const current = existingHeader.data.values?.[0] || [];
  if (current.length === SHEET_HEADERS.length && current[0] === SHEET_HEADERS[0]) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [SHEET_HEADERS],
    },
  });
}

async function getExistingSheetRows(
  sheets: Awaited<ReturnType<typeof createSheetsClient>>,
  spreadsheetId: string
) {
  const fullRange = getSheetDataRange();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange,
  });
  return existing.data.values || [];
}

function buildSheetRow(
  payload: SessionPayload,
  context: ClientRecordSyncContext,
  createdAtIso: string,
  existingRow?: string[]
) {
  const nowIso = new Date().toISOString();
  const { firstName, lastName } = splitName(payload.userInfo.fullName || "");
  const existing = (index: number) => existingRow?.[index] || "";

  return [
    context.payloadId,
    firstName,
    lastName,
    payload.userInfo.fullName || "",
    payload.userInfo.email || "",
    payload.userInfo.phone || "",
    payload.userInfo.streetAddress || "",
    payload.userInfo.city || "",
    payload.userInfo.state || "",
    payload.userInfo.zip || "",
    JSON.stringify(payload.extractedData || {}),
    payload.generatedLetter?.letterText || "",
    context.orderType ?? existing(SHEET_ORDER_TYPE_INDEX),
    context.stripeSessionId ?? existing(SHEET_STRIPE_SESSION_ID_INDEX),
    context.mailingStatus ?? existing(SHEET_MAILING_STATUS_INDEX),
    context.trackingNumber ?? existing(SHEET_TRACKING_NUMBER_INDEX),
    context.lobLetterId ?? existing(SHEET_LOB_LETTER_ID_INDEX),
    context.expectedDeliveryDate ?? existing(SHEET_EXPECTED_DELIVERY_DATE_INDEX),
    context.lastError ?? existing(SHEET_LAST_ERROR_INDEX),
    context.dropboxFolderPath ?? existing(SHEET_DROPBOX_FOLDER_PATH_INDEX),
    payload.extractedData.uploadedDocumentStagingPath ||
      existing(SHEET_UPLOADED_DOCUMENT_STAGING_PATH_INDEX),
    createdAtIso,
    nowIso,
  ];
}

async function dropboxRpc(
  endpoint: string,
  body: Record<string, unknown>
): Promise<DropboxApiResponse> {
  const token = getDropboxAccessToken();
  if (!token) {
    throw new Error("Missing DROPBOX_ACCESS_TOKEN.");
  }

  const response = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[dropbox:${endpoint}] ${response.status}: ${errText}`);
  }

  if (response.status === 204) {
    return {};
  }

  return (await response.json()) as DropboxApiResponse;
}

async function dropboxUpload(
  filePath: string,
  content: Uint8Array,
  mode: "add" | "overwrite" = "overwrite"
) {
  const token = getDropboxAccessToken();
  if (!token) {
    throw new Error("Missing DROPBOX_ACCESS_TOKEN.");
  }

  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: filePath,
        mode,
        autorename: true,
        mute: true,
      }),
    },
    body: Buffer.from(content),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[dropbox:files/upload] ${response.status}: ${errText}`);
  }
}

async function ensureDropboxFolder(folderPath: string) {
  try {
    await dropboxRpc("files/create_folder_v2", {
      path: folderPath,
      autorename: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("path/conflict")) {
      return;
    }
    throw error;
  }
}

async function resolveDropboxRootPath() {
  if (cachedDropboxRootPath) {
    return cachedDropboxRootPath;
  }

  if (process.env.DROPBOX_CLIENTS_ROOT_PATH) {
    cachedDropboxRootPath = normalizeDropboxPath(process.env.DROPBOX_CLIENTS_ROOT_PATH);
    return cachedDropboxRootPath;
  }

  const sharedLink = process.env.DROPBOX_SHARED_LINK || DEFAULT_DROPBOX_SHARED_LINK;
  if (sharedLink) {
    try {
      const metadata = await dropboxRpc("sharing/get_shared_link_metadata", {
        url: sharedLink,
      });
      const pathLower = metadata.path_lower;
      if (typeof pathLower === "string" && pathLower.trim()) {
        cachedDropboxRootPath = normalizeDropboxPath(pathLower);
        return cachedDropboxRootPath;
      }
    } catch (error) {
      console.warn("[dropbox-sync] Failed to resolve shared link root path:", error);
    }
  }

  cachedDropboxRootPath = "/DebtStrike Clients";
  return cachedDropboxRootPath;
}

export async function stageUploadedDocumentForDropbox(params: {
  fileName: string;
  fileContent: Uint8Array;
}) {
  if (!getDropboxAccessToken()) {
    warnMissingDropboxConfigOnce();
    return undefined;
  }

  try {
    const rootPath = await resolveDropboxRootPath();
    const stagingRoot = normalizeDropboxPath(`${rootPath}/_staging`);
    await ensureDropboxFolder(rootPath);
    await ensureDropboxFolder(stagingRoot);

    const safeName = sanitizePathSegment(params.fileName || "uploaded-letter");
    const stagedFilePath = `${stagingRoot}/${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}-${safeName}`;
    await dropboxUpload(stagedFilePath, params.fileContent, "add");
    return stagedFilePath;
  } catch (error) {
    console.warn("[dropbox-sync] Failed staging uploaded document:", error);
    return undefined;
  }
}

export async function finalizeClientDropboxFolder(params: {
  payloadId: string;
  payload: SessionPayload;
}) {
  if (!getDropboxAccessToken()) {
    warnMissingDropboxConfigOnce();
    return undefined;
  }

  const rootPath = await resolveDropboxRootPath();
  const safeClientName = sanitizePathSegment(params.payload.userInfo.fullName || "client");
  const clientRootFolderPath = `${rootPath}/${safeClientName || "client"}`;
  const clientFolderPath = `${clientRootFolderPath}/${params.payloadId}`;

  try {
    await ensureDropboxFolder(rootPath);
    await ensureDropboxFolder(clientRootFolderPath);
    await ensureDropboxFolder(clientFolderPath);

    const stagedPath = params.payload.extractedData.uploadedDocumentStagingPath;
    if (stagedPath) {
      const stagedExt = path.extname(stagedPath) || "";
      const uploadedNameBase = sanitizePathSegment(
        params.payload.extractedData.uploadedDocumentFileName || "uploaded-letter"
      );
      const normalizedUploadedName =
        stagedExt && uploadedNameBase.toLowerCase().endsWith(stagedExt.toLowerCase())
          ? uploadedNameBase
          : `${uploadedNameBase}${stagedExt}`;
      const uploadedDestPath = `${clientFolderPath}/${normalizedUploadedName}`;
      try {
        await dropboxRpc("files/move_v2", {
          from_path: stagedPath,
          to_path: uploadedDestPath,
          autorename: true,
          allow_shared_folder: true,
          allow_ownership_transfer: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("from_lookup/not_found")) {
          throw error;
        }
      }
    }

    const docx = await generateDocx(params.payload);
    await dropboxUpload(
      `${clientFolderPath}/generated-letter.docx`,
      new Uint8Array(docx),
      "overwrite"
    );

    const pdf = await generatePdf(params.payload);
    await dropboxUpload(
      `${clientFolderPath}/generated-letter.pdf`,
      new Uint8Array(pdf),
      "overwrite"
    );

    const letterText = Buffer.from(params.payload.generatedLetter.letterText || "", "utf8");
    await dropboxUpload(
      `${clientFolderPath}/generated-letter.txt`,
      new Uint8Array(letterText),
      "overwrite"
    );

    return clientFolderPath;
  } catch (error) {
    console.warn("[dropbox-sync] Failed finalizing client folder:", error);
    return undefined;
  }
}

function mapRowToClientSheetRecord(row: string[], rowNumber: number): ClientSheetRecord {
  return {
    rowNumber,
    payloadId: row[SHEET_PAYLOAD_ID_INDEX] || "",
    fullName: row[SHEET_FULL_NAME_INDEX] || "",
    email: row[SHEET_EMAIL_INDEX] || "",
    phone: row[SHEET_PHONE_INDEX] || "",
    streetAddress: row[SHEET_STREET_ADDRESS_INDEX] || "",
    city: row[SHEET_CITY_INDEX] || "",
    state: row[SHEET_STATE_INDEX] || "",
    zip: row[SHEET_ZIP_INDEX] || "",
    extractedDataJson: row[SHEET_EXTRACTED_DATA_JSON_INDEX] || "",
    generatedLetterText: row[SHEET_GENERATED_LETTER_TEXT_INDEX] || "",
    dropboxFolderPath: row[SHEET_DROPBOX_FOLDER_PATH_INDEX] || "",
    createdAt: row[SHEET_CREATED_AT_INDEX] || "",
  };
}

async function getSheetNumericId(
  sheets: Awaited<ReturnType<typeof createSheetsClient>>,
  spreadsheetId: string
) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });
  const matchedSheet = metadata.data.sheets?.find(
    (sheet) => sheet.properties?.title === SHEET_TAB
  );
  return matchedSheet?.properties?.sheetId;
}

export async function getClientSheetRecordByPayloadId(
  payloadId: string
): Promise<ClientSheetRecord | undefined> {
  if (!isGoogleSheetsConfigured()) {
    warnMissingGoogleConfigOnce();
    return undefined;
  }

  try {
    const sheets = await createSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await ensureSheetHeaders(sheets, spreadsheetId);
    const rows = await getExistingSheetRows(sheets, spreadsheetId);

    for (let i = 1; i < rows.length; i++) {
      if (rows[i]?.[SHEET_PAYLOAD_ID_INDEX] === payloadId) {
        return mapRowToClientSheetRecord(rows[i], i + 1);
      }
    }
    return undefined;
  } catch (error) {
    console.warn("[google-sheet-sync] Failed to lookup client row:", error);
    return undefined;
  }
}

export async function insertCollectorResponseAnalysisRow(params: {
  payload: SessionPayload;
  context: ClientRecordSyncContext;
}) {
  if (!isGoogleSheetsConfigured()) {
    warnMissingGoogleConfigOnce();
    return;
  }

  try {
    const sheets = await createSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await ensureSheetHeaders(sheets, spreadsheetId);
    const rows = await getExistingSheetRows(sheets, spreadsheetId);

    let targetRowNumber = rows.length + 1;
    let baseRowNumber = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i]?.[SHEET_PAYLOAD_ID_INDEX] === params.context.payloadId) {
        baseRowNumber = i + 1;
        targetRowNumber = baseRowNumber + 1;
        break;
      }
    }

    if (baseRowNumber > 0) {
      const sheetId = await getSheetNumericId(sheets, spreadsheetId);
      if (typeof sheetId === "number") {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                insertDimension: {
                  range: {
                    sheetId,
                    dimension: "ROWS",
                    startIndex: targetRowNumber - 1,
                    endIndex: targetRowNumber,
                  },
                  inheritFromBefore: true,
                },
              },
            ],
          },
        });
      }
    }

    const rowValues = buildSheetRow(
      params.payload,
      params.context,
      new Date().toISOString()
    );
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: buildSheetRange(1, SHEET_HEADERS.length, targetRowNumber),
      valueInputOption: "RAW",
      requestBody: {
        values: [rowValues],
      },
    });
  } catch (error) {
    console.warn("[google-sheet-sync] Failed inserting analysis row:", error);
  }
}

export async function uploadCollectorResponseArtifacts(params: {
  payloadId: string;
  clientFullName: string;
  baseDropboxFolderPath?: string;
  uploadedResponse: CollectorResponseArtifactFile;
  analysisJson: string;
  issueSummaryText: string;
  followupLetterText: string;
}) {
  if (!getDropboxAccessToken()) {
    warnMissingDropboxConfigOnce();
    return undefined;
  }

  try {
    const rootPath = await resolveDropboxRootPath();
    const safeClientName = sanitizePathSegment(params.clientFullName || "client");
    const clientRootFolderPath = `${rootPath}/${safeClientName || "client"}`;
    const defaultClientFolderPath = `${clientRootFolderPath}/${params.payloadId}`;
    const clientFolderPath = params.baseDropboxFolderPath
      ? normalizeDropboxPath(params.baseDropboxFolderPath)
      : defaultClientFolderPath;
    const responseFolderPath = `${clientFolderPath}/collector-response`;

    await ensureDropboxFolder(rootPath);
    await ensureDropboxFolder(clientRootFolderPath);
    await ensureDropboxFolder(clientFolderPath);
    await ensureDropboxFolder(responseFolderPath);

    const timestamp = Date.now();
    const safeOriginalName = sanitizePathSegment(
      params.uploadedResponse.fileName || "collector-response-upload"
    );
    await dropboxUpload(
      `${responseFolderPath}/${timestamp}-uploaded-${safeOriginalName}`,
      params.uploadedResponse.fileContent,
      "add"
    );

    await dropboxUpload(
      `${responseFolderPath}/${timestamp}-analysis.json`,
      new Uint8Array(Buffer.from(params.analysisJson, "utf8")),
      "overwrite"
    );
    await dropboxUpload(
      `${responseFolderPath}/${timestamp}-issues-summary.txt`,
      new Uint8Array(Buffer.from(params.issueSummaryText, "utf8")),
      "overwrite"
    );
    await dropboxUpload(
      `${responseFolderPath}/${timestamp}-followup-letter.txt`,
      new Uint8Array(Buffer.from(params.followupLetterText, "utf8")),
      "overwrite"
    );

    return responseFolderPath;
  } catch (error) {
    console.warn("[dropbox-sync] Failed uploading collector response artifacts:", error);
    return undefined;
  }
}

export async function syncClientRecordToGoogleSheet(
  payload: SessionPayload,
  context: ClientRecordSyncContext
) {
  if (!isGoogleSheetsConfigured()) {
    warnMissingGoogleConfigOnce();
    return;
  }

  try {
    const sheets = await createSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    await ensureSheetHeaders(sheets, spreadsheetId);
    const rows = await getExistingSheetRows(sheets, spreadsheetId);

    let existingRowNumber = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i]?.[SHEET_PAYLOAD_ID_INDEX] === context.payloadId) {
        existingRowNumber = i + 1;
        break;
      }
    }

    const createdAtIso =
      existingRowNumber > 0
        ? rows[existingRowNumber - 1]?.[SHEET_CREATED_AT_INDEX] ||
          new Date().toISOString()
        : new Date().toISOString();

    const existingRowValues =
      existingRowNumber > 0 ? rows[existingRowNumber - 1] : undefined;
    const rowValues = buildSheetRow(
      payload,
      context,
      createdAtIso,
      existingRowValues
    );

    if (existingRowNumber > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_TAB}!A${existingRowNumber}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [rowValues],
        },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_TAB}!A1`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowValues],
        },
      });
    }
  } catch (error) {
    console.warn("[google-sheet-sync] Failed syncing client row:", error);
  }
}
