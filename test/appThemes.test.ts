import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_CREATOR_NAME,
  APP_DEDICATION_TEXT,
  APP_THEMES,
  DEFAULT_APP_THEME_ID,
  getAppTheme,
  isValidAppThemeId,
  shouldAutoSkipSplash,
} from '../src/utils/appThemes';

test('APP_THEMES contains multiple dark and light Islamic themes with valid swatches', () => {
  assert.ok(APP_THEMES.length >= 5);
  const ids = new Set(APP_THEMES.map((t) => t.id));
  assert.equal(ids.size, APP_THEMES.length);
  assert.ok(APP_THEMES.some((t) => t.isDark));
  assert.ok(APP_THEMES.some((t) => !t.isDark));
  for (const theme of APP_THEMES) {
    assert.ok(theme.name.length > 0);
    assert.equal(theme.swatches.length, 3);
    assert.match(theme.bg, /^#[0-9a-f]{6}$/i);
  }
});

test('getAppTheme and isValidAppThemeId resolve valid and fallback IDs cleanly', () => {
  assert.equal(isValidAppThemeId('sapphire'), true);
  assert.equal(isValidAppThemeId('parchment'), true);
  assert.equal(isValidAppThemeId('invalid_theme'), false);
  assert.equal(getAppTheme('obsidian').id, 'obsidian');
  assert.equal(getAppTheme('unknown').id, DEFAULT_APP_THEME_ID);
});

test('designer attribution and Waqf dedication constants match user request', () => {
  assert.equal(APP_CREATOR_NAME, 'أحمد نوار المامو');
  assert.equal(APP_DEDICATION_TEXT, 'وهذا العمل لوجه الله تعالى');
});

test('shouldAutoSkipSplash skips on autostart=1 or explicit deep-link screen', () => {
  assert.equal(shouldAutoSkipSplash(''), false);
  assert.equal(shouldAutoSkipSplash('?screen=home'), false);
  assert.equal(shouldAutoSkipSplash('?autostart=1'), true);
  assert.equal(shouldAutoSkipSplash('?skipSplash=1'), true);
  assert.equal(shouldAutoSkipSplash('?screen=quran'), true);
});
