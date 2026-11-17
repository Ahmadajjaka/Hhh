import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runQuranIntegrityChecks,
  CANONICAL_SAJDAHS,
  normalizeArabicForSearch,
  filterPageAyahsBySurah,
} from '../src/utils/quranIntegrity.ts';
import { ALL_SURAHS, RECITERS, ADHAN_RECORDINGS } from '../src/data/quranMeta.ts';
import { removeLeadingBasmalah } from '../src/utils/adhkarPrayerSync.ts';
import {
  calculatePrayerTimes,
  getTimeZoneOffsetHours,
  getCityWallClockDate,
  CALCULATION_METHODS,
  POPULAR_CITIES,
} from '../src/utils/prayerCalculator.ts';
import {
  SHEIKH_DUAS,
  RUQYAH_AUDIO_TRACKS,
  RUQYAH_QURAN_SECTIONS,
  RUQYAH_PROPHETIC_DUAS,
} from '../src/data/duasAndRuqyahData.ts';
import {
  formatAudioDuration,
  filterSheikhAudioTracks,
  getNextSequentialAyahIndex,
  validateRuqyahQuranSections,
} from '../src/utils/duasRuqyahHelpers.ts';
import {
  detectInstallPlatform,
  getShareableInstallUrl,
  isStandaloneDisplayMode,
} from '../src/utils/pwaHelpers.ts';
import {
  clampMushafFontSize,
  formatMushafHeaderSummary,
  getMushafThemeSurface,
} from '../src/utils/mushafReaderHelpers.ts';
import fs from 'node:fs';
import path from 'node:path';

test('Holy Quran Integrity - 114 Surahs and 6236 Ayahs count', () => {
  const report = runQuranIntegrityChecks();
  assert.equal(report.passed, true, 'All integrity checks must pass');
  assert.equal(report.totalSurahs, 114, 'Must have exactly 114 Surahs');
  assert.equal(report.totalAyahs, 6236, 'Must have exactly 6,236 Ayahs');
  assert.equal(report.totalPages, 604, 'Must have 604 pages matching Madinah Mushaf');
  assert.equal(report.totalJuz, 30, 'Must have 30 Juz');
  assert.equal(report.meccanCount, 86, 'Must have 86 Meccan Surahs');
  assert.equal(report.medinanCount, 28, 'Must have 28 Medinan Surahs');
});

test('Holy Quran Integrity - Sequential Surah Numbering', () => {
  for (let i = 0; i < ALL_SURAHS.length; i++) {
    assert.equal(ALL_SURAHS[i].number, i + 1, `Surah at index ${i} must have number ${i + 1}`);
  }
  assert.equal(ALL_SURAHS[0].name, 'الفَاتِحَة');
  assert.equal(ALL_SURAHS[113].name, 'النَّاس');
});

test('Holy Quran Integrity - Basmalah Rule on Surah 2 Ayah 1', () => {
  const rawAyah1 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ';
  const cleaned = removeLeadingBasmalah(rawAyah1, 2, 1);
  assert.equal(cleaned, 'الٓمٓ', 'Leading Basmalah must be stripped from Ayah 1 of Surah Al-Baqarah');
});

test('Holy Quran Integrity - Basmalah Preserved on Al-Fatihah', () => {
  const fatihahAyah1 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  const cleaned = removeLeadingBasmalah(fatihahAyah1, 1, 1);
  assert.equal(cleaned, fatihahAyah1, 'Basmalah in Surah 1 must be preserved as it is Ayah 1');
});

