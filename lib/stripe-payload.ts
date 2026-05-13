import { SessionPayload } from "./types";

/**
 * Encode a SessionPayload into Stripe metadata chunks.
 * Stripe metadata: max 50 keys, max 500 chars per value, max 40 chars per key.
 * We JSON-stringify the payload, then split into 500-char chunks.
 */
const CHUNK_SIZE = 490; // slightly under 500 to be safe
const CHUNK_PREFIX = "p_";

export function encodePayloadToMetadata(
  payload: SessionPayload
): Record<string, string> {
  const json = JSON.stringify(payload);
  const metadata: Record<string, string> = {};
  const totalChunks = Math.ceil(json.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    metadata[`${CHUNK_PREFIX}${i}`] = json.slice(
      i * CHUNK_SIZE,
      (i + 1) * CHUNK_SIZE
    );
  }
  metadata["p_total"] = String(totalChunks);
  return metadata;
}

export function decodePayloadFromMetadata(
  metadata: Record<string, string> | null | undefined
): SessionPayload | null {
  if (!metadata) return null;

  const total = parseInt(metadata["p_total"] || "0", 10);
  if (total === 0) return null;

  let json = "";
  for (let i = 0; i < total; i++) {
    const chunk = metadata[`${CHUNK_PREFIX}${i}`];
    if (chunk === undefined || chunk === null) return null;
    json += chunk;
  }

  try {
    return JSON.parse(json) as SessionPayload;
  } catch {
    console.error("[stripe-payload] Failed to parse payload from metadata");
    return null;
  }
}
