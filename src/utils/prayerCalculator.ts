/**
 * Solar & Prayer Calculation Engine
 * Implements astronomical algorithms for Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha,
 * Qibla bearing calculation, and Hijri calendar conversion.
 */

export interface CalculationMethod {
  id: string;
  nameArabic: string;
  fajrAngle: number;
  ishaAngle: number;
  ishaInterval?: number; // minutes after maghrib if applicable (e.g. Umm Al-Qura)
}

export const CALCULATION_METHODS: Record<string, CalculationMethod> = {
  ummAlQura: {
    id: 'ummAlQura',
    nameArabic: 'أم القرى (مكة المكرمة)',
    fajrAngle: 18.5,
    ishaAngle: 0,
    ishaInterval: 90, // 90 minutes after Maghrib
  },
  mwl: {
    id: 'mwl',
    nameArabic: 'رابطة العالم الإسلامي',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
  },
  egyptian: {
    id: 'egyptian',
    nameArabic: 'الهيئة المصرية العامة للمساحة',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
  },
  isna: {
    id: 'isna',
    nameArabic: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
    fajrAngle: 15.0,
    ishaAngle: 15.0,
  },
  gulf: {
    id: 'gulf',
    nameArabic: 'منطقة الخليج العربي',
    fajrAngle: 19.5,
    ishaAngle: 0,
    ishaInterval: 90,
  },
  syria: {
    id: 'syria',
    nameArabic: 'توقيت سوريا (دمشق وبلاد الشام)',
    fajrAngle: 18.0,
    ishaAngle: 17.5,
  },
};

// Kaaba Coordinates
export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

// Predefined Popular Cities with IANA Timezones for exact DST-aware local calculation
export interface CityOption {
  nameArabic: string;
  nameEnglish: string;
  countryArabic: string;
  latitude: number;
  longitude: number;
  timeZone?: string;
}

