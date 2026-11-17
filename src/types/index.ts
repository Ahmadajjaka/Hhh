export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  page: number;
  juz: number;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  translation?: string;
  tafsir?: string;
  audio?: string;
}

export interface PrayerTimeItem {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameArabic: string;
  nameEnglish: string;
  time: string; // HH:mm
  timestamp: Date;
  isPassed: boolean;
  isNext: boolean;
  adhanEnabled: boolean;
}

export interface DhikrItem {
  id: string;
  category: 'morning' | 'evening' | 'after_prayer' | 'sleep' | 'wake' | 'quranic' | 'prophetic';
  categoryArabic: string;
  text: string;
  count: number;
  currentCount: number;
  reward?: string;
  reference: string;
}

export interface Reciter {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  styleArabic: string;
  serverUrl: string;
  format: 'mp3';
  isDefault?: boolean;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  surahNumber: number;
  ayahNumber: number;
  reciterId: string;
  playbackRate: number;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  autoPlayNext: boolean;
  repeatMode: 'off' | 'ayah' | 'surah';
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  pageNumber: number;
  createdAt: string;
  note?: string;
}

export interface KhatmahPlan {
  id: string;
  title: string;
  targetDays: number;
  startDate: string;
  completedPages: number[];
  notes?: string;
}

export interface CityLocation {
  nameArabic: string;
  nameEnglish: string;
  countryArabic: string;
  latitude: number;
  longitude: number;
  timezoneOffset?: number;
}
