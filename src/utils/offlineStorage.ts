import { ALL_SURAHS, VERIFIED_OFFLINE_SURAHS } from '../data/quranMeta';
import { Ayah } from '../types';
import { removeLeadingBasmalah } from './adhkarPrayerSync';
import { normalizeArabicForSearch } from './quranIntegrity';

export const OFFLINE_DB_NAME = 'noor-quran-offline-db';
export const OFFLINE_DB_VERSION = 1;
export const AUDIO_CACHE_NAME = 'noor-quran-audio-v1';
export const FULL_MUSHAF_FLAG_KEY = 'noor_offline_full_mushaf_v1';

export interface StoredPageAyah extends Ayah {
  surahNumber: number;
  surahNameArabic: string;
  isFirstAyahOfSurah?: boolean;
}

export interface OfflineQuranSummary {
  pagesCount: number;
  surahsCount: number;
  fullMushafReady: boolean;
}

export interface OfflineStorageEstimate {
  usageMB: number;
  quotaMB: number;
  persisted: boolean;
}

export interface BatchDownloadItem {
  id: string;
  label: string;
  url: string;
  fallbackUrl?: string;
}

export interface BatchDownloadProgress {
  completed: number;
  total: number;
  skippedCached: number;
  failed: number;
  currentLabel: string;
}

export interface MushafDownloadProgress {
  phase: 'fetching' | 'saving' | 'done';
  percent: number;
  message: string;
}

export interface OfflineSearchHit {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  pageNumber: number;
  text: string;
}

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openOfflineDb(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB()) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('quran_pages')) {
          db.createObjectStore('quran_pages', { keyPath: 'page' });
        }
        if (!db.objectStoreNames.contains('quran_surahs')) {
          db.createObjectStore('quran_surahs', { keyPath: 'surahNumber' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    const already = await navigator.storage.persisted?.();
    if (already) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function getOfflineStorageEstimate(): Promise<OfflineStorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { usageMB: 0, quotaMB: 0, persisted: false };
  }
  try {
    const [est, persisted] = await Promise.all([
      navigator.storage.estimate(),
      navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false),
    ]);
    return {
      usageMB: Math.round(((est.usage || 0) / (1024 * 1024)) * 10) / 10,
      quotaMB: Math.round((est.quota || 0) / (1024 * 1024)),
      persisted: Boolean(persisted),
    };
  } catch {
    return { usageMB: 0, quotaMB: 0, persisted: false };
  }
}

