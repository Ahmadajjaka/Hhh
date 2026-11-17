import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { handler, normalizeNetlifyApiPath } from '../netlify/functions/api.ts';

test('normalizeNetlifyApiPath handles /api/* and /.netlify/functions/api/* cleanly', () => {
  assert.equal(normalizeNetlifyApiPath('/api/health'), '/health');
  assert.equal(normalizeNetlifyApiPath('/.netlify/functions/api/sheikh-ai/status/'), '/sheikh-ai/status');
  assert.equal(normalizeNetlifyApiPath('', 'https://noor.netlify.app/api/sheikh-ai/chat'), '/sheikh-ai/chat');
});

test('Netlify API function responds cleanly to OPTIONS preflight, /health, /sheikh-ai/status, invalid chat, and 404', async () => {
  const preflight = await handler({ httpMethod: 'OPTIONS', path: '/api/sheikh-ai/chat' });
  assert.equal(preflight.statusCode, 204);
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], '*');

  const health = await handler({ httpMethod: 'GET', path: '/api/health' });
  assert.equal(health.statusCode, 200);
  assert.deepEqual(JSON.parse(health.body), { ok: true });

  const status = await handler({
    httpMethod: 'GET',
    path: '/.netlify/functions/api/sheikh-ai/status',
    queryStringParameters: {},
  });
  assert.equal(status.statusCode, 200);
  const statusJson = JSON.parse(status.body);
  assert.ok(Array.isArray(statusJson.models));
  assert.ok(statusJson.models.length >= 1);

  const invalidChat = await handler({
    httpMethod: 'POST',
    path: '/api/sheikh-ai/chat',
    body: JSON.stringify({ messages: [] }),
  });
  assert.equal(invalidChat.statusCode, 400);
  assert.equal(JSON.parse(invalidChat.body).errorCode, 'INVALID_REQUEST');

  const missing = await handler({ httpMethod: 'GET', path: '/api/nonexistent' });
  assert.equal(missing.statusCode, 404);
  assert.equal(JSON.parse(missing.body).errorCode, 'NOT_FOUND');
});

test('Netlify deployment configuration defines build output, functions, API redirect before SPA fallback, and _redirects', () => {
  const netlifyToml = fs.readFileSync(path.resolve('netlify.toml'), 'utf8');
  assert.match(netlifyToml, /publish\s*=\s*"dist"/);
  assert.match(netlifyToml, /functions\s*=\s*"netlify\/functions"/);

  const apiRedirectIdx = netlifyToml.indexOf('from = "/api/*"');
  const spaFallbackIdx = netlifyToml.indexOf('from = "/*"');
  assert.ok(apiRedirectIdx !== -1 && spaFallbackIdx !== -1 && apiRedirectIdx < spaFallbackIdx);

  const redirectsFile = fs.readFileSync(path.resolve('public/_redirects'), 'utf8');
  assert.match(redirectsFile, /\/api\/\*\s+\/\.netlify\/functions\/api\/:splat\s+200!/);
  assert.match(redirectsFile, /\/\*\s+\/index\.html\s+200/);
});

test('Android Capacitor APK project, Gradle wrapper, npm scripts, and CI workflow are ready', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  assert.ok(pkg.scripts['android:sync']);
  assert.ok(pkg.scripts['android:apk']);
  assert.ok(pkg.scripts['android:aab']);

  assert.ok(fs.existsSync(path.resolve('capacitor.config.ts')));
  assert.ok(fs.existsSync(path.resolve('android/app/build.gradle')));
  assert.ok(fs.existsSync(path.resolve('android/app/src/main/AndroidManifest.xml')));
  assert.ok(fs.existsSync(path.resolve('.github/workflows/build-apk.yml')));
});
