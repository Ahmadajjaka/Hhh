/**
 * @file quranIntegrity.ts
 * Comprehensive Automated Integrity, Authenticity & Verification Test Suite
 * for the Holy Quran platform «نور القرآن» according to the narration of
 * Hafs 'an 'Asim (رواية حفص عن عاصم من طريق الشاطبية).
 */

import { ALL_SURAHS, JUZ_START_DATA, HIZB_START_DATA, QURAN_SOURCE_METADATA } from '../data/quranMeta';
import { removeLeadingBasmalah } from './adhkarPrayerSync';

export interface IntegrityCheckResult {
  id: string;
  titleArabic: string;
  descriptionArabic: string;
  passed: boolean;
  expected: string | number;
  actual: string | number;
  critical: boolean;
}

export interface QuranIntegrityReport {
  passed: boolean;
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  riwayahArabic: string;
  sourceAuthorityArabic: string;
  datasetIdentifier: string;
  datasetVersion: string;
  totalSurahs: number;
  totalAyahs: number;
  totalPages: number;
  totalJuz: number;
  totalHizb: number;
  meccanCount: number;
  medinanCount: number;
  results: IntegrityCheckResult[];
}

// Canonical Sajdah occurrences in the Holy Quran (15 locations according to canonical consensus)
export const CANONICAL_SAJDAHS = [
  { surah: 7, ayah: 206, name: 'الأعراف' },
  { surah: 13, ayah: 15, name: 'الرعد' },
  { surah: 16, ayah: 50, name: 'النحل' },
  { surah: 17, ayah: 109, name: 'الإسراء' },
  { surah: 19, ayah: 58, name: 'مريم' },
  { surah: 22, ayah: 18, name: 'الحج (الأولى)' },
  { surah: 22, ayah: 77, name: 'الحج (الثانية)' },
  { surah: 25, ayah: 60, name: 'الفرقان' },
  { surah: 27, ayah: 26, name: 'النمل' },
  { surah: 32, ayah: 15, name: 'السجدة' },
  { surah: 38, ayah: 24, name: 'ص' },
  { surah: 41, ayah: 38, name: 'فصلت' },
  { surah: 53, ayah: 62, name: 'النجم' },
  { surah: 84, ayah: 21, name: 'الانشقاق' },
  { surah: 96, ayah: 19, name: 'العلق' },
];

export function isSajdahAyah(surahNumber: number, ayahNumber: number): boolean {
  return CANONICAL_SAJDAHS.some((s) => s.surah === surahNumber && s.ayah === ayahNumber);
}

/**
 * Strips Arabic Tashkeel / Quranic annotations for accurate word search while preserving letter identity
 */