test('Holy Quran Integrity - Reciters Library includes all requested Qaris', () => {
  const reciterIds = RECITERS.map((r) => r.id);
  assert.ok(reciterIds.includes('abdul_basit_murattal'), 'Must include Abdul Basit Murattal');
  assert.ok(reciterIds.includes('abdul_basit_mujawwad'), 'Must include Abdul Basit Mujawwad');
  assert.ok(reciterIds.includes('mishary_alafasy'), 'Must include Mishary Alafasy');
  assert.ok(reciterIds.includes('al_husary'), 'Must include Al-Husary');
  assert.ok(reciterIds.includes('el_minshawi'), 'Must include Minshawy');
  assert.ok(reciterIds.includes('al_sudais'), 'Must include Al-Sudais');
  assert.ok(reciterIds.includes('maher_al_muaiqly'), 'Must include Maher Al-Muaiqly');
  assert.ok(reciterIds.includes('saud_al_shuraim'), 'Must include Saud Al-Shuraim');
});

test('Holy Quran Integrity - Adhan Library includes authentic recordings', () => {
  const adhanIds = ADHAN_RECORDINGS.map((a) => a.id);
  assert.ok(adhanIds.includes('saudi_makkah'), 'Must include Makkah Adhan');
  assert.ok(adhanIds.includes('saudi_madinah'), 'Must include Madinah Adhan');
  assert.ok(adhanIds.includes('ali_mulla'), 'Must include Ali Mulla Adhan');
  assert.ok(adhanIds.includes('mishary_adhan'), 'Must include Mishary Adhan');
  assert.ok(adhanIds.includes('quds'), 'Must include Al-Aqsa Adhan');
});

test('Holy Quran Integrity - Canonical Sajdah locations', () => {
  assert.equal(CANONICAL_SAJDAHS.length, 15, 'Must have 15 canonical Sajdah points');
});

test('Prayer Calculator - Makkah timezone offset & ordered local prayer times', () => {
  const makkah = POPULAR_CITIES[0];
  const sampleDate = new Date('2026-11-13T12:00:00Z');
  const offset = getTimeZoneOffsetHours(sampleDate, makkah.timeZone);
  assert.equal(offset, 3, 'Makkah (Asia/Riyadh) offset must be +3 UTC');

  const times = calculatePrayerTimes(
    sampleDate,
    makkah.latitude,
    makkah.longitude,
    'ummAlQura',
    {},
    makkah.timeZone
  );

  assert.ok(times.fajr.getHours() >= 4 && times.fajr.getHours() <= 6, 'Makkah Fajr hour must be 04..06');
  assert.ok(times.maghrib.getHours() >= 17 && times.maghrib.getHours() <= 19, 'Makkah Maghrib hour must be 17..19');
  assert.ok(times.fajr < times.sunrise && times.sunrise < times.dhuhr && times.dhuhr < times.asr && times.asr < times.maghrib && times.maghrib < times.isha);
});

test('Prayer Calculator - Syria cities, Asia/Damascus wall clock & Syrian calculation method', () => {
  const syriaCities = POPULAR_CITIES.filter((c) => c.countryArabic === 'سوريا');
  assert.ok(syriaCities.length >= 6, 'Must include major Syrian governorates');
  const damascus = syriaCities.find((c) => c.nameEnglish === 'Damascus');
  assert.ok(damascus, 'Damascus must be present');
  assert.equal(damascus.timeZone, 'Asia/Damascus');
  assert.ok(CALCULATION_METHODS.syria, 'Syria calculation method must exist');

  const utcNoon = new Date('2026-11-13T12:00:00Z');
  const offset = getTimeZoneOffsetHours(utcNoon, damascus.timeZone);
  assert.equal(offset, 3, 'Damascus offset must be +3 UTC');

  const damascusWall = getCityWallClockDate(utcNoon, damascus.timeZone);
  assert.equal(damascusWall.getHours(), 15, '12:00 UTC must map to 15:00 Damascus wall clock');

  const times = calculatePrayerTimes(
    damascusWall,
    damascus.latitude,
    damascus.longitude,
    'syria',
    {},
    damascus.timeZone
  );
  assert.ok(times.fajr < times.sunrise && times.sunrise < times.dhuhr && times.dhuhr < times.asr && times.asr < times.maghrib && times.maghrib < times.isha);
});

