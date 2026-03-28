/**
 * Checks if the current browser supports streaming request bodies in fetch.
 * Currently, this is primary supported in Chromium-based browsers (Chrome, Edge, etc.).
 */
export function isFetchStreamingSupported() {
  try {
    // Attempt to create a request with a stream body and check if the browser accepts it
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      }
    });

    // Creating the request check. If the browser doesn't support streaming, it will throw
    // or stringify the stream, but the definitive check is checking the Request properties.
    const request = new Request("https://example.com", {
      method: "POST",
      body: stream,
      // @ts-ignore - duplex is required for streaming requests
      duplex: "half"
    });

    return !!request.body;
  } catch (e) {
    return false;
  }
}

/**
 * Probes MediaRecorder to find the best available MIME type for the browser.
 */
export function getBestAudioMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/aac",
  ];

  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return ""; // Fallback to browser default
}