export async function saveOfflinePage(page: number, ayahs: StoredPageAyah[]): Promise<void> {
  try {
    localStorage.setItem(`noor_page_${page}`, JSON.stringify(ayahs));
  } catch {
    // localStorage ~5MB quota may fill up cleanly; IndexedDB holds full 604 pages
  }

  const db = await openOfflineDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction('quran_pages', 'readwrite');
      tx.objectStore('quran_pages').put({ page, ayahs, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getOfflinePage(page: number): Promise<StoredPageAyah[] | null> {
  try {
    const raw = localStorage.getItem(`noor_page_${page}`);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredPageAyah[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const db = await openOfflineDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('quran_pages', 'readonly');
      const req = tx.objectStore('quran_pages').get(page);
      req.onsuccess = () => {
        const res = req.result as { ayahs?: StoredPageAyah[] } | undefined;
        resolve(Array.isArray(res?.ayahs) && res.ayahs.length > 0 ? res.ayahs : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveOfflineSurah(surahNumber: number, ayahs: Ayah[]): Promise<void> {
  try {
    localStorage.setItem(`noor_surah_v2_${surahNumber}`, JSON.stringify(ayahs));
  } catch {
    // Ignore localStorage quota overflow; IndexedDB stores all 114 Surahs reliably
  }

  const db = await openOfflineDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction('quran_surahs', 'readwrite');
      tx.objectStore('quran_surahs').put({ surahNumber, ayahs, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getOfflineSurah(surahNumber: number): Promise<Ayah[] | null> {
  try {
    const raw = localStorage.getItem(`noor_surah_v2_${surahNumber}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Ayah[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const db = await openOfflineDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('quran_surahs', 'readonly');
      const req = tx.objectStore('quran_surahs').get(surahNumber);
      req.onsuccess = () => {
        const res = req.result as { ayahs?: Ayah[] } | undefined;
        resolve(Array.isArray(res?.ayahs) && res.ayahs.length > 0 ? res.ayahs : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function countOfflineQuranItems(): Promise<OfflineQuranSummary> {
  const pageKeys = new Set<number>();
  const surahKeys = new Set<number>();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('noor_page_') && !k.includes('bookmarks')) {
        const num = parseInt(k.replace('noor_page_', ''), 10);
        if (num >= 1 && num <= 604) pageKeys.add(num);
      } else if (k.startsWith('noor_surah_v2_')) {
        const num = parseInt(k.replace('noor_surah_v2_', ''), 10);
        if (num >= 1 && num <= 114) surahKeys.add(num);
      }
    }
  } catch {}

  const db = await openOfflineDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(['quran_pages', 'quran_surahs'], 'readonly');
        const pReq = tx.objectStore('quran_pages').getAllKeys();
        const sReq = tx.objectStore('quran_surahs').getAllKeys();
        tx.oncomplete = () => {
          if (Array.isArray(pReq.result)) {
            for (const k of pReq.result) {
              const n = Number(k);
              if (n >= 1 && n <= 604) pageKeys.add(n);
            }
          }
          if (Array.isArray(sReq.result)) {
            for (const k of sReq.result) {
              const n = Number(k);
              if (n >= 1 && n <= 114) surahKeys.add(n);
            }
          }
          resolve();
        };
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  return {
    pagesCount: pageKeys.size,
    surahsCount: surahKeys.size,
    fullMushafReady: pageKeys.size >= 604 && surahKeys.size >= 114,
  };
}

/**
 * Pure parser transforming quran-uthmani + ar.muyassar full Quran JSON payloads into
 * 114 Surahs and 604 Madinah Mushaf pages for permanent IndexedDB storage.
 */
export function buildFullMushafOfflineCollections(
  uthmaniSurahs: Array<{
    number: number;
    name: string;
    ayahs: Array<{ number: number; numberInSurah: number; text: string; page: number; juz: number }>;
  }>,
  muyassarSurahs: Array<{
    number: number;
    ayahs: Array<{ numberInSurah: number; text: string }>;
  }> = []
): {
  surahsMap: Map<number, Ayah[]>;
  pagesMap: Map<number, StoredPageAyah[]>;
} {
  const muyassarLookup = new Map<string, string>();
  for (const s of muyassarSurahs) {
    for (const a of s.ayahs || []) {
      muyassarLookup.set(`${s.number}:${a.numberInSurah}`, a.text || '');
    }
  }

  const surahsMap = new Map<number, Ayah[]>();
  const pagesMap = new Map<number, StoredPageAyah[]>();

  for (const s of uthmaniSurahs) {
    const surahMeta = ALL_SURAHS.find((m) => m.number === s.number);
    const cleanSurahName = (surahMeta?.name || s.name || '').replace('سُورَةُ ', '');
    const surahAyahs: Ayah[] = [];

    for (const ay of s.ayahs || []) {
      const cleanedText = removeLeadingBasmalah(ay.text, s.number, ay.numberInSurah);
      const tafsir = muyassarLookup.get(`${s.number}:${ay.numberInSurah}`) || '';
      const pageNum = ay.page || surahMeta?.page || 1;
      const juzNum = ay.juz || surahMeta?.juz || 1;

      surahAyahs.push({
        number: ay.number,
        numberInSurah: ay.numberInSurah,
        text: cleanedText,
        translation: '',
        tafsir,
        page: pageNum,
        juz: juzNum,
      });

      const bucket = pagesMap.get(pageNum) || [];
      bucket.push({
        number: ay.number,
        numberInSurah: ay.numberInSurah,
        surahNumber: s.number,
        surahNameArabic: cleanSurahName,
        isFirstAyahOfSurah: ay.numberInSurah === 1,
        text: cleanedText,
        translation: '',
        tafsir,
        page: pageNum,
        juz: juzNum,
      });
      pagesMap.set(pageNum, bucket);
    }

    if (surahAyahs.length > 0) {
      surahsMap.set(s.number, surahAyahs);
    }
  }

  return { surahsMap, pagesMap };
}

/**
 * Downloads the complete 114-Surah / 604-Page Uthmani Mushaf + Tafsir Al-Muyassar once
 * and persists it in IndexedDB for permanent offline reading & search.
 */
export async function downloadFullMushafOffline(
  onProgress?: (progress: MushafDownloadProgress) => void,
  signal?: AbortSignal
): Promise<{ ok: boolean; pagesSaved: number; surahsSaved: number; errorMessage?: string }> {
  try {
    onProgress?.({
      phase: 'fetching',
      percent: 12,
      message: 'جاري تنزيل المصحف الشريف كاملاً مع التفسير الميسر (مرة واحدة)...',
    });

    const [uthmaniRes, muyassarRes] = await Promise.all([
      fetch('https://api.alquran.cloud/v1/quran/quran-uthmani', { signal }),
      fetch('https://api.alquran.cloud/v1/quran/ar.muyassar', { signal }).catch(() => null),
    ]);

    if (!uthmaniRes.ok) {
      throw new Error(`HTTP ${uthmaniRes.status}`);
    }

    onProgress?.({
      phase: 'fetching',
      percent: 45,
      message: 'جاري التحقق من سلامة الآيات والصفحات المدنية (٦٠٤ صفحة)...',
    });

    const uthmaniJson = await uthmaniRes.json();
    const muyassarJson = muyassarRes && muyassarRes.ok ? await muyassarRes.json().catch(() => null) : null;

    const uthmaniSurahs = uthmaniJson?.data?.surahs;
    if (!Array.isArray(uthmaniSurahs) || uthmaniSurahs.length !== 114) {
      throw new Error('بيانات المصحف غير مكتملة');
    }

    const muyassarSurahs = Array.isArray(muyassarJson?.data?.surahs) ? muyassarJson.data.surahs : [];
    const { surahsMap, pagesMap } = buildFullMushafOfflineCollections(uthmaniSurahs, muyassarSurahs);

    onProgress?.({
      phase: 'saving',
      percent: 65,
      message: 'جاري حفظ ١١٤ سورة و٦٠٤ صفحة في ذاكرة الجهاز الدائمة...',
    });

    const db = await openOfflineDb();
    if (!db) {
      throw new Error('IndexedDB غير متاح على هذا المتصفح');
    }

    await requestPersistentStorage();

    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(['quran_surahs', 'quran_pages'], 'readwrite');
        const surahStore = tx.objectStore('quran_surahs');
        const pageStore = tx.objectStore('quran_pages');
        const now = Date.now();

        for (const [surahNumber, ayahs] of surahsMap.entries()) {
          surahStore.put({ surahNumber, ayahs, updatedAt: now });
        }
        for (const [page, ayahs] of pagesMap.entries()) {
          pageStore.put({ page, ayahs, updatedAt: now });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('فشل الحفظ المحلي'));
      } catch (err) {
        reject(err);
      }
    });

    try {
      localStorage.setItem(FULL_MUSHAF_FLAG_KEY, 'true');
    } catch {}

    onProgress?.({
      phase: 'done',
      percent: 100,
      message: `تم حفظ المصحف الشريف كاملاً (${surahsMap.size} سورة · ${pagesMap.size} صفحة) للعمل بلا إنترنت دائماً.`,
    });

    return {
      ok: true,
      pagesSaved: pagesMap.size,
      surahsSaved: surahsMap.size,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, pagesSaved: 0, surahsSaved: 0, errorMessage: 'تم إيقاف التحميل.' };
    }
    return {
      ok: false,
      pagesSaved: 0,
      surahsSaved: 0,
      errorMessage: 'تعذر تحميل المصحف الآن. يرجى التحقق من اتصال الإنترنت ثم إعادة المحاولة.',
    };
  }
}

export async function searchOfflineQuranAyahs(
  rawQuery: string,
  limit = 40
): Promise<OfflineSearchHit[]> {
  const normalizedQuery = normalizeArabicForSearch(rawQuery);
  if (!normalizedQuery || normalizedQuery.length < 2) return [];

  const hits: OfflineSearchHit[] = [];
  const seen = new Set<string>();

  const pushMatch = (
    surahNumber: number,
    surahName: string,
    ayahNumber: number,
    pageNumber: number,
    text: string
  ) => {
    const key = `${surahNumber}:${ayahNumber}`;
    if (seen.has(key)) return;
    if (normalizeArabicForSearch(text).includes(normalizedQuery)) {
      seen.add(key);
      hits.push({ surahNumber, surahName, ayahNumber, pageNumber, text });
    }
  };

  // 1. Search IndexedDB surahs if available
  const db = await openOfflineDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction('quran_surahs', 'readonly');
        const req = tx.objectStore('quran_surahs').getAll();
        req.onsuccess = () => {
          const allSurahs = (req.result || []) as Array<{ surahNumber: number; ayahs: Ayah[] }>;
          allSurahs.sort((a, b) => a.surahNumber - b.surahNumber);
          for (const entry of allSurahs) {
            const meta = ALL_SURAHS.find((m) => m.number === entry.surahNumber);
            for (const ay of entry.ayahs || []) {
              pushMatch(
                entry.surahNumber,
                meta?.name || '',
                ay.numberInSurah,
                ay.page || meta?.page || 1,
                ay.text
              );
              if (hits.length >= limit) break;
            }
            if (hits.length >= limit) break;
          }
          resolve();
        };
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  if (hits.length >= limit) return hits;

  // 2. Fallback to bundled verified offline Surahs (Al-Fatihah, Al-Asr, Al-Kawthar, Al-Ikhlas, Al-Falaq, An-Nas, etc.)
  for (const [surahNumStr, bundle] of Object.entries(VERIFIED_OFFLINE_SURAHS)) {
    const surahNumber = Number(surahNumStr);
    const meta = ALL_SURAHS.find((m) => m.number === surahNumber);
    for (const ay of bundle.ayahs) {
      pushMatch(surahNumber, meta?.name || '', ay.numberInSurah, meta?.page || 1, ay.text);
      if (hits.length >= limit) return hits;
    }
  }

  return hits;
}

/**
 * Inspects Cache API ('noor-quran-audio-v1') and returns which candidate URLs exist offline.
 */
export async function getCachedAudioUrlsSet(urls: string[]): Promise<Set<string>> {
  const cached = new Set<string>();
  if (typeof window === 'undefined' || !('caches' in window) || urls.length === 0) {
    return cached;
  }

  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const keys = await cache.keys();
    const keySet = new Set(keys.map((r) => r.url));
    for (const u of urls) {
      if (keySet.has(u)) {
        cached.add(u);
      }
    }
  } catch {}
  return cached;
}

export async function isAudioUrlCached(url: string, fallbackUrl?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    if (await cache.match(url)) return true;
    if (fallbackUrl && (await cache.match(fallbackUrl))) return true;
  } catch {}
  return false;
}

export async function countAllCachedAudioFiles(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) return 0;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

export async function clearOfflineAudioCache(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    await caches.delete(AUDIO_CACHE_NAME);
  } catch {}
}

export async function downloadAudioItemOnce(
  url: string,
  fallbackUrl?: string,
  signal?: AbortSignal
): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const existingPrimary = await cache.match(url);
    const existingFallback = fallbackUrl ? await cache.match(fallbackUrl) : null;
    if (existingPrimary || existingFallback) {
      return true;
    }

    const candidates = Array.from(new Set([url, fallbackUrl].filter((x): x is string => Boolean(x))));
    for (const candidate of candidates) {
      if (signal?.aborted) return false;
      try {
        const res = await fetch(candidate, { mode: 'cors', signal });
        if (res.ok) {
          await cache.put(url, res.clone());
          if (fallbackUrl && fallbackUrl !== url) {
            await cache.put(fallbackUrl, res.clone());
          }
          if (candidate !== url && candidate !== fallbackUrl) {
            await cache.put(candidate, res.clone());
          }
          await requestPersistentStorage();
          return true;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return false;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function downloadAudioBatch(
  items: BatchDownloadItem[],
  onProgress?: (progress: BatchDownloadProgress) => void,
  signal?: AbortSignal
): Promise<{ cachedIds: string[]; failedIds: string[] }> {
  const cachedIds: string[] = [];
  const failedIds: string[] = [];
  const total = items.length;
  let skippedCached = 0;

  await requestPersistentStorage();

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) break;
    const item = items[i];
    onProgress?.({
      completed: i,
      total,
      skippedCached,
      failed: failedIds.length,
      currentLabel: item.label,
    });

    const already = await isAudioUrlCached(item.url, item.fallbackUrl);
    if (already) {
      skippedCached++;
      cachedIds.push(item.id);
      continue;
    }

    const ok = await downloadAudioItemOnce(item.url, item.fallbackUrl, signal);
    if (ok) {
      cachedIds.push(item.id);
    } else {
      failedIds.push(item.id);
    }
  }

  onProgress?.({
    completed: cachedIds.length + failedIds.length,
    total,
    skippedCached,
    failed: failedIds.length,
    currentLabel: '',
  });

  return { cachedIds, failedIds };
}
