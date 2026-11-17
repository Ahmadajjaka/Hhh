import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Share2,
  Copy,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Flame,
  BookOpen,
  Bell,
  BellRing,
  ShieldCheck,
  Volume2,
  Search,
  Bookmark,
  X,
} from 'lucide-react';
import {
  INITIAL_ADHKAR,
  ADHKAR_CATEGORIES,
  HISN_MUSLIM_OCCASIONS,
  HISN_MUSLIM_ADHKAR,
  HisnOccasionId,
  HisnDhikrItem,
  filterHisnAdhkar,
} from '../../data/adhkarData';
import { DhikrItem } from '../../types';
import { calculatePrayerTimes, POPULAR_CITIES } from '../../utils/prayerCalculator';
import {
  getPostPrayerStatus,
  getAdhkarPhase,
  requestSmartNotificationPermission,
  sendLocalNotification,
} from '../../utils/adhkarPrayerSync';

interface AdhkarViewProps {
  initialCategory?: string;
  onNavigatePrayer?: () => void;
  onNavigateDuasRuqyah?: (tab: 'duas' | 'ruqyah' | 'ruqyah_text') => void;
}

const ADHKAR_FAVORITES_STORAGE_KEY = 'noor_adhkar_favorites_v1';
const HISN_COUNTS_STORAGE_KEY = 'noor_hisn_counts_v1';

