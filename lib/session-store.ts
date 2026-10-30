import { SessionPayload } from "./types";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { kvDel, kvGetJson, kvSetJson } from "./kv";

interface SessionRecord {
  payload: SessionPayload;
  expiresAt: number;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const sessionCache = new Map<string, SessionRecord>();
const storeDir = path.join(os.tmpdir(), "debtstrike-sessions");

function getSessionPath(id: string) {
  return path.join(storeDir, `${id}.json`);
}

async function ensureStoreDir() {
  await fs.mkdir(storeDir, { recursive: true });
}

const kvKey = (id: string) => `ds:session:${id}`;

async function persistSession(id: string, record: SessionRecord) {
  await kvSetJson(
    kvKey(id),
    record,
    Math.max(60, Math.ceil((record.expiresAt - Date.now()) / 1000))
  );
  try {
    await ensureStoreDir();
    await fs.writeFile(getSessionPath(id), JSON.stringify(record), "utf8");
  } catch (error) {
    console.warn("[session-store] Failed to persist session:", error);
  }
}

async function removeSessionFromDisk(id: string) {
  await kvDel(kvKey(id));
  try {
    await fs.unlink(getSessionPath(id));
  } catch {
    // ignore missing files
  }
}

async function readSessionFromDisk(id: string): Promise<SessionRecord | undefined> {
  const fromKv = await kvGetJson<SessionRecord>(kvKey(id));
  if (fromKv?.payload && typeof fromKv.expiresAt === "number") return fromKv;
  try {
    await ensureStoreDir();
    const raw = await fs.readFile(getSessionPath(id), "utf8");
    const parsed = JSON.parse(raw) as SessionRecord;
    if (!parsed?.payload || typeof parsed.expiresAt !== "number") return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function isExpired(record: SessionRecord) {
  return Date.now() > record.expiresAt;
}

export async function saveSession(
  payload: SessionPayload,
  existingId?: string
): Promise<string> {
  const id = existingId || crypto.randomUUID();
  const record: SessionRecord = {
    payload,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessionCache.set(id, record);
  await persistSession(id, record);
  return id;
}

export async function getSession(id: string): Promise<SessionPayload | undefined> {
  const fromCache = sessionCache.get(id);
  if (fromCache) {
    if (isExpired(fromCache)) {
      sessionCache.delete(id);
      await removeSessionFromDisk(id);
      return undefined;
    }
    return fromCache.payload;
  }

  const fromDisk = await readSessionFromDisk(id);
  if (!fromDisk) return undefined;

  if (isExpired(fromDisk)) {
    await removeSessionFromDisk(id);
    return undefined;
  }

  sessionCache.set(id, fromDisk);
  return fromDisk.payload;
}

export async function deleteSession(id: string): Promise<void> {
  sessionCache.delete(id);
  await removeSessionFromDisk(id);
}
