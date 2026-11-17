/**
 * @file quranAudioAndTafsir.ts
 * Unified Audio Reciter URL Mapper (EveryAyah & MP3Quran),
 * Multi-Tafsir Engine (Al-Muyassar, Ibn Kathir, Al-Saadi),
 * Multi-Language Translations, Offline Cache API storage,
 * and Daily Reading Statistics Tracker.
 */
import {
  AUDIO_CACHE_NAME,
  downloadAudioItemOnce,
  requestPersistentStorage,
} from './offlineStorage';

export interface TafsirBundle {
  muyassar: string;
  ibnKathir: string;
  saadi: string;
  translations: {
    en: string;
    fr: string;
    ur: string;
    id: string;
    tr: string;
  };
}

export const TRANSLATION_LANGUAGES = [
  { code: 'en', labelArabic: 'الإنجليزية (Sahih International)', dir: 'ltr' as const },
  { code: 'fr', labelArabic: 'الفرنسية (Hamidullah)', dir: 'ltr' as const },
  { code: 'ur', labelArabic: 'الأردية (جالندھری)', dir: 'rtl' as const },
  { code: 'id', labelArabic: 'الإندونيسية (Kemenag)', dir: 'ltr' as const },
  { code: 'tr', labelArabic: 'التركية (Diyanet)', dir: 'ltr' as const },
];

/**
 * Maps every reciter ID to its verified EveryAyah CDN directory
 */
export function getEveryAyahAudioUrl(
  reciterId: string,
  surahNumber: number,
  ayahNumberInSurah: number
): string {
  const folderMap: Record<string, string> = {
    abdul_basit_murattal: 'Abdul_Basit_Murattal_192kbps',
    abdul_basit_mujawwad: 'Abdul_Basit_Mujawwad_128kbps',
    mishary_alafasy: 'Alafasy_128kbps',
    maher_al_muaiqly: 'MaherAlMuaiqly128kbps',
    al_sudais: 'Abdurrahmaan_As-Sudais_192kbps',
    saud_al_shuraim: 'Saood_ash-Shuraym_128kbps',
    al_husary: 'Husary_128kbps',
    el_minshawi: 'Minshawy_Murattal_128kbps',
  };

  const subfolder = folderMap[reciterId] || 'Abdul_Basit_Murattal_192kbps';
  const sStr = String(surahNumber).padStart(3, '0');
  const aStr = String(ayahNumberInSurah).padStart(3, '0');
  return `https://everyayah.com/data/${subfolder}/${sStr}${aStr}.mp3`;
}

/**
 * Clean HTML tags safely from API Tafsir text
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fetches & caches Al-Muyassar, Ibn Kathir, Al-Saadi, and 5 language translations for an Ayah
 */
