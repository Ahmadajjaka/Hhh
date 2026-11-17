import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQiblaBearing,
  calculateDistanceToKaaba,
  calculatePrayerTimes,
  getHijriDate,
  getNextPrayerCountdown,
  POPULAR_CITIES,
} from './prayerCalculator';

test('Qibla bearing from Cairo is approximately southeast (~136 deg)', () => {
  const cairo = POPULAR_CITIES.find((c) => c.nameEnglish === 'Cairo')!;
  const bearing = calculateQiblaBearing(cairo.latitude, cairo.longitude);
  assert.ok(bearing > 130 && bearing < 140, `Expected ~136 deg, got ${bearing}`);
});

test('Distance to Kaaba from Makkah is ~0 km', () => {
  const makkah = POPULAR_CITIES.find((c) => c.nameEnglish === 'Makkah')!;
  const dist = calculateDistanceToKaaba(makkah.latitude, makkah.longitude);
  assert.ok(dist < 5, `Expected <5 km, got ${dist}`);
});

test('calculatePrayerTimes returns all 6 prayer dates in chronological order', () => {
  const makkah = POPULAR_CITIES.find((c) => c.nameEnglish === 'Makkah')!;
  const times = calculatePrayerTimes(new Date(2026, 5, 15), makkah.latitude, makkah.longitude, 'ummAlQura');
  assert.ok(times.fajr.getTime() < times.sunrise.getTime());
  assert.ok(times.sunrise.getTime() < times.dhuhr.getTime());
  assert.ok(times.dhuhr.getTime() < times.asr.getTime());
  assert.ok(times.asr.getTime() < times.maghrib.getTime());
  assert.ok(times.maghrib.getTime() < times.isha.getTime());
});

test('getHijriDate returns valid day, month, and year', () => {
  const hijri = getHijriDate(new Date(2026, 2, 10));
  assert.ok(hijri.day >= 1 && hijri.day <= 30);
  assert.ok(hijri.month >= 1 && hijri.month <= 12);
  assert.ok(hijri.year >= 1445 && hijri.year <= 1450);
  assert.ok(hijri.fullDateArabic.includes('هـ'));
});

test('getNextPrayerCountdown identifies upcoming prayer correctly', () => {
  const now = new Date(2026, 5, 15, 10, 0, 0); // 10:00 AM
  const prayerTimes = {
    fajr: new Date(2026, 5, 15, 4, 30, 0),
    sunrise: new Date(2026, 5, 15, 5, 50, 0),
    dhuhr: new Date(2026, 5, 15, 12, 15, 0),
    asr: new Date(2026, 5, 15, 15, 30, 0),
    maghrib: new Date(2026, 5, 15, 18, 50, 0),
    isha: new Date(2026, 5, 15, 20, 20, 0),
  };
  const next = getNextPrayerCountdown(prayerTimes, now);
  assert.equal(next.nextPrayerKey, 'dhuhr');
  assert.equal(next.nextPrayerNameArabic, 'الظهر');
  assert.ok(next.timeRemainingSeconds > 0);
});
