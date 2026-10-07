// SSE frames may cross UTF-8 chunks. Flush the decoder and retain partial frames.
export async function readEventStream(
  path: string,
  body: Record<string, unknown> | undefined,
  signal: AbortSignal,
  onEvent: (
    event: import("./server/workflow-models").StreamEvent,
    type?: string,
  ) => void,
) {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal,
  });
  if (!response.ok)
    throw new Error(`Erreur de génération (${response.status})`);
  if (!response.body) throw new Error("Flux indisponible");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  function process(final = false) {
    const frames = buffer.replace(/\r\n/g, "\n").split("\n\n");
    buffer = final ? "" : (frames.pop() ?? "");
    for (const frame of frames) {
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data || data === "[DONE]") continue;
      const event: StreamEvent = JSON.parse(data);
      const type = frame
        .split("\n")
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim();
      if (type === "error")
        throw new Error(event.message || "Erreur de synchronisation");
      if (event.error) throw new Error(event.error);
      onEvent(event, type);
    }
  }
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      process();
    }
    buffer += decoder.decode();
    process(true);
  } finally {
    reader.releaseLock();
  }
}
import type { StreamEvent } from "./server/workflow-models";
