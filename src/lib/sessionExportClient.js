import { isFetchStreamingSupported as checkStreamingSupport } from "./browserUtils";

export const isFetchStreamingSupported = checkStreamingSupport();

export async function exportSessionToGcs(payload) {
  const root = import.meta.env.VITE_GCS_EXPORT_ENDPOINT;
  if (!root) return { skipped: true, reason: "missing-endpoint" };
  const endpoint = root.endsWith("/export-session") ? root : `${root}/export-session`;

  const token = import.meta.env.VITE_GCS_EXPORT_TOKEN;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-export-token": token } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Export failed (${response.status}): ${text}`);
  }

  return response.json();
}

/**
 * Streams raw audio data to GCS using browser fetch streaming (Chrome 105+).
 * @param {string} sessionId
 * @param {ReadableStream} audioStream
 */
export function streamAudioToGcs(sessionId, audioStream) {
  const root = import.meta.env.VITE_GCS_EXPORT_ENDPOINT;
  if (!root) return Promise.reject(new Error("missing-endpoint"));

  const baseUrl = root.replace("/export-session", "");
  const endpoint = `${baseUrl}/stream-audio?sessionId=${sessionId}`;
  const token = import.meta.env.VITE_GCS_EXPORT_TOKEN;

  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "audio/webm",
      ...(token ? { "x-export-token": token } : {})
    },
    body: audioStream,
    // @ts-ignore
    duplex: "half"
  });
}

/**
 * Fallback for browsers (Safari/Firefox) that don't support fetch streaming.
 * Uploads the collected audio blob as a single POST.
 */
export function uploadFullAudioToGcs(sessionId, audioBlob, mimeType = "audio/webm") {
  const root = import.meta.env.VITE_GCS_EXPORT_ENDPOINT;
  if (!root) return Promise.reject(new Error("missing-endpoint"));

  const baseUrl = root.replace("/export-session", "");
  const endpoint = `${baseUrl}/stream-audio?sessionId=${sessionId}`;
  const token = import.meta.env.VITE_GCS_EXPORT_TOKEN;

  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      ...(token ? { "x-export-token": token } : {})
    },
    body: audioBlob
  });
}

