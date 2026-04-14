const encoder = new TextEncoder();

export type SseWriter = {
  send: (event: string, data: unknown) => void;
  close: () => void;
};

export function createSseStream(
  execute: (writer: SseWriter) => Promise<void>,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      const close = () => controller.close();

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
