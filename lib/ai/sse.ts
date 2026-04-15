const encoder = new TextEncoder();

export type SseWriter = {
  send: (event: string, data: unknown) => void;
  close: () => void;
};

export function createSseStream(
  execute: (writer: SseWriter) => Promise<void>,
  signal?: AbortSignal,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // Stream already closed
        }
      };
      const close = () => {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      if (signal?.aborted) {
        close();
        return;
      }
      signal?.addEventListener("abort", () => close(), { once: true });

      execute({ send: write, close }).catch((error) => {
        write("error", {
          message: error instanceof Error ? error.message : "AI stream failed",
        });
        close();
      });
    },
  });
}

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};
