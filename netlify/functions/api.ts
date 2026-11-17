import {
  getHealthResponse,
  getSheikhAiStatusResponse,
  processSheikhAiChat,
} from '../../src/server/sheikhAiService.ts';

export interface NetlifyEvent {
  httpMethod?: string;
  path?: string;
  rawUrl?: string;
  queryStringParameters?: Record<string, string | undefined> | null;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
}

export interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function normalizeNetlifyApiPath(rawPath = '', rawUrl = ''): string {
  let candidate = rawPath;
  if (!candidate && rawUrl) {
    try {
      candidate = new URL(rawUrl).pathname;
    } catch {
      candidate = rawUrl;
    }
  }

  return (
    candidate
      .replace(/^\/\.netlify\/functions\/api/, '')
      .replace(/^\/api/, '')
      .replace(/\/+$/, '') || '/'
  );
}

function parseEventBody(event: NetlifyEvent): Record<string, unknown> {
  if (!event.body) return {};
  const decoded = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  const method = (event.httpMethod || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  const route = normalizeNetlifyApiPath(event.path, event.rawUrl);

  if (route === '/health' && method === 'GET') {
    const result = getHealthResponse();
    return {
      statusCode: result.status,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.body),
    };
  }

  if (route === '/sheikh-ai/status' && method === 'GET') {
    const forceRefresh = event.queryStringParameters?.refresh === '1';
    const result = await getSheikhAiStatusResponse({ forceRefresh });
    return {
      statusCode: result.status,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.body),
    };
  }

  if (route === '/sheikh-ai/chat' && method === 'POST') {
    const payload = parseEventBody(event);
    const result = await processSheikhAiChat(payload);
    return {
      statusCode: result.status,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.body),
    };
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      errorCode: 'NOT_FOUND',
      error: `المسار غير موجود: ${route}`,
    }),
  };
}
