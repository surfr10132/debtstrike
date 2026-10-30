import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { isKvConfigured, kvDel, kvGetJson, kvSAdd, kvSMembers, kvSetJson } from "./kv";

export type OrderType = "debt_letter" | "debt_letter_mail" | "share_mail";
export type MailingStatus = "pending" | "processing" | "submitted" | "failed";

export interface FulfillmentRecord {
  sessionId: string;
  payloadId: string;
  orderType: OrderType;
  createdAt: string;
  updatedAt: string;
  downloadEmailSent: boolean;
  confirmationEmailSent: boolean;
  orderConfirmationEmailSent?: boolean;
  failureAlertSent?: boolean;
  followupEmailSent?: boolean;
  customerEmail?: string;
  consumerName?: string;
  collectorName?: string;
  responseReminderDueAt?: string;
  responseReminderSentAt?: string;
  responseReceivedAt?: string;
  responseAnalysisSummary?: string;
  responseHasLawsuitGrounds?: boolean;
  mailingStatus?: MailingStatus;
  trackingNumber?: string;
  lobLetterId?: string;
  expectedDeliveryDate?: string;
  lastError?: string;
}
const FULFILLMENT_TTL_MS = 120 * 24 * 60 * 60 * 1000; // 120 days
const fulfillmentCache = new Map<string, FulfillmentRecord>();
const storeDir = path.join(os.tmpdir(), "debtstrike-fulfillment");

function getRecordPath(sessionId: string) {
  return path.join(storeDir, `${sessionId}.json`);
}

async function ensureStoreDir() {
  await fs.mkdir(storeDir, { recursive: true });
}

function isExpired(record: FulfillmentRecord) {
  const ts = Date.parse(record.updatedAt || record.createdAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts > FULFILLMENT_TTL_MS;
}

const kvKey = (sessionId: string) => `ds:fulfillment:${sessionId}`;
const KV_INDEX = "ds:fulfillment-ids";

async function removeRecordFromDisk(sessionId: string) {
  await kvDel(kvKey(sessionId));
  try {
    await fs.unlink(getRecordPath(sessionId));
  } catch {
    // ignore missing files
  }
}

async function persistRecord(record: FulfillmentRecord) {
  await kvSetJson(kvKey(record.sessionId), record, Math.ceil(FULFILLMENT_TTL_MS / 1000));
  await kvSAdd(KV_INDEX, record.sessionId);
  try {
    await ensureStoreDir();
    await fs.writeFile(
      getRecordPath(record.sessionId),
      JSON.stringify(record),
      "utf8"
    );
  } catch (error) {
    console.warn("[fulfillment-store] Failed to persist record:", error);
  }
}

async function readRecordFromDisk(
  sessionId: string
): Promise<FulfillmentRecord | undefined> {
  const fromKv = await kvGetJson<FulfillmentRecord>(kvKey(sessionId));
  if (fromKv?.sessionId && fromKv?.payloadId && fromKv?.orderType) return fromKv;
  try {
    await ensureStoreDir();
    const raw = await fs.readFile(getRecordPath(sessionId), "utf8");
    const parsed = JSON.parse(raw) as FulfillmentRecord;
    if (!parsed?.sessionId || !parsed?.payloadId || !parsed?.orderType) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function buildInitialFulfillmentRecord(params: {
  sessionId: string;
  payloadId: string;
  orderType: OrderType;
}): FulfillmentRecord {
  const now = new Date().toISOString();
  const isMailOrder =
    params.orderType === "debt_letter_mail" || params.orderType === "share_mail";
  return {
    sessionId: params.sessionId,
    payloadId: params.payloadId,
    orderType: params.orderType,
    createdAt: now,
    updatedAt: now,
    downloadEmailSent: false,
    confirmationEmailSent: false,
    followupEmailSent: false,
    mailingStatus: isMailOrder ? "pending" : undefined,
  };
}

export async function getFulfillment(
  sessionId: string
): Promise<FulfillmentRecord | undefined> {
  const fromCache = fulfillmentCache.get(sessionId);
  if (fromCache) {
    if (isExpired(fromCache)) {
      fulfillmentCache.delete(sessionId);
      await removeRecordFromDisk(sessionId);
      return undefined;
    }
    return fromCache;
  }

  const fromDisk = await readRecordFromDisk(sessionId);
  if (!fromDisk) return undefined;

  if (isExpired(fromDisk)) {
    await removeRecordFromDisk(sessionId);
    return undefined;
  }

  fulfillmentCache.set(sessionId, fromDisk);
  return fromDisk;
}

export async function saveFulfillment(record: FulfillmentRecord): Promise<void> {
  const updated: FulfillmentRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };
  fulfillmentCache.set(updated.sessionId, updated);
  await persistRecord(updated);
}

export async function listFulfillments(): Promise<FulfillmentRecord[]> {
  const records = new Map<string, FulfillmentRecord>();

  for (const [sessionId, record] of fulfillmentCache.entries()) {
    if (isExpired(record)) {
      fulfillmentCache.delete(sessionId);
      await removeRecordFromDisk(sessionId);
      continue;
    }
    records.set(sessionId, record);
  }

  if (isKvConfigured) {
    for (const sessionId of await kvSMembers(KV_INDEX)) {
      if (records.has(sessionId)) continue;
      const record = await getFulfillment(sessionId);
      if (record) records.set(sessionId, record);
    }
  }

  try {
    await ensureStoreDir();
    const files = await fs.readdir(storeDir);
    const sessionIds = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""));

    for (const sessionId of sessionIds) {
      if (records.has(sessionId)) continue;
      const record = await getFulfillment(sessionId);
      if (record) {
        records.set(sessionId, record);
      }
    }
  } catch {
    // ignore directory read issues
  }

  return Array.from(records.values()).sort((a, b) => {
    const aTs = Date.parse(a.updatedAt || a.createdAt);
    const bTs = Date.parse(b.updatedAt || b.createdAt);
    return (Number.isNaN(bTs) ? 0 : bTs) - (Number.isNaN(aTs) ? 0 : aTs);
  });
}

export async function findFulfillmentByPayloadId(
  payloadId: string
): Promise<FulfillmentRecord | undefined> {
  const records = await listFulfillments();
  return records.find((record) => record.payloadId === payloadId);
}
