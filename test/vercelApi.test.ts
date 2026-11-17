import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GET as healthGet, OPTIONS as healthOptions } from '../api/health.ts';
import { GET as statusGet, OPTIONS as statusOptions } from '../api/sheikh-ai/status.ts';
import { POST as chatPost, OPTIONS as chatOptions } from '../api/sheikh-ai/chat.ts';
import {
  POST as chatStreamPost,
  OPTIONS as chatStreamOptions,
} from '../api/sheikh-ai/chat-stream.ts';

async function withEnvAndMockFetch<T>(
  envPatch: Record<string, string | undefined>,
  mockFetch: typeof fetch | null,
  fn: () => Promise<T>
): Promise<T> {
  const prevEnv: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(envPatch)) {
    prevEnv[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const origFetch = globalThis.fetch;
  if (mockFetch) globalThis.fetch = mockFetch;

  try {
    return await fn();
  } finally {
    globalThis.fetch = origFetch;
    for (const [k, v] of Object.entries(prevEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('Vercel api/health handles OPTIONS preflight and GET health check', async () => {
  const preflight = healthOptions();
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');

  const res = healthGet();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.deepEqual(await res.json(), { ok: true });
});

test('Vercel api/sheikh-ai/status reflects server-side GROQ_API_KEY without ever leaking the secret', async () => {
  const preflight = statusOptions();
  assert.equal(preflight.status, 204);

  const secretKey = 'gsk_super_secret_vercel_key_12345';
  await withEnvAndMockFetch(
    { GROQ_API_KEY: secretKey, AGNES_API_KEY: undefined, GEMINI_API_KEY: undefined },
    async (input) => {
      assert.match(String(input), /api\.groq\.com\/openai\/v1\/models/);
      return new Response(
        JSON.stringify({ data: [{ id: 'llama-3.1-8b-instant' }, { id: 'openai/gpt-oss-120b' }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    },
    async () => {
      const res = await statusGet(new Request('https://example.vercel.app/api/sheikh-ai/status?refresh=1'));
      assert.equal(res.status, 200);
      const rawBody = await res.text();
      assert.equal(rawBody.includes(secretKey), false, 'status response must never leak GROQ_API_KEY');
      const data = JSON.parse(rawBody) as {
        configured: boolean;
        groqConfigured: boolean;
        provider: string;
        models: Array<{ id: string }>;
      };
      assert.equal(data.configured, true);
      assert.equal(data.groqConfigured, true);
      assert.equal(data.provider, 'groq');
      assert.ok(data.models.some((m) => m.id === 'llama-3.1-8b-instant'));
    }
  );
});

test('Vercel api/sheikh-ai/chat handles invalid body, missing keys, and server-side Groq completions', async () => {
  const preflight = chatOptions();
  assert.equal(preflight.status, 204);

  const invalidRes = await chatPost(
    new Request('https://example.vercel.app/api/sheikh-ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    })
  );
  assert.equal(invalidRes.status, 400);
  const invalidJson = (await invalidRes.json()) as { errorCode: string };
  assert.equal(invalidJson.errorCode, 'INVALID_REQUEST');

  await withEnvAndMockFetch(
    { GROQ_API_KEY: undefined, AGNES_API_KEY: undefined, GEMINI_API_KEY: undefined },
    null,
    async () => {
      const noKeyRes = await chatPost(
        new Request('https://example.vercel.app/api/sheikh-ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personaId: 'murabbi',
            model: 'auto',
            messages: [{ role: 'user', content: 'السلام عليكم' }],
          }),
        })
      );
      assert.equal(noKeyRes.status, 503);
      assert.equal(((await noKeyRes.json()) as { errorCode: string }).errorCode, 'MISSING_API_KEY');
    }
  );

  const secretKey = 'gsk_server_only_secret_987654321';
  await withEnvAndMockFetch(
    { GROQ_API_KEY: secretKey, AGNES_API_KEY: undefined, GEMINI_API_KEY: undefined },
    async (input, init) => {
      assert.equal(String(input), 'https://api.groq.com/openai/v1/chat/completions');
      const auth = (init?.headers as Record<string, string>)?.Authorization;
      assert.equal(auth, `Bearer ${secretKey}`);
      return new Response(
        JSON.stringify({
          model: 'llama-3.1-8b-instant',
          choices: [{ message: { content: 'وعليكم السلام ورحمة الله وبركاته يا بنيّ.' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    },
    async () => {
      const okRes = await chatPost(
        new Request('https://example.vercel.app/api/sheikh-ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personaId: 'murabbi',
            model: 'auto',
            messages: [{ role: 'user', content: 'السلام عليكم' }],
          }),
        })
      );
      assert.equal(okRes.status, 200);
      const raw = await okRes.text();
      assert.equal(raw.includes(secretKey), false);
      const body = JSON.parse(raw) as { reply: string; provider: string; model: string };
      assert.equal(body.provider, 'groq');
      assert.equal(body.model, 'llama-3.1-8b-instant');
      assert.match(body.reply, /وعليكم السلام/);
    }
  );
});

test('Vercel api/sheikh-ai/chat-stream emits SSE meta, delta, and done chunks over ReadableStream', async () => {
  const preflight = chatStreamOptions();
  assert.equal(preflight.status, 204);

  const secretKey = 'gsk_stream_secret_key_5555555';
  const encoder = new TextEncoder();

  await withEnvAndMockFetch(
    { GROQ_API_KEY: secretKey, AGNES_API_KEY: undefined, GEMINI_API_KEY: undefined },
    async (input, init) => {
      assert.equal(String(input), 'https://api.groq.com/openai/v1/chat/completions');
      const auth = (init?.headers as Record<string, string>)?.Authorization;
      assert.equal(auth, `Bearer ${secretKey}`);

      const upstreamStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"model":"llama-3.1-8b-instant","choices":[{"delta":{"content":"وعليكم "}}]}\n\n'
            )
          );
          controller.enqueue(
            encoder.encode(
              'data: {"model":"llama-3.1-8b-instant","choices":[{"delta":{"content":"السلام"}}]}\n\n'
            )
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(upstreamStream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    },
    async () => {
      const res = await chatStreamPost(
        new Request('https://example.vercel.app/api/sheikh-ai/chat-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personaId: 'murabbi',
            model: 'auto',
            messages: [{ role: 'user', content: 'مرحبا' }],
          }),
        })
      );

      assert.equal(res.status, 200);
      assert.match(res.headers.get('Content-Type') || '', /text\/event-stream/);
      const sseText = await res.text();
      assert.equal(sseText.includes(secretKey), false);
      assert.match(sseText, /"type":"meta"/);
      assert.match(sseText, /"type":"delta"/);
      assert.match(sseText, /"type":"done"/);
      assert.match(sseText, /وعليكم السلام/);
    }
  );
});

test('vercel.json configures Vite output, SPA fallback excluding /api/, and PWA headers', () => {
  const vercelConfig = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8')) as {
    framework: string;
    buildCommand: string;
    outputDirectory: string;
    rewrites: Array<{ source: string; destination: string }>;
    headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  };

  assert.equal(vercelConfig.framework, 'vite');
  assert.equal(vercelConfig.buildCommand, 'npm run build');
  assert.equal(vercelConfig.outputDirectory, 'dist');

  const spaRewrite = vercelConfig.rewrites.find((r) => r.destination === '/index.html');
  assert.ok(spaRewrite);
  assert.equal(spaRewrite.source, '/((?!api/).*)');
  assert.ok(vercelConfig.headers.some((h) => h.source === '/sw.js'));
  assert.ok(vercelConfig.headers.some((h) => h.source === '/manifest.webmanifest'));
});