export const AdhkarView: React.FC<AdhkarViewProps> = ({
  initialCategory,
  onNavigateDuasRuqyah,
}) => {
  const [now] = useState(new Date());
  const [smartNotifsEnabled, setSmartNotifsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('noor_smart_adhkar_notifs') === 'true';
  });
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const city = POPULAR_CITIES[0];
  const prayerTimes = calculatePrayerTimes(now, city.latitude, city.longitude, 'ummAlQura');
  const postPrayerStatus = getPostPrayerStatus(prayerTimes, now);
  const adhkarPhase = getAdhkarPhase(prayerTimes, now);

  const [activeSection, setActiveSection] = useState<'daily' | 'hisn'>(() =>
    initialCategory === 'hisn' ? 'hisn' : 'daily'
  );

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (initialCategory && initialCategory !== 'hisn') return initialCategory;
    if (postPrayerStatus.isPostPrayer) return 'after_prayer';
    if (adhkarPhase.phase === 'morning') return 'morning';
    if (adhkarPhase.phase === 'evening') return 'evening';
    return 'morning';
  });

  useEffect(() => {
    if (initialCategory === 'hisn') {
      setActiveSection('hisn');
    } else if (initialCategory) {
      setActiveSection('daily');
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Shared persistent favorites (Daily Adhkar + Hisn Al-Muslim)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ADHKAR_FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === 'string');
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((itemId) => itemId !== id) : [...prev, id];
      try {
        localStorage.setItem(ADHKAR_FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Daily Adhkar state
  const [adhkarList, setAdhkarList] = useState<DhikrItem[]>(() => {
    try {
      const saved = localStorage.getItem('noor_adhkar_counts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return INITIAL_ADHKAR.map((item) => ({
          ...item,
          currentCount: parsed[item.id] || 0,
        }));
      }
    } catch {
      // fallback
    }
    return INITIAL_ADHKAR;
  });

  // Hisn Al-Muslim state
  const [hisnOccasion, setHisnOccasion] = useState<'all' | 'favorites' | HisnOccasionId>('all');
  const [hisnSearch, setHisnSearch] = useState('');
  const [hisnCounts, setHisnCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(HISN_COUNTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // fallback
    }
    return {};
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resetSuccessNote, setResetSuccessNote] = useState(false);

  const handleToggleSmartNotifs = async () => {
    setNotifFeedback(null);
    if (!smartNotifsEnabled) {
      const granted = await requestSmartNotificationPermission();
      if (granted) {
        setSmartNotifsEnabled(true);
        localStorage.setItem('noor_smart_adhkar_notifs', 'true');
        sendLocalNotification(
          'تطبيق نور القرآن - تم تفعيل الإشعارات الذكية',
          'سنقوم بتذكيرك بأذكار الصباح والمساء وأذكار ما بعد الصلوات المفروضة في أوقاتها المباركة.'
        );
      } else {
        setNotifFeedback('يرجى السماح بالإشعارات في المتصفح لتلقي تنبيهات الأذكار في أوقاتها.');
      }
    } else {
      setSmartNotifsEnabled(false);
      localStorage.setItem('noor_smart_adhkar_notifs', 'false');
    }
  };

  const playClick = () => {
    try {
      const ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  };

  const handleIncrementDaily = (id: string, maxCount: number) => {
    const updated = adhkarList.map((item) => {
      if (item.id === id) {
        const next = Math.min(maxCount, item.currentCount + 1);
        return { ...item, currentCount: next };
      }
      return item;
    });

    setAdhkarList(updated);

    const countsMap: Record<string, number> = {};
    updated.forEach((i) => {
      countsMap[i.id] = i.currentCount;
    });
    localStorage.setItem('noor_adhkar_counts', JSON.stringify(countsMap));

    playClick();
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const handleIncrementHisn = (item: HisnDhikrItem) => {
    const current = hisnCounts[item.id] || 0;
    const next = Math.min(item.count, current + 1);
    const updated = { ...hisnCounts, [item.id]: next };
    setHisnCounts(updated);
    try {
      localStorage.setItem(HISN_COUNTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    playClick();
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const handleResetActiveSection = () => {
    if (activeSection === 'daily') {
      const updated = adhkarList.map((item) =>
        item.category === activeCategory ? { ...item, currentCount: 0 } : item
      );
      setAdhkarList(updated);
      const countsMap: Record<string, number> = {};
      updated.forEach((i) => {
        countsMap[i.id] = i.currentCount;
      });
      localStorage.setItem('noor_adhkar_counts', JSON.stringify(countsMap));
    } else {
      const updated = { ...hisnCounts };
      filteredHisnItems.forEach((item) => {
        delete updated[item.id];
      });
      setHisnCounts(updated);
      try {
        localStorage.setItem(HISN_COUNTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    setResetSuccessNote(true);
    window.setTimeout(() => setResetSuccessNote(false), 2000);
  };

  const handleCopy = (id: string, text: string, reference: string) => {
    const formatted = `${text}\n(${reference})\nعبر تطبيق نور القرآن`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (id: string, title: string, text: string, reference: string) => {
    const shareData = {
      title,
      text: `${text}\n[${reference}]\nنور القرآن الكريم`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopy(id, text, reference);
    }
  };

  const dailyFavoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const categoryItems =
    activeCategory === 'favorites'
      ? adhkarList.filter((item) => dailyFavoriteSet.has(item.id))
      : adhkarList.filter((item) => item.category === activeCategory);

  const completedCount = categoryItems.filter((i) => i.currentCount >= i.count).length;
  const isCategoryComplete = categoryItems.length > 0 && completedCount === categoryItems.length;

  const dailyFavoriteCount = adhkarList.filter((i) => dailyFavoriteSet.has(i.id)).length;
  const hisnFavoriteCount = HISN_MUSLIM_ADHKAR.filter((i) => dailyFavoriteSet.has(i.id)).length;

  const filteredHisnItems = useMemo(
    () => filterHisnAdhkar(HISN_MUSLIM_ADHKAR, hisnOccasion, hisnSearch, favoriteIds),
    [hisnOccasion, hisnSearch, favoriteIds]
  );

  const activeOccasionMeta = HISN_MUSLIM_OCCASIONS.find((o) => o.id === hisnOccasion);

  return (
    <div className="w-full max-w-4xl mx-auto pb-28 px-4">
      {/* Adhkar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#c5a059]" />
            <span>حصن المسلم والأذكار</span>
          </h2>
          <p className="text-xs text-emerald-300/70 mt-1">
            أذكار اليوم والليلة وأذكار المناسبات من صحيح السنة النبوية مع إمكانية حفظ المفضلة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleToggleSmartNotifs}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              smartNotifsEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                : 'bg-black/30 text-emerald-200/80 border-emerald-800/40 hover:text-white'
            }`}
            title="تفعيل الإشعارات التلقائية لأذكار الصباح والمساء وبعد الصلاة"
          >
            {smartNotifsEnabled ? (
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
            <span>{smartNotifsEnabled ? 'الإشعارات الذكية مفعلة' : 'تفعيل الإشعارات الذكية'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetActiveSection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-rose-300 bg-rose-950/30 border border-rose-800/40 hover:bg-rose-900/40 transition-colors cursor-pointer"
            title="تصفير العدادات لهذا القسم"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetSuccessNote ? 'تم التصفير ✓' : 'تصفير العدادات'}</span>
          </button>
        </div>
      </div>

      {notifFeedback && (
        <div
          role="status"
          className="mb-4 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-center justify-between gap-2"
        >
          <span>{notifFeedback}</span>
          <button
            type="button"
            onClick={() => setNotifFeedback(null)}
            aria-label="إغلاق التنبيه"
            className="p-1 text-amber-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Section Switcher: Daily Adhkar vs Hisn Al-Muslim (by occasions) */}
      <div
        role="tablist"
        aria-label="أقسام الأذكار"
        className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#041d14] border border-amber-500/35 mb-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'daily'}
          onClick={() => setActiveSection('daily')}
          className={`min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'daily'
              ? 'bg-[#c5a059] text-black shadow-md'
              : 'text-emerald-100 hover:bg-emerald-950/70'
          }`}
        >
          <Sun className="w-4 h-4 shrink-0" />
          <span>الأذكار اليومية</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'hisn'}
          onClick={() => setActiveSection('hisn')}
          className={`min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'hisn'
              ? 'bg-[#c5a059] text-black shadow-md'
              : 'text-emerald-100 hover:bg-emerald-950/70'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>حصن المسلم (حسب المناسبات)</span>
        </button>
      </div>

      {/* Sanctuary Quick Links (Sheikh Duas / Al-Ruqyah) */}
      {onNavigateDuasRuqyah && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => onNavigateDuasRuqyah('duas')}
            className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold bg-[#06241b] border border-emerald-800/45 text-emerald-100 hover:text-amber-300 hover:border-amber-500/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 shrink-0 text-amber-400" />
            <span>أدعية بصوت الشيوخ</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateDuasRuqyah('ruqyah')}
            className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold bg-[#06241b] border border-emerald-800/45 text-emerald-100 hover:text-amber-300 hover:border-amber-500/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>الرقية الشرعية</span>
          </button>
        </div>
      )}

      {/* ==================== SECTION 1: DAILY ADHKAR ==================== */}
      {activeSection === 'daily' && (
        <>
          {/* Automatic Post-Prayer Notification Banner */}
          {postPrayerStatus.isPostPrayer && (
            <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-[#0d3f30]/40 to-amber-500/20 border-2 border-amber-400/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-right">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-300/90 font-bold px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 inline-block mb-0.5">
                    تنبيه ذكي: دخل وقت الصلاة
                  </span>
                  <h3 className="text-sm md:text-base font-bold text-white">
                    حان وقت «أذكار ما بعد صلاة {postPrayerStatus.prayerNameArabic}»
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    مضى على الأذان{' '}
                    {postPrayerStatus.minutesSincePrayer === 0
                      ? 'لحظات'
                      : `${postPrayerStatus.minutesSincePrayer} دقيقة`}{' '}
                    · رطّب لسانك بالاستغفار والتسبيح وآية الكرسي
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory('after_prayer')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === 'after_prayer'
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-[#c5a059] hover:bg-[#d8b368] text-black shadow'
                }`}
              >
                {activeCategory === 'after_prayer' ? 'أنت تقرأها الآن ✓' : 'عرض أذكار بعد الصلاة الآن'}
              </button>
            </div>
          )}

          {/* Smart Morning/Evening Adhkar Schedule Banner */}
          {!postPrayerStatus.isPostPrayer && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#06241b]/70 border border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                {adhkarPhase.phase === 'morning' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-400" />
                )}
                <div>
                  <span className="font-bold text-amber-300">{adhkarPhase.titleArabic}:</span>
                  <span className="text-emerald-200/80 mr-1.5">{adhkarPhase.subtitleArabic}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveCategory(adhkarPhase.phase === 'evening' ? 'evening' : 'morning')
                }
                className="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-colors font-semibold cursor-pointer"
              >
                فتح أذكار هذا الوقت
              </button>
            </div>
          )}

          {/* Category Tabs Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {ADHKAR_CATEGORIES.map((cat) => {
              const isSelected = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#c5a059] text-black font-bold border-[#c5a059] shadow-md shadow-amber-900/30'
                      : 'bg-[#082a1f]/60 text-emerald-200 border-emerald-800/40 hover:bg-[#0c382a]'
                  }`}
                >
                  <span>{cat.nameArabic}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActiveCategory('favorites')}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'favorites'
                  ? 'bg-rose-500/90 text-white font-bold border-rose-400 shadow-md'
                  : 'bg-[#082a1f]/60 text-rose-200 border-rose-800/40 hover:bg-[#0c382a]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${activeCategory === 'favorites' ? 'fill-white' : ''}`}
              />
              <span>المفضلة ({dailyFavoriteCount})</span>
            </button>
          </div>

          {/* Category Progress Strip */}
          <div className="flex items-center justify-between p-3.5 mb-6 rounded-2xl bg-black/30 border border-emerald-800/30 text-xs">
            <span className="text-emerald-200/80">
              إنجاز هذا القسم: {completedCount} من {categoryItems.length}
            </span>
            {isCategoryComplete && (
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>اكتملت أذكار هذا القسم بارك الله فيك!</span>
              </span>
            )}
          </div>

          {categoryItems.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#062218]/80 border border-emerald-800/40 text-center space-y-3">
              <Heart className="w-8 h-8 text-rose-300/70 mx-auto" />
              <p className="text-sm font-bold text-amber-200">لا توجد أذكار مفضلة في هذا القسم بعد</p>
              <p className="text-xs text-emerald-300/75">
                اضغط على زر القلب في أي ذكر لإضافته إلى مفضلتك والرجوع إليه سريعاً.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryItems.map((dhikr) => {
                const isDone = dhikr.currentCount >= dhikr.count;
                const isFav = dailyFavoriteSet.has(dhikr.id);

                return (
                  <div
                    key={dhikr.id}
                    className={`p-5 rounded-3xl transition-all border ${
                      isDone
                        ? 'bg-[#082a1f]/50 border-emerald-600/50'
                        : 'bg-[#062218]/80 border-emerald-800/40 hover:border-amber-500/30'
                    }`}
                  >
                    <p className="font-arabic-serif text-lg md:text-xl text-emerald-50 leading-loose text-right select-text">
                      {dhikr.text}
                    </p>

                    <div className="mt-3 pt-3 border-t border-emerald-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      {dhikr.reward && (
                        <p className="text-amber-300/80 text-[11px] leading-relaxed">
                          ★ {dhikr.reward}
                        </p>
                      )}
                      <span className="text-emerald-300/50 text-[10px] shrink-0">
                        {dhikr.reference}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-800/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(dhikr.id)}
                          aria-pressed={isFav}
                          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                            isFav
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/60'
                              : 'bg-black/25 text-emerald-300/80 border-emerald-800/40 hover:text-rose-300'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400 text-rose-400' : ''}`} />
                          <span>{isFav ? 'مفضلة' : 'تفضيل'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(dhikr.id, dhikr.text, dhikr.reference)}
                          className="p-2 rounded-xl text-emerald-300/70 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                          title="نسخ الذكر"
                          aria-label="نسخ الذكر"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleShare(dhikr.id, dhikr.categoryArabic, dhikr.text, dhikr.reference)
                          }
                          className="p-2 rounded-xl text-emerald-300/70 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                          title="مشاركة الذكر"
                          aria-label="مشاركة الذكر"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {copiedId === dhikr.id && (
                          <span className="text-[11px] text-amber-300">تم النسخ!</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIncrementDaily(dhikr.id, dhikr.count)}
                        disabled={isDone}
                        className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40 cursor-default'
                            : 'bg-[#c5a059] text-black hover:bg-[#d8b368] active:scale-95 shadow-lg shadow-amber-900/30'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>تم ({dhikr.count})</span>
                          </>
                        ) : (
                          <>
                            <span>اضغط للذكر</span>
                            <span className="px-2 py-0.5 rounded-lg bg-black/20 text-black font-extrabold tabular-nums">
                              {dhikr.currentCount} / {dhikr.count}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== SECTION 2: HISN AL-MUSLIM (BY OCCASIONS) ==================== */}
      {activeSection === 'hisn' && (
        <section aria-label="قسم حصن المسلم حسب المناسبات" data-testid="hisn-muslim-section">
          {/* Intro & Search Bar */}
          <div className="mb-5 p-4 rounded-3xl bg-[#06241b]/85 border border-amber-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-amber-200">
                  حصن المسلم — أذكار المناسبات اليومية
                </h3>
              </div>
              <span className="text-[11px] text-emerald-300/80">
                {HISN_MUSLIM_ADHKAR.length} ذكراً · {HISN_MUSLIM_OCCASIONS.length} مناسبات
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-amber-400/80 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="hisn-search-input" className="sr-only">
                ابحث في أذكار حصن المسلم والمناسبات
              </label>
              <input
                id="hisn-search-input"
                type="search"
                value={hisnSearch}
                onChange={(e) => setHisnSearch(e.target.value)}
                placeholder="ابحث بالمناسبة أو نص الذكر (مثل: الخروج، النوم، السفر، المطر)..."
                className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-2xl bg-[#031911] border border-emerald-800/50 focus:border-amber-400 text-xs sm:text-sm text-white placeholder:text-emerald-300/45 focus:outline-none"
              />
            </div>
          </div>

          {/* Occasion Tabs (All + Favorites + 10 Occasions) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
            <button
              type="button"
              onClick={() => setHisnOccasion('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                hisnOccasion === 'all'
                  ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-md'
                  : 'bg-[#082a1f]/70 text-emerald-100 border-emerald-800/45 hover:bg-[#0c382a]'
              }`}
            >
              جميع المناسبات ({HISN_MUSLIM_ADHKAR.length})
            </button>

            <button
              type="button"
              onClick={() => setHisnOccasion('favorites')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                hisnOccasion === 'favorites'
                  ? 'bg-rose-500/90 text-white border-rose-400 shadow-md'
                  : 'bg-[#082a1f]/70 text-rose-200 border-rose-800/45 hover:bg-[#0c382a]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${hisnOccasion === 'favorites' ? 'fill-white' : ''}`}
              />
              <span>المفضلة ({hisnFavoriteCount})</span>
            </button>

            {HISN_MUSLIM_OCCASIONS.map((occ) => {
              const isSelected = hisnOccasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setHisnOccasion(occ.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-md'
                      : 'bg-[#082a1f]/70 text-emerald-100 border-emerald-800/45 hover:bg-[#0c382a]'
                  }`}
                >
                  {occ.nameArabic}
                </button>
              );
            })}
          </div>

          {/* Active Occasion Context Banner */}
          {activeOccasionMeta && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-black/25 border border-emerald-800/35 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-amber-300">{activeOccasionMeta.nameArabic}: </span>
                <span className="text-emerald-200/80">{activeOccasionMeta.subtitleArabic}</span>
              </div>
              <span className="text-emerald-300/75 font-semibold">
                {filteredHisnItems.length} أذكار
              </span>
            </div>
          )}

          {/* Filtered Hisn Cards */}
          {filteredHisnItems.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#062218]/85 border border-emerald-800/40 text-center space-y-3">
              <Heart className="w-8 h-8 text-rose-300/75 mx-auto" />
              <p className="text-sm font-bold text-amber-200">
                {hisnOccasion === 'favorites'
                  ? 'قائمة المفضلة في حصن المسلم فارغة حالياً'
                  : 'لم يتم العثور على أذكار مطابقة لبحثك'}
              </p>
              <p className="text-xs text-emerald-300/75">
                {hisnOccasion === 'favorites'
                  ? 'اضغط على زر «أضف للمفضلة» في أي ذكر داخل حصن المسلم ليظهر هنا دائماً.'
                  : 'جرّب كلمة بحث أخرى أو اختر «جميع المناسبات».'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHisnItems.map((item) => {
                const currentCount = hisnCounts[item.id] || 0;
                const isDone = currentCount >= item.count;
                const isFav = dailyFavoriteSet.has(item.id);

                return (
                  <article
                    key={item.id}
                    className={`p-5 rounded-3xl transition-all border ${
                      isDone
                        ? 'bg-[#082a1f]/50 border-emerald-600/50'
                        : 'bg-[#062218]/85 border-emerald-800/40 hover:border-amber-500/35'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-[11px] font-bold text-amber-300">
                        {item.occasionArabic}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-200">
                        {item.titleArabic}
                      </h4>
                    </div>

                    <p className="font-arabic-serif text-lg md:text-xl text-emerald-50 leading-loose text-right select-text">
                      {item.text}
                    </p>

                    <div className="mt-3 pt-3 border-t border-emerald-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <p className="text-amber-300/85 text-[11px] leading-relaxed">
                        ★ {item.reward}
                      </p>
                      <span className="text-emerald-300/55 text-[10px] shrink-0">
                        {item.reference}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-800/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          aria-pressed={isFav}
                          aria-label={
                            isFav
                              ? `إزالة ${item.titleArabic} من المفضلة`
                              : `إضافة ${item.titleArabic} إلى المفضلة`
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                            isFav
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/60'
                              : 'bg-black/25 text-emerald-200 border-emerald-800/40 hover:text-rose-300'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400 text-rose-400' : ''}`}
                          />
                          <span>{isFav ? 'مفضلة ✓' : 'أضف للمفضلة'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.text, item.reference)}
                          className="p-2 rounded-xl text-emerald-300/75 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                          title="نسخ الذكر"
                          aria-label={`نسخ ${item.titleArabic}`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleShare(item.id, item.titleArabic, item.text, item.reference)
                          }
                          className="p-2 rounded-xl text-emerald-300/75 hover:text-white bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                          title="مشاركة الذكر"
                          aria-label={`مشاركة ${item.titleArabic}`}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {copiedId === item.id && (
                          <span className="text-[11px] text-amber-300">تم النسخ!</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIncrementHisn(item)}
                        disabled={isDone}
                        className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40 cursor-default'
                            : 'bg-[#c5a059] text-black hover:bg-[#d8b368] active:scale-95 shadow-lg shadow-amber-900/30'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>تم ({item.count})</span>
                          </>
                        ) : (
                          <>
                            <span>اضغط للذكر</span>
                            <span className="px-2 py-0.5 rounded-lg bg-black/20 text-black font-extrabold tabular-nums">
                              {currentCount} / {item.count}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

