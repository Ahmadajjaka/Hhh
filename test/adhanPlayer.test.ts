import test from 'node:test';
import assert from 'node:assert/strict';
import { ADHAN_RECORDINGS } from '../src/data/quranMeta.ts';
import {
  buildAdhanCandidateUrls,
  getAdhanRecordingById,
  markAdhanEventTriggered,
} from '../src/utils/adhanPlayer.ts';

test('Every ADHAN_RECORDINGS item has valid HTTPS primary and fallback audio URLs without deprecated aladhan CDN', () => {
  assert.equal(ADHAN_RECORDINGS.length, 7);
  for (const item of ADHAN_RECORDINGS) {
    assert.ok(item.audioUrl.startsWith('https://'), `${item.id} audioUrl must use HTTPS`);
    assert.ok(item.fallbackAudioUrl?.startsWith('https://'), `${item.id} fallbackAudioUrl must use HTTPS`);
    assert.ok(!item.audioUrl.includes('cdn.aladhan.com'), `${item.id} must not use broken aladhan CDN`);
    assert.ok(item.fallbackAudioUrl && !item.fallbackAudioUrl.includes('cdn.aladhan.com'));
  }
});

test('buildAdhanCandidateUrls and getAdhanRecordingById resolve cleanly with deduplicated URLs', () => {
  const makkah = getAdhanRecordingById('saudi_makkah');
  assert.equal(makkah.id, 'saudi_makkah');

  const abdulBasit = getAdhanRecordingById('abdul_basit_adhan');
  assert.equal(abdulBasit.id, 'abdul_basit_adhan');
  assert.match(abdulBasit.titleArabic, /عبد الباسط عبد الصمد/);
  assert.equal(abdulBasit.audioUrl, 'https://archive.org/download/Azaan/adhaan.mp3');

  const abdulBasitFajr = getAdhanRecordingById('abdul_basit_fajr_adhan');
  assert.equal(abdulBasitFajr.id, 'abdul_basit_fajr_adhan');
  assert.match(abdulBasitFajr.titleArabic, /الفجر/);
  assert.equal(abdulBasitFajr.audioUrl, 'https://archive.org/download/athan_sound/f_abd_el_basset.mp3');

  const urls = buildAdhanCandidateUrls(abdulBasit);
  assert.equal(urls.length, 2);
  assert.notEqual(urls[0], urls[1]);

  const fallback = getAdhanRecordingById('unknown_id');
  assert.equal(fallback.id, ADHAN_RECORDINGS[0].id);
});

test('markAdhanEventTriggered deduplicates identical prayer events across callers', () => {
  const uniqueId = `test-adhan-${Date.now()}-${Math.random()}`;
  assert.equal(markAdhanEventTriggered(uniqueId), true);
  assert.equal(markAdhanEventTriggered(uniqueId), false);
});