test('filterPageAyahsBySurah isolates clicked Surah on shared Mushaf pages', () => {
  const sharedPage604 = [
    { surahNumber: 112, numberInSurah: 1, text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ' },
    { surahNumber: 113, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ' },
    { surahNumber: 114, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ' },
  ];

  const onlyNas = filterPageAyahsBySurah(sharedPage604, 114);
  assert.equal(onlyNas.length, 1);
  assert.equal(onlyNas[0].surahNumber, 114);

  const fullPage = filterPageAyahsBySurah(sharedPage604, null);
  assert.equal(fullPage.length, 3);
});

test('Arabic Search Normalization strips tashkeel and normalizes hamza/alif', () => {
  const uthmani = 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ';
  const normalized = normalizeArabicForSearch(uthmani);
  assert.ok(normalized.includes('الله'), 'Must normalize Allah');
  assert.ok(normalized.includes('الحي'), 'Must normalize Al-Hayy');
  assert.ok(normalized.includes('القيوم'), 'Must normalize Al-Qayyum');
});

test('Duas & Ruqyah Helpers - Duration formatting handles standard & edge inputs', () => {
  assert.equal(formatAudioDuration(0), '00:00');
  assert.equal(formatAudioDuration(65), '01:05');
  assert.equal(formatAudioDuration(3661), '1:01:01');
  assert.equal(formatAudioDuration(-5), '00:00');
  assert.equal(formatAudioDuration(Number.NaN), '00:00');
});

test('Duas & Ruqyah Helpers - Filter Sheikh tracks by query, occasion, and favorites', () => {
  const bySudais = filterSheikhAudioTracks(SHEIKH_DUAS, 'السديس', 'all', false, []);
  assert.ok(bySudais.length >= 1, 'Search for السديس must match Sudais recordings');
  assert.ok(bySudais.every((t) => t.sheikhNameArabic.includes('السديس')));

  const qunootOnly = filterSheikhAudioTracks(SHEIKH_DUAS, '', 'qunoot', false, []);
  assert.ok(qunootOnly.length >= 1, 'Qunoot filter must return Qunoot tracks');
  assert.ok(qunootOnly.every((t) => t.categoryId === 'qunoot'));

  const favOnly = filterSheikhAudioTracks(SHEIKH_DUAS, '', 'all', true, [SHEIKH_DUAS[0].id]);
  assert.equal(favOnly.length, 1);
  assert.equal(favOnly[0].id, SHEIKH_DUAS[0].id);
});

test('Duas & Ruqyah Helpers - Sequential ayah playback stepping & repeat', () => {
  assert.equal(getNextSequentialAyahIndex(0, 5, false), 1);
  assert.equal(getNextSequentialAyahIndex(2, 5, true), 2);
  assert.equal(getNextSequentialAyahIndex(4, 5, false), null);
  assert.equal(getNextSequentialAyahIndex(-1, 5, false), null);
});

test('Duas & Ruqyah Data Integrity - Audio URLs, Quranic Ruqyah verses, and Prophetic Ruqyah', () => {
  assert.ok(SHEIKH_DUAS.length >= 10, 'Must provide rich Sheikh Duas catalog');
  assert.ok(RUQYAH_AUDIO_TRACKS.length >= 6, 'Must provide multiple Sheikh Ruqyah recordings');

  for (const track of [...SHEIKH_DUAS, ...RUQYAH_AUDIO_TRACKS]) {
    assert.ok(track.audioUrl.startsWith('https://'), `Track ${track.id} must use HTTPS audio URL`);
    assert.ok(track.sheikhNameArabic.trim().length > 0, `Track ${track.id} must name the Sheikh`);
    assert.ok(track.titleArabic.trim().length > 0, `Track ${track.id} must have Arabic title`);
  }

  const ruqyahCheck = validateRuqyahQuranSections(RUQYAH_QURAN_SECTIONS);
  assert.equal(ruqyahCheck.valid, true, ruqyahCheck.reason || 'Ruqyah Quran sections must validate');
  assert.ok(ruqyahCheck.totalAyahs >= 30, 'Ruqyah Quranic text must include complete canonical verses');

  const allAyahRefs = RUQYAH_QURAN_SECTIONS.flatMap((s) => s.ayahs.map((a) => `${a.surahNumber}:${a.ayahNumber}`));
  assert.ok(allAyahRefs.includes('1:1'), 'Must include Al-Fatihah');
  assert.ok(allAyahRefs.includes('2:255'), 'Must include Ayat Al-Kursi');
  assert.ok(allAyahRefs.includes('2:286'), 'Must include closing Al-Baqarah');
  assert.ok(allAyahRefs.includes('114:1'), 'Must include Al-Muawwidhat');

  assert.ok(RUQYAH_PROPHETIC_DUAS.length >= 5, 'Must include authentic Prophetic Ruqyah Duas');
  for (const dua of RUQYAH_PROPHETIC_DUAS) {
    assert.ok(dua.repeatCount >= 1, `Prophetic Dua ${dua.id} must specify repeatCount >= 1`);
    assert.ok(dua.reference.trim().length > 0, `Prophetic Dua ${dua.id} must cite Hadith source`);
  }
});

test('PWA Helpers - Platform detection, standalone mode, and required icon files', () => {
  assert.equal(isStandaloneDisplayMode(true, false), true);
  assert.equal(isStandaloneDisplayMode(false, true), true);
  assert.equal(isStandaloneDisplayMode(false, false), false);

  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', false, false),
    'ios_safari'
  );
  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (Linux; Android 14) Chrome/120', false, true),
    'android_prompt'
  );
  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (Linux; Android 14) Chrome/120', false, false),
    'android_manual'
  );
  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (Linux; Android 14) Chrome/120', true, true),
    'installed'
  );

  assert.equal(
    getShareableInstallUrl('https://noor.example.com/surah?foo=1'),
    'https://noor.example.com/'
  );

  const requiredIcons = [
    'public/icon.svg',
    'public/icon-maskable.svg',
    'public/pwa-192x192.png',
    'public/pwa-512x512.png',
    'public/pwa-maskable-512x512.png',
    'public/apple-touch-icon.png',
  ];
  for (const relPath of requiredIcons) {
    const abs = path.resolve(process.cwd(), relPath);
    assert.equal(fs.existsSync(abs), true, `Missing required PWA asset: ${relPath}`);
    assert.ok(fs.statSync(abs).size > 500, `PWA asset appears empty: ${relPath}`);
  }
});

