import { SessionPayload } from "./types";

// In-memory store — works for local dev; replace with Redis/KV for production
const sessions = new Map<string, SessionPayload>();

export function saveSession(payload: SessionPayload): string {
  const id = crypto.randomUUID();
  sessions.set(id, payload);
  // Auto-expire after 2 hours
  setTimeout(() => sessions.delete(id), 2 * 60 * 60 * 1000);
  return id;
}

export function getSession(id: string): SessionPayload | undefined {
  return sessions.get(id);
}