export const POPULAR_CITIES: CityOption[] = [
  { nameArabic: 'مكة المكرمة', nameEnglish: 'Makkah', countryArabic: 'المملكة العربية السعودية', latitude: 21.4225, longitude: 39.8262, timeZone: 'Asia/Riyadh' },
  { nameArabic: 'المدينة المنورة', nameEnglish: 'Madinah', countryArabic: 'المملكة العربية السعودية', latitude: 24.4672, longitude: 39.6112, timeZone: 'Asia/Riyadh' },
  { nameArabic: 'الرياض', nameEnglish: 'Riyadh', countryArabic: 'المملكة العربية السعودية', latitude: 24.7136, longitude: 46.6753, timeZone: 'Asia/Riyadh' },
  { nameArabic: 'القاهرة', nameEnglish: 'Cairo', countryArabic: 'مصر', latitude: 30.0444, longitude: 31.2357, timeZone: 'Africa/Cairo' },
  { nameArabic: 'دبي', nameEnglish: 'Dubai', countryArabic: 'الإمارات', latitude: 25.2048, longitude: 55.2708, timeZone: 'Asia/Dubai' },
  { nameArabic: 'القدس الشريف', nameEnglish: 'Jerusalem', countryArabic: 'فلسطين', latitude: 31.7683, longitude: 35.2137, timeZone: 'Asia/Jerusalem' },
  { nameArabic: 'عَمّان', nameEnglish: 'Amman', countryArabic: 'الأردن', latitude: 31.9539, longitude: 35.9106, timeZone: 'Asia/Amman' },
  { nameArabic: 'الكويت', nameEnglish: 'Kuwait City', countryArabic: 'الكويت', latitude: 29.3759, longitude: 47.9774, timeZone: 'Asia/Kuwait' },
  { nameArabic: 'الدوحة', nameEnglish: 'Doha', countryArabic: 'قطر', latitude: 25.2854, longitude: 51.5310, timeZone: 'Asia/Qatar' },
  { nameArabic: 'مسقط', nameEnglish: 'Muscat', countryArabic: 'عمان', latitude: 23.5880, longitude: 58.3829, timeZone: 'Asia/Muscat' },
  { nameArabic: 'المنامة', nameEnglish: 'Manama', countryArabic: 'البحرين', latitude: 26.2285, longitude: 50.5860, timeZone: 'Asia/Bahrain' },
  { nameArabic: 'بغداد', nameEnglish: 'Baghdad', countryArabic: 'العراق', latitude: 33.3152, longitude: 44.3661, timeZone: 'Asia/Baghdad' },
  { nameArabic: 'دمشق', nameEnglish: 'Damascus', countryArabic: 'سوريا', latitude: 33.5138, longitude: 36.2765, timeZone: 'Asia/Damascus' },
  { nameArabic: 'حلب', nameEnglish: 'Aleppo', countryArabic: 'سوريا', latitude: 36.2021, longitude: 37.1343, timeZone: 'Asia/Damascus' },
  { nameArabic: 'حمص', nameEnglish: 'Homs', countryArabic: 'سوريا', latitude: 34.7324, longitude: 36.7137, timeZone: 'Asia/Damascus' },
  { nameArabic: 'حماة', nameEnglish: 'Hama', countryArabic: 'سوريا', latitude: 35.1318, longitude: 36.7578, timeZone: 'Asia/Damascus' },
  { nameArabic: 'اللاذقية', nameEnglish: 'Latakia', countryArabic: 'سوريا', latitude: 35.5317, longitude: 35.7918, timeZone: 'Asia/Damascus' },
  { nameArabic: 'طرطوس', nameEnglish: 'Tartus', countryArabic: 'سوريا', latitude: 34.8959, longitude: 35.8867, timeZone: 'Asia/Damascus' },
  { nameArabic: 'دير الزور', nameEnglish: 'Deir ez-Zor', countryArabic: 'سوريا', latitude: 35.3359, longitude: 40.1408, timeZone: 'Asia/Damascus' },
  { nameArabic: 'درعا', nameEnglish: 'Daraa', countryArabic: 'سوريا', latitude: 32.6189, longitude: 36.1021, timeZone: 'Asia/Damascus' },
  { nameArabic: 'بيروت', nameEnglish: 'Beirut', countryArabic: 'لبنان', latitude: 33.8938, longitude: 35.5018, timeZone: 'Asia/Beirut' },
  { nameArabic: 'تونس', nameEnglish: 'Tunis', countryArabic: 'تونس', latitude: 36.8065, longitude: 10.1815, timeZone: 'Africa/Tunis' },
  { nameArabic: 'الجزائر', nameEnglish: 'Algiers', countryArabic: 'الجزائر', latitude: 36.7538, longitude: 3.0588, timeZone: 'Africa/Algiers' },
  { nameArabic: 'الرباط', nameEnglish: 'Rabat', countryArabic: 'المغرب', latitude: 34.0209, longitude: -6.8416, timeZone: 'Africa/Casablanca' },
  { nameArabic: 'إسطنبول', nameEnglish: 'Istanbul', countryArabic: 'تركيا', latitude: 41.0082, longitude: 28.9784, timeZone: 'Europe/Istanbul' },
  { nameArabic: 'جاكرتا', nameEnglish: 'Jakarta', countryArabic: 'إندونيسيا', latitude: -6.2088, longitude: 106.8456, timeZone: 'Asia/Jakarta' },
  { nameArabic: 'لندن', nameEnglish: 'London', countryArabic: 'المملكة المتحدة', latitude: 51.5074, longitude: -0.1278, timeZone: 'Europe/London' },
];

/**
 * Computes exact UTC offset in hours for a given IANA timeZone and Date (DST-aware)
 */
export function getTimeZoneOffsetHours(date: Date, timeZone?: string): number {
  if (!timeZone) {
    return -date.getTimezoneOffset() / 60;
  }
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return (tzDate.getTime() - utcDate.getTime()) / 3600000;
  } catch {
    return -date.getTimezoneOffset() / 60;
  }
}

