/**
 * Adhkar & Prayer Times Synchronization & Basmalah Cleaner
 */

export interface PostPrayerStatus {
  isPostPrayer: boolean;
  prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null;
  prayerNameArabic: string;
  minutesSincePrayer: number;
}

export interface AdhkarPhaseInfo {
  phase: 'after_prayer' | 'morning' | 'evening' | 'general';
  titleArabic: string;
  subtitleArabic: string;
  iconName: string;
  prayerNameArabic?: string;
}

/**
 * Checks if current time is within 45 minutes after any fardh prayer time.
 */
export function getPostPrayerStatus(
  prayerTimes: { [key: string]: Date },
  now: Date = new Date()
): PostPrayerStatus {
  const fardhPrayers: ('fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[] = [
    'fajr',
    'dhuhr',
    'asr',
    'maghrib',
    'isha',
  ];

  const prayerNames: Record<string, string> = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };

  const nowMs = now.getTime();

  for (const key of fardhPrayers) {
    const pTime = prayerTimes[key];
    if (!pTime) continue;
    const diffMs = nowMs - pTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    // If prayer entered between 0 and 45 minutes ago
    if (diffMinutes >= 0 && diffMinutes <= 45) {
      return {
        isPostPrayer: true,
        prayerKey: key,
        prayerNameArabic: prayerNames[key],
        minutesSincePrayer: diffMinutes,
      };
    }
  }

  return {
    isPostPrayer: false,
    prayerKey: null,
    prayerNameArabic: '',
    minutesSincePrayer: -1,
  };
}

/**
 * Determines current recommended Adhkar phase based on prayer times
 */
export function getAdhkarPhase(
  prayerTimes: { [key: string]: Date },
  now: Date = new Date()
): AdhkarPhaseInfo {
  // First check if user is in post-prayer window
  const post = getPostPrayerStatus(prayerTimes, now);
  if (post.isPostPrayer) {
    return {
      phase: 'after_prayer',
      titleArabic: `أذكار ما بعد صلاة ${post.prayerNameArabic}`,
      subtitleArabic: `حان وقت الأذكار والتسبيح بعد الانتهاء من فريضة ${post.prayerNameArabic} (${post.minutesSincePrayer === 0 ? 'الآن' : `منذ ${post.minutesSincePrayer} دقيقة`})`,
      iconName: 'Flame',
      prayerNameArabic: post.prayerNameArabic,
    };
  }

  const nowMs = now.getTime();
  const fajrMs = prayerTimes.fajr ? prayerTimes.fajr.getTime() : 0;
  const dhuhrMs = prayerTimes.dhuhr ? prayerTimes.dhuhr.getTime() : 0;
  const asrMs = prayerTimes.asr ? prayerTimes.asr.getTime() : 0;
  const ishaMs = prayerTimes.isha ? prayerTimes.isha.getTime() : 0;

  // Morning Adhkar: From Fajr until Dhuhr (ideal time is Fajr to Sunrise)
  if (nowMs >= fajrMs && nowMs < dhuhrMs) {
    return {
      phase: 'morning',
      titleArabic: 'أذكار الصباح المباركة',
      subtitleArabic: 'من بعد أذان الفجر وحتى الزوال، حصن نفسك بذكر الله العظيم',
      iconName: 'Sun',
    };
  }

  // Evening Adhkar: From Asr until Isha (ideal time is Asr to Maghrib)
  if (nowMs >= asrMs && nowMs < ishaMs) {
    return {
      phase: 'evening',
      titleArabic: 'أذكار المساء وحفظ الليل',
      subtitleArabic: 'من بعد أذان العصر وحتى العشاء، حصنك المنيع لسكينة المساء',
      iconName: 'Moon',
    };
  }

  // Night / Sleep Adhkar
  return {
    phase: 'general',
    titleArabic: 'أذكار النوم والأدعية النبوية',
    subtitleArabic: 'ختام اليوم بذكر الله وأدعية النوم المأثورة',
    iconName: 'Bed',
  };
}

/**
 * Removes the Basmalah from the beginning of Ayah 1 of any Surah (except Surah 1 Al-Fatihah and Surah 9 At-Tawbah).
 * Ensures that «بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ» appears ONLY at the top centered header banner,
 * and never repeated beside or attached to the beginning of the first Ayah.
 */
export function removeLeadingBasmalah(
  text: string,
  surahNumber: number,
  ayahNumberInSurah: number
): string {
  if (!text) return '';
  let cleaned = text.replace(/^\uFEFF/, '').trim();
  const sNum = Number(surahNumber);
  const aNum = Number(ayahNumberInSurah);

  // If Surah 1 (Al-Fatihah) and Ayah 1, the Basmalah IS the verse itself
  if (sNum === 1 && aNum === 1) {
    return cleaned;
  }

  // If Surah 9 (At-Tawbah), there is no Basmalah anyway
  if (sNum === 9) {
    return cleaned;
  }

  // Bulletproof removal for any Surah 2..114:
  // A standard Basmalah consists of 4 tokens:
  // [0: بِسْمِ], [1: ٱللَّهِ], [2: ٱلرَّحْمَٰنِ], [3: ٱلرَّحِيمِ]
  const tokens = cleaned.split(/\s+/);
  if (tokens.length >= 4 && tokens[0].includes('بِسْمِ')) {
    const isFourthTokenRaheem =
      tokens[3].includes('رَّحِيم') ||
      tokens[3].includes('رحيم') ||
      tokens[3].includes('رَّحِيمِ') ||
      tokens[3].includes('الرَّحِيم');
    if (isFourthTokenRaheem) {
      const rest = tokens.slice(4).join(' ').trim();
      if (rest.length > 0) {
        return rest;
      }
    }
  }

  // Regex fallback matching any variant of Uthmanic or standard Basmalah
  const basmalahRegex = /^[^\u0621-\u064A]*بِسْمِ\s+[ٱاإ]لل[\u064B-\u065F\u0670\u06D6-\u06EDـ]*[هـة][\u064B-\u065F\u0670\u06D6-\u06EDـ]*\s+[ٱاإ]لر[\u064B-\u065F\u0670\u06D6-\u06EDـ]*ح[\u064B-\u065F\u0670\u06D6-\u06EDـ]*م[\u064B-\u065F\u0670\u06D6-\u06EDـ]*ن[\u064B-\u065F\u0670\u06D6-\u06EDـ]*\s+[ٱاإ]لر[\u064B-\u065F\u0670\u06D6-\u06EDـ]*ح[\u064B-\u065F\u0670\u06D6-\u06EDـ]*ي[\u064B-\u065F\u0670\u06D6-\u06EDـ]*م[\u064B-\u065F\u0670\u06D6-\u06EDـ]*\s*/u;

  const afterRegex = cleaned.replace(basmalahRegex, '').trim();
  if (afterRegex.length > 0) {
    return afterRegex;
  }

  return cleaned;
}

/**
 * Smart Notification Request & Trigger
 */
export async function requestSmartNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

export function sendLocalNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: tag || 'noor_adhkar',
    });
  } catch {}
}
