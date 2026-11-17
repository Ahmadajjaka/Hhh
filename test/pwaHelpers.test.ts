import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ANDROID_API_BASE_URL,
  detectInstallPlatform,
  getShareableInstallUrl,
  isStandaloneDisplayMode,
  parseInitialScreenFromSearch,
  resolveApiUrl,
} from '../src/utils/pwaHelpers';

test('isStandaloneDisplayMode detects standalone display and iOS navigator mode', () => {
  assert.equal(isStandaloneDisplayMode(false, false), false);
  assert.equal(isStandaloneDisplayMode(true, false), true);
  assert.equal(isStandaloneDisplayMode(false, true), true);
});

test('detectInstallPlatform differentiates installed, android, ios, and desktop modes', () => {
  assert.equal(detectInstallPlatform('Android Chrome', true, false), 'installed');
  assert.equal(detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', false, false), 'ios_safari');
  assert.equal(detectInstallPlatform('Mozilla/5.0 (Linux; Android 14)', false, true), 'android_prompt');
  assert.equal(detectInstallPlatform('Mozilla/5.0 (Linux; Android 14)', false, false), 'android_manual');
  assert.equal(detectInstallPlatform('Mozilla/5.0 (X11; Linux x86_64)', false, true), 'desktop_prompt');
});

test('getShareableInstallUrl normalizes origin root cleanly', () => {
  assert.equal(getShareableInstallUrl('https://example.com/quran?page=5#top'), 'https://example.com/');
});

test('resolveApiUrl preserves relative path on web and prepends server origin on Capacitor Android', () => {
  assert.equal(
    resolveApiUrl('/api/sheikh-ai/status', { isNative: false, protocol: 'https:' }),
    '/api/sheikh-ai/status'
  );
  assert.equal(
    resolveApiUrl('/api/sheikh-ai/chat', { isNative: true, protocol: 'https:' }),
    `${DEFAULT_ANDROID_API_BASE_URL}/api/sheikh-ai/chat`
  );
  assert.equal(
    resolveApiUrl('api/health', {
      isNative: false,
      protocol: 'capacitor:',
      apiBaseUrl: 'https://custom.noor.app/',
    }),
    'https://custom.noor.app/api/health'
  );
});

test('parseInitialScreenFromSearch validates shortcut screens and optional tabs', () => {
  assert.deepEqual(parseInitialScreenFromSearch('?screen=quran'), {
    screen: 'quran',
    tab: undefined,
    category: undefined,
  });
  assert.deepEqual(parseInitialScreenFromSearch('?screen=duas_ruqyah&tab=ruqyah'), {
    screen: 'duas_ruqyah',
    tab: 'ruqyah',
    category: undefined,
  });
  assert.equal(parseInitialScreenFromSearch('?screen=unknown_hack'), null);
});
