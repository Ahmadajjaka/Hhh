import { getSheikhAiStatusResponse } from '../../src/server/sheikhAiService.ts';

const JSON_CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
};

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: JSON_CORS_HEADERS,
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get('refresh') === '1';
  const result = await getSheikhAiStatusResponse({ forceRefresh });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: JSON_CORS_HEADERS,
  });
}