test('Full-Screen Mushaf Reader Helpers - Font clamping, themes, and header summary', () => {
  assert.equal(clampMushafFontSize(10), 18);
  assert.equal(clampMushafFontSize(60), 44);
  assert.equal(clampMushafFontSize(28), 28);
  assert.equal(clampMushafFontSize(Number.NaN), 26);

  const madani = getMushafThemeSurface('madani');
  assert.equal(madani.isDark, false);
  assert.ok(madani.viewportBg.length > 0 && madani.paperBg.length > 0);

  const night = getMushafThemeSurface('night');
  assert.equal(night.isDark, true);
  assert.ok(night.viewportBg.length > 0 && night.paperBg.length > 0);

  assert.equal(
    formatMushafHeaderSummary(['البَقَرَة', 'البَقَرَة'], 2, 1),
    'سُورَةُ البَقَرَة · صفحة 2 · الجزء 1'
  );
  assert.equal(
    formatMushafHeaderSummary(['الإِخْلَاص', 'الفَلَق', 'النَّاس'], 604, 30),
    'سُورَةُ الإِخْلَاص · النَّاس · صفحة 604 · الجزء 30'
  );
  assert.equal(
    formatMushafHeaderSummary([], 1, 1),
    'المصحف الشريف · صفحة 1 · الجزء 1'
  );
});