export async function fetchAyahTafsirsAndTranslations(
  surahNumber: number,
  ayahNumberInSurah: number,
  existingMuyassar?: string
): Promise<TafsirBundle> {
  const key = `noor_tafsir_v2_${surahNumber}:${ayahNumberInSurah}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as TafsirBundle;
      if (parsed.ibnKathir && parsed.saadi && parsed.translations?.en) {
        return parsed;
      }
    }
  } catch {}

  const bundle: TafsirBundle = {
    muyassar: existingMuyassar || '',
    ibnKathir: '',
    saadi: '',
    translations: {
      en: '',
      fr: '',
      ur: '',
      id: '',
      tr: '',
    },
  };

  const verseRef = `${surahNumber}:${ayahNumberInSurah}`;

  const [editionsRes, ibnKathirRes, saadiRes] = await Promise.allSettled([
    fetch(
      `https://api.alquran.cloud/v1/ayah/${verseRef}/editions/ar.muyassar,en.sahih,fr.hamidullah,ur.jalandhry,id.indonesian,tr.diyanet`
    ).then((r) => r.json()),
    fetch(`https://api.quran.com/api/v4/tafsirs/14/by_ayah/${verseRef}`).then((r) => r.json()),
    fetch(`https://api.quran.com/api/v4/tafsirs/91/by_ayah/${verseRef}`).then((r) => r.json()),
  ]);

  if (editionsRes.status === 'fulfilled' && Array.isArray(editionsRes.value?.data)) {
    for (const item of editionsRes.value.data) {
      const id = item.edition?.identifier;
      if (id === 'ar.muyassar') bundle.muyassar = item.text || bundle.muyassar;
      if (id === 'en.sahih') bundle.translations.en = item.text || '';
      if (id === 'fr.hamidullah') bundle.translations.fr = item.text || '';
      if (id === 'ur.jalandhry') bundle.translations.ur = item.text || '';
      if (id === 'id.indonesian') bundle.translations.id = item.text || '';
      if (id === 'tr.diyanet') bundle.translations.tr = item.text || '';
    }
  }

  if (ibnKathirRes.status === 'fulfilled' && ibnKathirRes.value?.tafsir?.text) {
    bundle.ibnKathir = stripHtml(ibnKathirRes.value.tafsir.text);
  }

  if (saadiRes.status === 'fulfilled' && saadiRes.value?.tafsir?.text) {
    bundle.saadi = stripHtml(saadiRes.value.tafsir.text);
  }

  try {
    localStorage.setItem(key, JSON.stringify(bundle));
  } catch {}

  return bundle;
}

export async function cacheAudioForOffline(url: string, fallbackUrl?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  const ok = await downloadAudioItemOnce(url, fallbackUrl);
  if (ok) {
    requestPersistentStorage().catch(() => {});
  }
  return ok;
}

export async function getPlayableAudioSrc(url: string, fallbackUrl?: string): Promise<string> {
  if (typeof window === 'undefined' || !('caches' in window)) return url;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const match = (await cache.match(url)) || (fallbackUrl ? await cache.match(fallbackUrl) : undefined);
    if (match) {
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    }
  } catch {}
  return url;
}

/**
 * Daily Reading Stats Tracker
 */
export interface DailyReadingStats {
  dateKey: string;
  pagesToday: number[];
  totalPagesAllTime: number;
  streakDays: number;
  dailyGoalPages: number;
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM
}

function getTodayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getDailyReadingStats(): DailyReadingStats {
  const today = getTodayKey();
  const defaults: DailyReadingStats = {
    dateKey: today,
    pagesToday: [],
    totalPagesAllTime: 0,
    streakDays: 1,
    dailyGoalPages: 4,
    reminderEnabled: false,
    reminderTime: '20:00',
  };

  try {
    const raw = localStorage.getItem('noor_reading_stats');
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as DailyReadingStats;
    if (parsed.dateKey !== today) {
      // New day: increment streak if they read yesterday, reset daily list
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = getTodayKey(yesterday);
      const hadReadYesterday = parsed.dateKey === yKey && parsed.pagesToday.length > 0;
      return {
        ...parsed,
        dateKey: today,
        pagesToday: [],
        streakDays: hadReadYesterday ? parsed.streakDays + 1 : 1,
      };
    }
    return parsed;
  } catch {
    return defaults;
  }
}

export function recordPageRead(pageNumber: number): DailyReadingStats {
  const stats = getDailyReadingStats();
  if (!stats.pagesToday.includes(pageNumber)) {
    stats.pagesToday.push(pageNumber);
    stats.totalPagesAllTime += 1;
    try {
      localStorage.setItem('noor_reading_stats', JSON.stringify(stats));
    } catch {}
  }
  return stats;
}

export function updateReadingReminderSettings(
  reminderEnabled: boolean,
  reminderTime: string,
  dailyGoalPages?: number
): DailyReadingStats {
  const stats = getDailyReadingStats();
  stats.reminderEnabled = reminderEnabled;
  stats.reminderTime = reminderTime;
  if (dailyGoalPages && dailyGoalPages >= 1) {
    stats.dailyGoalPages = dailyGoalPages;
  }
  try {
    localStorage.setItem('noor_reading_stats', JSON.stringify(stats));
  } catch {}
  return stats;
}