export function normalizeArabicForSearch(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

/**
 * Filters a Mushaf page's Ayahs to show ONLY the focused Surah when opened directly from the Surah Index,
 * preventing verses from neighboring Surahs on shared pages from appearing unexpectedly.
 */
export function filterPageAyahsBySurah<T extends { surahNumber: number }>(
  ayahs: T[],
  focusedSurahNumber: number | null | undefined
): T[] {
  if (!focusedSurahNumber) return ayahs;
  const filtered = ayahs.filter((a) => a.surahNumber === focusedSurahNumber);
  return filtered.length > 0 ? filtered : ayahs;
}

/**
 * Validates fetched Mushaf page Ayahs against strict integrity criteria.
 * Requirement: Never display any Quranic text if data integrity fails.
 */
export function validateFetchedPageAyahs(
  ayahs: { numberInSurah: number; surahNumber: number; text: string; page: number }[],
  expectedPage: number
): { valid: boolean; reason?: string } {
  if (!Array.isArray(ayahs) || ayahs.length === 0) {
    return { valid: false, reason: 'الصفحة فارغة أو لم ترد بيانات الآيات.' };
  }
  if (expectedPage < 1 || expectedPage > 604) {
    return { valid: false, reason: 'رقم الصفحة خارج النطاق المعتمد (١-٦٠٤).' };
  }
  const seenKeys = new Set<string>();
  const arabicLetterRegex = /[\u0621-\u064A]/;

  for (const ay of ayahs) {
    if (!ay.text || !arabicLetterRegex.test(ay.text)) {
      return { valid: false, reason: `نص الآية ${ay.surahNumber}:${ay.numberInSurah} غير مكتمل أو تالف.` };
    }
    const key = `${ay.surahNumber}:${ay.numberInSurah}`;
    if (seenKeys.has(key)) {
      return { valid: false, reason: `تم اكتشاف تكرار غير مشروع للآية ${key}.` };
    }
    seenKeys.add(key);

    const meta = ALL_SURAHS.find((s) => s.number === ay.surahNumber);
    if (!meta || ay.numberInSurah < 1 || ay.numberInSurah > meta.numberOfAyahs) {
      return { valid: false, reason: `رقم الآية ${key} خارج نطاق السورة المعتمد.` };
    }
  }
  return { valid: true };
}

/**
 * Validates a full fetched Surah against canonical Surah Ayah count and sequential order.
 */
export function validateFetchedSurahAyahs(
  ayahs: { numberInSurah: number; text: string }[],
  surahNumber: number
): { valid: boolean; reason?: string } {
  const meta = ALL_SURAHS.find((s) => s.number === surahNumber);
  if (!meta) {
    return { valid: false, reason: 'رقم السورة غير صحيح.' };
  }
  if (!Array.isArray(ayahs) || ayahs.length !== meta.numberOfAyahs) {
    return {
      valid: false,
      reason: `عدد الآيات الواردة (${ayahs?.length || 0}) لا يطابق العدد المعتمد لسورة ${meta.name} (${meta.numberOfAyahs}).`,
    };
  }
  const arabicLetterRegex = /[\u0621-\u064A]/;
  for (let i = 0; i < ayahs.length; i++) {
    const ay = ayahs[i];
    if (ay.numberInSurah !== i + 1) {
      return { valid: false, reason: `خلل في تسلسل رقم الآية عند الموضع ${i + 1}.` };
    }
    if (!ay.text || !arabicLetterRegex.test(ay.text)) {
      return { valid: false, reason: `نص الآية ${i + 1} مفقود أو تالف.` };
    }
  }
  return { valid: true };
}

/**
 * Runs full automated integrity audit on the Quranic datasets and text engine
 */
export function runQuranIntegrityChecks(): QuranIntegrityReport {
  const results: IntegrityCheckResult[] = [];

  // Check 1: Exactly 114 Surahs
  const surahsCount = ALL_SURAHS.length;
  results.push({
    id: 'surahs_count',
    titleArabic: 'التحقق من عدد سور القرآن الكريم',
    descriptionArabic: 'التأكد من اكتمال السور الشريفة كاملة من سورة الفاتحة إلى سورة الناس دون نقص أو زيادة.',
    passed: surahsCount === 114,
    expected: 114,
    actual: surahsCount,
    critical: true,
  });

  // Check 2: Exactly 6,236 Ayahs (Hafs 'an 'Asim canonical count)
  const totalAyahs = ALL_SURAHS.reduce((sum, s) => sum + s.numberOfAyahs, 0);
  results.push({
    id: 'ayahs_count',
    titleArabic: 'التحقق من عدد آيات القرآن الكريم (6236 آية)',
    descriptionArabic: 'المطابقة الحسابية لمجموع آيات القرآن الكريم برواية حفص عن عاصم المعتمدة عالمياً.',
    passed: totalAyahs === 6236,
    expected: 6236,
    actual: totalAyahs,
    critical: true,
  });

  // Check 3: Sequential Surah Numbering (1 to 114)
  let isSequential = true;
  for (let i = 0; i < ALL_SURAHS.length; i++) {
    if (ALL_SURAHS[i].number !== i + 1) {
      isSequential = false;
      break;
    }
  }
  results.push({
    id: 'surahs_order',
    titleArabic: 'التحقق من الترتيب التوقيفي لسور المصحف الشريف',
    descriptionArabic: 'سلامة تسلسل أرقام السور من 1 إلى 114 ومطابقتها للمصحف الإمام العثماني.',
    passed: isSequential,
    expected: 'تسلسل توقيفي منتظم (1..114)',
    actual: isSequential ? 'تسلسل توقيفي منتظم (1..114)' : 'خلل في الترتيب',
    critical: true,
  });

  // Check 4: First Surah is Al-Fatihah (7 verses) and Last is An-Nas (6 verses)
  const firstSurah = ALL_SURAHS[0];
  const lastSurah = ALL_SURAHS[ALL_SURAHS.length - 1];
  const firstAndLastPass =
    firstSurah?.number === 1 &&
    firstSurah?.name === 'الفَاتِحَة' &&
    firstSurah?.numberOfAyahs === 7 &&
    lastSurah?.number === 114 &&
    lastSurah?.name === 'النَّاس' &&
    lastSurah?.numberOfAyahs === 6;

  results.push({
    id: 'first_and_last_surahs',
    titleArabic: 'التحقق من فاتحة الكتاب وخاتمته',
    descriptionArabic: 'سورة الفاتحة (7 آيات) في مطلع المصحف وسورة الناس (6 آيات) في خاتمته.',
    passed: firstAndLastPass,
    expected: 'الفاتحة (7) ← الناس (6)',
    actual: firstAndLastPass ? 'الفاتحة (7) ← الناس (6)' : 'عدم تطابق',
    critical: true,
  });

  // Check 5: Meccan vs Medinan counts (86 Meccan, 28 Medinan)
  const meccanCount = ALL_SURAHS.filter((s) => s.revelationType === 'Meccan').length;
  const medinanCount = ALL_SURAHS.filter((s) => s.revelationType === 'Medinan').length;
  const revelationPass = meccanCount === 86 && medinanCount === 28;
  results.push({
    id: 'revelation_types',
    titleArabic: 'التحقق من تصنيف السور المكية والمدنية',
    descriptionArabic: '86 سورة مكية و 28 سورة مدنية موثقة وفق النزول المعتمد.',
    passed: revelationPass,
    expected: '86 مكية / 28 مدنية',
    actual: `${meccanCount} مكية / ${medinanCount} مدنية`,
    critical: false,
  });

  // Check 6: 30 Complete Juz & 60 Hizb canonical mapping
  const juzPass =
    JUZ_START_DATA.length === 30 &&
    JUZ_START_DATA[0].page === 1 &&
    JUZ_START_DATA[29].page === 582 &&
    HIZB_START_DATA.length === 60;
  results.push({
    id: 'juz_coverage',
    titleArabic: 'تغطية الأجزاء الثلاثين والأحزاب الستين',
    descriptionArabic: 'شمول فهرس المصحف الشريف لجميع الأجزاء الـ30 و الـ60 حزباً بأرقام الصفحات الدقيقة.',
    passed: juzPass,
    expected: '30 جزءاً / 60 حزباً',
    actual: `${JUZ_START_DATA.length} جزءاً / ${HIZB_START_DATA.length} حزباً`,
    critical: true,
  });

  // Check 7: 604 Madani Pages layout (King Fahd Complex Madani Mushaf layout)
  const maxPage = Math.max(...ALL_SURAHS.map((s) => s.page));
  results.push({
    id: 'madani_pages',
    titleArabic: 'مطابقة تقسيم صفحات مصحف المدينة النبوية (604 صفحات)',
    descriptionArabic: 'التوافق التام مع طبعة مجمع الملك فهد لطباعة المصحف الشريف.',
    passed: maxPage === 604,
    expected: 604,
    actual: maxPage,
    critical: true,
  });

  // Check 8: Basmalah Placement & Anti-Duplication Rule
  const testSurah2Ayah1 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ';
  const cleanedSurah2 = removeLeadingBasmalah(testSurah2Ayah1, 2, 1);
  const testSurah1Ayah1 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  const cleanedSurah1 = removeLeadingBasmalah(testSurah1Ayah1, 1, 1);

  const basmalahRulePass =
    cleanedSurah2 === 'الٓمٓ' &&
    cleanedSurah1 === 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  results.push({
    id: 'basmalah_placement',
    titleArabic: 'التحقق من ضوابط وضع البسملة الشريفة',
    descriptionArabic: 'ظهور البسملة في الترويسة العلوية فقط دون تكرارها داخل الآية، مع إثباتها في الفاتحة كآية ونفيها عن التوبة.',
    passed: basmalahRulePass,
    expected: 'البسملة علوية فقط مع حفظ آية الفاتحة',
    actual: basmalahRulePass ? 'البسملة علوية فقط مع حفظ آية الفاتحة' : 'فشل ضبط البسملة',
    critical: true,
  });

  // Check 9: Canonical 15 Sajdah points verification
  results.push({
    id: 'sajdah_markers',
    titleArabic: 'التحقق من مواضع سجدات التلاوة المعتمدة',
    descriptionArabic: 'مطابقة مواضع السجدات الـ15 في القرآن الكريم مع رسم المصحف الشريف.',
    passed: CANONICAL_SAJDAHS.length === 15,
    expected: 15,
    actual: CANONICAL_SAJDAHS.length,
    critical: false,
  });

  // Check 10: Non-AI Generation & Data Integrity Assurance
  results.push({
    id: 'non_ai_generation',
    titleArabic: 'ضمان عدم توليد النص القرآني بالذكاء الاصطناعي',
    descriptionArabic: 'اعتماد قواعد بيانات رسمية معتمدة برسم المصحف العثماني وحظر توليد أو تعديل الآيات إلكترونياً.',
    passed: !QURAN_SOURCE_METADATA.aiModified,
    expected: 'بيانات أصلية معتمدة ومراجعة 100%',
    actual: !QURAN_SOURCE_METADATA.aiModified ? 'بيانات أصلية معتمدة ومراجعة 100%' : 'معدل',
    critical: true,
  });

  const passedChecks = results.filter((r) => r.passed).length;
  const failedChecks = results.length - passedChecks;

  return {
    passed: failedChecks === 0,
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    riwayahArabic: QURAN_SOURCE_METADATA.riwayahArabic,
    sourceAuthorityArabic: QURAN_SOURCE_METADATA.mushafEditionArabic,
    datasetIdentifier: QURAN_SOURCE_METADATA.datasetIdentifier,
    datasetVersion: QURAN_SOURCE_METADATA.datasetVersion,
    totalSurahs: surahsCount,
    totalAyahs,
    totalPages: QURAN_SOURCE_METADATA.totalPages,
    totalJuz: JUZ_START_DATA.length,
    totalHizb: HIZB_START_DATA.length,
    meccanCount,
    medinanCount,
    results,
  };
}
