export async function exportSessionToGcs(payload) {
  const endpoint = import.meta.env.VITE_GCS_EXPORT_ENDPOINT;
  if (!endpoint) return { skipped: true, reason: "missing-endpoint" };

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
