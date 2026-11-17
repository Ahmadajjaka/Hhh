import { processSheikhAiChat } from '../../src/server/sheikhAiService.ts';

const JSON_CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
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
    headers: JSON_CORS_HEADERS,
  });
}

export async function POST(request: Request): Promise<Response> {
  const payload = await parseJsonBody(request);
  const result = await processSheikhAiChat(payload);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: JSON_CORS_HEADERS,
  });
}
