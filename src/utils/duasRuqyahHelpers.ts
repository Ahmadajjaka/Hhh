import { RuqyahQuranSection } from '../data/duasAndRuqyahData';
import { normalizeArabicForSearch } from './quranIntegrity';

/**
 * Formats seconds into clean tabular MM:SS or H:MM:SS string.
 */
export function formatAudioDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface FilterableAudioItem {
  id: string;
  titleArabic: string;
  sheikhNameArabic: string;
  categoryId?: string;
  descriptionArabic?: string;
}

/**
 * Filters Sheikh Duas or Ruqyah audio tracks by Arabic search text, occasion category, and favorites.
 */
export function filterSheikhAudioTracks<T extends FilterableAudioItem>(
  tracks: T[],
  searchQuery: string,
  categoryFilter: string = 'all',
  favoritesOnly: boolean = false,
  favoriteIds: string[] = []
): T[] {
  const normQuery = normalizeArabicForSearch(searchQuery);
  return tracks.filter((track) => {
    if (categoryFilter && categoryFilter !== 'all' && track.categoryId !== categoryFilter) {
      return false;
    }
    if (favoritesOnly && !favoriteIds.includes(track.id)) {
      return false;
    }
    if (!normQuery) return true;
    const haystack = normalizeArabicForSearch(
      `${track.titleArabic} ${track.sheikhNameArabic} ${track.descriptionArabic || ''}`
    );
    return haystack.includes(normQuery);
  });
}

/**
 * Computes next ayah index during continuous Ruqyah Quranic recitation playback.
 */
export function getNextSequentialAyahIndex(
  currentIndex: number,
  totalCount: number,
  repeatCurrent: boolean
): number | null {
  if (totalCount <= 0 || currentIndex < 0 || currentIndex >= totalCount) return null;
  if (repeatCurrent) return currentIndex;
  if (currentIndex + 1 < totalCount) return currentIndex + 1;
  return null;
}

/**
 * Integrity check ensuring every Ruqyah Quran section contains non-empty valid Arabic Ayahs.
 */
export function validateRuqyahQuranSections(sections: RuqyahQuranSection[]): {
  valid: boolean;
  totalAyahs: number;
  reason?: string;
} {
  if (!Array.isArray(sections) || sections.length === 0) {
    return { valid: false, totalAyahs: 0, reason: 'لا توجد أقسام لآيات الرقية الشرعية.' };
  }
  let totalAyahs = 0;
  const arabicRegex = /[\u0621-\u064A]/;

  for (const sec of sections) {
    if (!sec.ayahs || sec.ayahs.length === 0) {
      return { valid: false, totalAyahs, reason: `القسم ${sec.id} خالٍ من الآيات.` };
    }
    for (const ay of sec.ayahs) {
      if (!ay.text || !arabicRegex.test(ay.text) || ay.surahNumber < 1 || ay.surahNumber > 114 || ay.ayahNumber < 1) {
        return {
          valid: false,
          totalAyahs,
          reason: `بيانات غير صالحة في الآية ${ay.surahNumber}:${ay.ayahNumber}.`,
        };
      }
      totalAyahs++;
    }
  }
  return { valid: true, totalAyahs };
}
