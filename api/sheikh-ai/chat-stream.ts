import { streamSheikhAiChat } from '../../src/server/sheikhAiService.ts';

const STREAM_CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: STREAM_CORS_HEADERS,
  });
}

export async function POST(request: Request): Promise<Response> {
  const payload = await parseJsonBody(request);
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const onAbort = () => {
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      if (request.signal?.aborted) {
        onAbort();
        return;
      }
      request.signal?.addEventListener('abort', onAbort, { once: true });

      try {
        await streamSheikhAiChat(payload, (event) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            closed = true;
          }
        });
      } finally {
        request.signal?.removeEventListener('abort', onAbort);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {}
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: STREAM_CORS_HEADERS,
  });
}