export function formatUtcOffsetLabel(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts an instant `date` into a wall-clock Date object matching the target IANA timeZone
 * so `.getHours()`, `.getMinutes()`, `.getFullYear()`, etc. match that city's local time.
 */
export function getCityWallClockDate(date: Date = new Date(), timeZone?: string): Date {
  if (!timeZone) return date;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value || '0';
    const year = parseInt(get('year'), 10);
    const month = parseInt(get('month'), 10) - 1;
    const day = parseInt(get('day'), 10);
    let hour = parseInt(get('hour'), 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(get('minute'), 10);
    const second = parseInt(get('second'), 10);

    return new Date(year, month, day, hour, minute, second);
  } catch {
    return date;
  }
}

/**
 * Formats live local clock time for a given IANA timeZone in Arabic 12-hour format with seconds.
 */
export function formatCityClockTime(date: Date = new Date(), timeZone?: string): string {
  const wall = getCityWallClockDate(date, timeZone);
  let h = wall.getHours();
  const m = wall.getMinutes().toString().padStart(2, '0');
  const s = wall.getSeconds().toString().padStart(2, '0');
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m}:${s} ${period}`;
}

/**
 * Convert degrees to radians and back
 */
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Calculates Qibla direction (bearing in degrees from True North clockwise)
 */
export function calculateQiblaBearing(userLat: number, userLon: number): number {
  const phi1 = toRad(userLat);
  const phi2 = toRad(KAABA_COORDS.latitude);
  const deltaLambda = toRad(KAABA_COORDS.longitude - userLon);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qibla = toDeg(Math.atan2(y, x));
  return (qibla + 360) % 360;
}

/**
 * Calculates distance from user to Kaaba in kilometers
 */
export function calculateDistanceToKaaba(userLat: number, userLon: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(KAABA_COORDS.latitude - userLat);
  const dLon = toRad(KAABA_COORDS.longitude - userLon);
  const lat1 = toRad(userLat);
  const lat2 = toRad(KAABA_COORDS.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Astronomical Solar Calculations
 */
function getJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function calculateSunPosition(jd: number) {
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(toRad(g)) + 0.02 * Math.sin(toRad(2 * g))) % 360;
  const e = 23.439 - 0.00000036 * d;

  const declination = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
  const rightAscension = (toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) + 360) % 360;

  // Equation of time in minutes (normalized angle difference into [-180, 180])
  let diff = (q - rightAscension) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const eqTime = diff * 4;

  return { declination, eqTime };
}

/**
 * Calculate the prayer times for a given date, coordinates, calculation method, and optional timezone.
 */
export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lon: number,
  methodKey: string = 'ummAlQura',
  minuteAdjustments: { [key: string]: number } = {},
  timeZone?: string
) {
  const method = CALCULATION_METHODS[methodKey] || CALCULATION_METHODS.ummAlQura;

  // Base Julian Date for local noon
  const jd = getJulianDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
  const { declination, eqTime } = calculateSunPosition(jd);

  // DST-aware Timezone offset in hours
  const timezoneOffset = getTimeZoneOffsetHours(date, timeZone);

  // Solar noon in local hours
  const solarNoon = 12 + timezoneOffset - lon / 15 - eqTime / 60;

  // Helper function to find hour angle for an altitude angle
  function hourAngle(altitude: number): number {
    const phi = toRad(lat);
    const delta = toRad(declination);
    const alt = toRad(altitude);

    const cosH = (Math.sin(alt) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
    if (cosH > 1) return 0; // Sun never reaches this altitude
    if (cosH < -1) return 180;
    return toDeg(Math.acos(cosH));
  }

  // Fajr angle
  const fajrAngle = -method.fajrAngle;
  const fajrHA = hourAngle(fajrAngle) / 15;
  const fajrTime = solarNoon - fajrHA;

  // Sunrise (altitude -0.833 degrees for atmospheric refraction and solar disc)
  const sunriseHA = hourAngle(-0.833) / 15;
  const sunriseTime = solarNoon - sunriseHA;

  // Dhuhr is solar noon plus slight margin (~2 minutes)
  const dhuhrTime = solarNoon + 2 / 60;

  // Asr (Shafi'i/Standard shadow factor = 1)
  const phi = toRad(lat);
  const delta = toRad(declination);
  const asrAltitude = toDeg(Math.atan(1 / (1 + Math.tan(Math.abs(phi - delta)))));
  const asrHA = hourAngle(asrAltitude) / 15;
  const asrTime = solarNoon + asrHA;

  // Maghrib / Sunset
  const sunsetHA = hourAngle(-0.833) / 15;
  const maghribTime = solarNoon + sunsetHA;

  // Isha
  let ishaTime: number;
  if (method.ishaInterval) {
    ishaTime = maghribTime + method.ishaInterval / 60;
  } else {
    const ishaAngle = -method.ishaAngle;
    const ishaHA = hourAngle(ishaAngle) / 15;
    ishaTime = solarNoon + ishaHA;
  }

  function toDate(timeHours: number, prayerKey: string): Date {
    const adj = minuteAdjustments[prayerKey] || 0;
    const totalMinutes = Math.round(timeHours * 60) + adj;
    let hours = Math.floor(totalMinutes / 60) % 24;
    let minutes = totalMinutes % 60;
    if (minutes < 0) {
      minutes += 60;
      hours = (hours - 1 + 24) % 24;
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
  }

  const fajrDate = toDate(fajrTime, 'fajr');
  const sunriseDate = toDate(sunriseTime, 'sunrise');
  const dhuhrDate = toDate(dhuhrTime, 'dhuhr');
  const asrDate = toDate(asrTime, 'asr');
  const maghribDate = toDate(maghribTime, 'maghrib');
  const ishaDate = toDate(ishaTime, 'isha');

  return {
    fajr: fajrDate,
    sunrise: sunriseDate,
    dhuhr: dhuhrDate,
    asr: asrDate,
    maghrib: maghribDate,
    isha: ishaDate,
  };
}

/**
 * Format Date to HH:MM in 12h or 24h Arabic string
 */
export function formatPrayerTime(date: Date, use24Hour: boolean = false): string {
  if (use24Hour) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  h = h ? h : 12; // '0' should be '12'
  return `${h}:${m} ${period}`;
}

/**
 * Approximate Hijri Date conversion
 */
export function getHijriDate(date: Date = new Date()): {
  day: number;
  month: number;
  monthNameArabic: string;
  year: number;
  fullDateArabic: string;
} {
  const hijriMonths = [
    'المحرّم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوّال',
    'ذو القعدة',
    'ذو الحجة',
  ];

  // Helper to convert Arabic-Indic numerals to Latin digits
  function normalizeDigits(str: string): string {
    return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  }

  // Try Intl Hijri calendar if supported
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const dayStr = parts.find((p) => p.type === 'day')?.value || '1';
    const monthStr = parts.find((p) => p.type === 'month')?.value || '1';
    const yearStr = parts.find((p) => p.type === 'year')?.value || '1446';

    const day = parseInt(normalizeDigits(dayStr), 10) || 1;
    const month = parseInt(normalizeDigits(monthStr), 10) || 1;
    const year = parseInt(normalizeDigits(yearStr), 10) || 1446;
    const monthNameArabic = hijriMonths[(month - 1) % 12] || 'رمضان';

    return {
      day,
      month,
      monthNameArabic,
      year,
      fullDateArabic: `${day} ${monthNameArabic} ${year} هـ`,
    };
  } catch {
    // Deterministic fallback formula
    const jd = getJulianDate(date);
    const l = Math.floor(jd - 1948440 + 10632);
    const n = Math.floor((l - 1) / 10631);
    const l1 = l - 10631 * n + 354;
    const j =
      Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) +
      Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
    const l2 =
      l1 -
      Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
      29;
    const month = Math.floor((24 * l2) / 709);
    const day = l2 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    const safeMonth = Math.max(1, Math.min(12, month));
    const monthNameArabic = hijriMonths[safeMonth - 1];

    return {
      day,
      month: safeMonth,
      monthNameArabic,
      year,
      fullDateArabic: `${day} ${monthNameArabic} ${year} هـ`,
    };
  }
}

/**
 * Calculates countdown to the next prayer
 */
export function getNextPrayerCountdown(
  prayerTimes: { [key: string]: Date },
  now: Date = new Date()
): {
  nextPrayerKey: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayerNameArabic: string;
  nextPrayerTime: Date;
  timeRemainingSeconds: number;
  formattedCountdown: string;
} {
  const prayerNames: Record<string, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };

  const keys: ('fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[] = [
    'fajr',
    'sunrise',
    'dhuhr',
    'asr',
    'maghrib',
    'isha',
  ];

  for (const key of keys) {
    const time = prayerTimes[key];
    if (time && time.getTime() > now.getTime()) {
      const diffSec = Math.floor((time.getTime() - now.getTime()) / 1000);
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      const formatted = `${h > 0 ? `${h}س ` : ''}${m}د ${s.toString().padStart(2, '0')}ث`;
      return {
        nextPrayerKey: key,
        nextPrayerNameArabic: prayerNames[key],
        nextPrayerTime: time,
        timeRemainingSeconds: diffSec,
        formattedCountdown: formatted,
      };
    }
  }

  // If all prayers today have passed, next is Fajr tomorrow
  const tomorrowFajr = new Date(prayerTimes.fajr);
  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
  const diffSec = Math.max(0, Math.floor((tomorrowFajr.getTime() - now.getTime()) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  const formatted = `${h > 0 ? `${h}س ` : ''}${m}د ${s.toString().padStart(2, '0')}ث`;

  return {
    nextPrayerKey: 'fajr',
    nextPrayerNameArabic: 'الفجر (غداً)',
    nextPrayerTime: tomorrowFajr,
    timeRemainingSeconds: diffSec,
    formattedCountdown: formatted,
  };
}
