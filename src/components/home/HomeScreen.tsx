import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  Compass,
  Sparkles,
  Heart,
  ChevronLeft,
  MapPin,
  Play,
  Share2,
  Trophy,
  Volume2,
  Flame,
  ShieldCheck,
  MessageSquareText,
  HardDrive,
} from 'lucide-react';
import { OfflineCenterModal } from '../pwa/OfflineCenterModal';
import realKaabaPhoto from '../../assets/images/real_kaaba_makkah_1794849198898.jpg';
import {
  calculatePrayerTimes,
  getNextPrayerCountdown,
  formatPrayerTime,
  getHijriDate,
  getCityWallClockDate,
  formatCityClockTime,
  getTimeZoneOffsetHours,
  formatUtcOffsetLabel,
  POPULAR_CITIES,
} from '../../utils/prayerCalculator';
import { DAILY_AYAT } from '../../data/quranMeta';
import { getPostPrayerStatus } from '../../utils/adhkarPrayerSync';

interface HomeScreenProps {
  onNavigate: (screen: string, extra?: Record<string, unknown>) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [now, setNow] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const savedName = localStorage.getItem('noor_selected_city');
      return POPULAR_CITIES.find((c) => c.nameEnglish === savedName) || POPULAR_CITIES[0];
    } catch {
      return POPULAR_CITIES[0];
    }
  });
  const [copiedVerseToast, setCopiedVerseToast] = useState(false);
  const [kaabaImageFailed, setKaabaImageFailed] = useState(false);
  const [showOfflineCenter, setShowOfflineCenter] = useState(false);
  const [lastRead, setLastRead] = useState<{
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    pageNumber: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('noor_last_read');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Tick timer every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cityNow = getCityWallClockDate(now, selectedCity.timeZone);
  const calcMethod = (() => {
    try {
      const saved = localStorage.getItem('noor_calc_method');
      if (saved) return saved;
    } catch {}
    return selectedCity.countryArabic === 'سوريا' ? 'syria' : 'ummAlQura';
  })();

  const prayerTimes = calculatePrayerTimes(
    cityNow,
    selectedCity.latitude,
    selectedCity.longitude,
    calcMethod,
    {},
    selectedCity.timeZone
  );

  const countdown = getNextPrayerCountdown(prayerTimes, cityNow);
  const hijri = getHijriDate(cityNow);
  const postPrayerStatus = getPostPrayerStatus(prayerTimes, cityNow);
  const cityClockLabel = formatCityClockTime(now, selectedCity.timeZone);
  const utcOffsetLabel = formatUtcOffsetLabel(getTimeZoneOffsetHours(now, selectedCity.timeZone));

  // Time-of-day greeting
  const hour = cityNow.getHours();
  const greeting =
    hour >= 4 && hour < 12
      ? 'صباح الخير والبركة والقرآن'
      : hour >= 12 && hour < 17
      ? 'طاب يومكم بذكر الله وطاعته'
      : 'مساء الرحمة والسكينة والأنوار';

  // Rotating daily Ayah
  const dayOfYear = Math.floor(
    (cityNow.getTime() - new Date(cityNow.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const dailyAyah = DAILY_AYAT[dayOfYear % DAILY_AYAT.length];

  // Morning vs Evening Adhkar recommendation
  const isMorning = hour >= 4 && hour < 15;

  return (
    <div className="w-full max-w-5xl mx-auto pb-28 px-4 space-y-8">
      {/* Welcome & Location Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs text-amber-300 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-1">
            {hijri.fullDateArabic} · {now.toLocaleDateString('ar-SA')}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {greeting}
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            مرحباً بك في «نور القرآن» منصتك الإسلامية المتكاملة
          </p>
        </div>

        {/* Location selector & Syria time quick toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              const damascus = POPULAR_CITIES.find((x) => x.nameEnglish === 'Damascus');
              if (damascus) {
                setSelectedCity(damascus);
                try {
                  localStorage.setItem('noor_selected_city', damascus.nameEnglish);
                  localStorage.setItem('noor_calc_method', 'syria');
                } catch {}
              }
            }}
            className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
              selectedCity.countryArabic === 'سوريا'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-[#082a1f]/80 border-emerald-700/40 text-emerald-200 hover:border-amber-400/50 hover:text-amber-200'
            }`}
            title="ضبط التوقيت على الجمهورية العربية السورية (دمشق UTC+03:00)"
          >
            توقيت سوريا
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#082a1f]/80 border border-emerald-700/40 text-xs text-emerald-100">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedCity.nameEnglish}
              onChange={(e) => {
                const c = POPULAR_CITIES.find((x) => x.nameEnglish === e.target.value);
                if (c) {
                  setSelectedCity(c);
                  try {
                    localStorage.setItem('noor_selected_city', c.nameEnglish);
                    if (c.countryArabic === 'سوريا') {
                      localStorage.setItem('noor_calc_method', 'syria');
                    }
                  } catch {}
                }
              }}
              className="bg-transparent text-amber-200 focus:outline-none cursor-pointer"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.nameEnglish} value={c.nameEnglish} className="bg-slate-900 text-white">
                  {c.nameArabic} ({c.countryArabic})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Real Kaaba Showcase & Next Prayer Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Real Photograph of Al-Kaaba Al-Musharrafah */}
        <div className="lg:col-span-7 rounded-3xl p-5 bg-gradient-to-b from-[#06241b] via-[#041a13] to-[#02100b] border-2 border-amber-500/30 shadow-2xl relative flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between z-10 mb-3">
            <span className="text-sm font-bold text-amber-300">الكعبة المشرفة — المسجد الحرام</span>
            <span className="text-xs text-emerald-200/80">مكة المكرمة</span>
          </div>

          <div className="relative flex-1 min-h-[260px] md:min-h-[340px] rounded-2xl overflow-hidden border border-amber-500/25 bg-[#03140e]">
            {!kaabaImageFailed ? (
              <img
                src={realKaabaPhoto}
                alt="صورة حقيقية للكعبة المشرفة في المسجد الحرام بمكة المكرمة"
                referrerPolicy="no-referrer"
                onError={() => setKaabaImageFailed(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-br from-[#06291e] via-[#041b13] to-[#02100b]">
                <Compass className="w-10 h-10 text-amber-400" />
                <div className="text-base font-bold text-amber-200">الكعبة المشرفة · المسجد الحرام</div>
                <p className="text-xs text-emerald-200/75 max-w-sm">
                  البيت الحرام في مكة المكرمة — قبلة المسلمين في مشارق الأرض ومغاربها
                </p>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">البيت الحرام</p>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  قبلة المسلمين في كل صلاة · ٢١.٤٢٢٥° شمالاً، ٣٩.٨٢٦٢° شرقاً
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-800/30 flex items-center justify-between text-xs z-10">
            <span className="text-emerald-200/80">
              صورة المسجد الحرام والكعبة المشرفة بمكة المكرمة
            </span>
            <button
              type="button"
              onClick={() => onNavigate('qibla')}
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>بوصلة القبلة</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Next Prayer Card & Continue Reading */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Next Prayer Countdown Card */}
          <div className="rounded-3xl p-6 bg-gradient-to-b from-[#083325] to-[#041c14] border border-amber-500/30 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-amber-300/90 font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                  الصلاة القادمة
                </span>
                <span className="text-xs text-emerald-300/80 font-semibold">
                  {selectedCity.nameArabic}{selectedCity.countryArabic ? ` (${selectedCity.countryArabic})` : ''}
                </span>
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-1">
                صلاة {countdown.nextPrayerNameArabic}
              </h2>
              <p className="text-xs text-amber-200/80">
                يحين أذانها في تمام {formatPrayerTime(countdown.nextPrayerTime)}
              </p>
              <p className="text-[11px] text-emerald-300/75 mt-1.5 tabular-nums">
                الوقت المحلي الآن في {selectedCity.nameArabic}: <span className="text-amber-300 font-bold">{cityClockLabel}</span> ({utcOffsetLabel})
              </p>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-black/40 border border-emerald-800/30 text-center">
              <span className="text-[11px] text-emerald-300/60 block mb-1">الوقت المتبقي للأذان</span>
              <div className="text-3xl font-extrabold text-amber-300 tabular-nums tracking-widest drop-shadow">
                {countdown.formattedCountdown}
              </div>
            </div>

            <button
              onClick={() => onNavigate('prayer')}
              className="w-full py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>عرض مواقيت الصلوات الخمس كاملة</span>
            </button>
          </div>

          {/* Continue Reading Card */}
          <div className="rounded-3xl p-5 bg-[#06241b]/80 border border-emerald-700/30 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-amber-300/80 font-semibold block">
                  متابعة التلاوة
                </span>
                <h4 className="text-sm font-bold text-white">
                  {lastRead ? `سورة ${lastRead.surahName}` : 'سورة الفاتحة'}
                </h4>
                <p className="text-[11px] text-emerald-300/70">
                  {lastRead ? `صفحة ${lastRead.pageNumber} · الآية ${lastRead.ayahNumber}` : 'صفحة ١ · الآية ١'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('quran')}
              className="px-4 py-2 rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] active:scale-95 transition-all shadow-md cursor-pointer"
            >
              متابعة القراءة
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h3 className="text-xs font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>الخدمات الإسلامية السريعة:</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('quran')}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">المصحف الشريف</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">بالرسم العثماني</span>
          </button>

          <button
            onClick={() => onNavigate('recitations')}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">صوت عبد الباسط</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">مرتل ومجود</span>
          </button>

          <button
            onClick={() => onNavigate('duas_ruqyah', { tab: 'duas' })}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">أدعية بصوت الشيوخ</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">القنوت وختم القرآن</span>
          </button>

          <button
            onClick={() => onNavigate('duas_ruqyah', { tab: 'ruqyah' })}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">الرقية الشرعية</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">صوتية وآيات التحصين</span>
          </button>

          <button
            onClick={() => onNavigate('prayer')}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">مواقيت الصلاة</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">والأذان التلقائي</span>
          </button>

          <button
            onClick={() => onNavigate('qibla')}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">اتجاه القبلة</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">تحديد اتجاه الكعبة</span>
          </button>

          <button
            onClick={() => onNavigate('sebha')}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">المسبحة الإلكترونية</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">عداد تسبيح ذكي</span>
          </button>

          <button
            onClick={() => onNavigate('khatmah')}
            className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c392c] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">خطة الختمة</span>
            <span className="text-[10px] text-emerald-300/60 mt-0.5">ختم القرآن بسهولة</span>
          </button>

          <button
            onClick={() => onNavigate('duas_ruqyah', { tab: 'duas_text' })}
            className="col-span-2 p-4 rounded-2xl bg-[#082a1f]/80 hover:bg-[#0c392c] border border-emerald-700/40 hover:border-amber-400/50 transition-all flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 text-right">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  موسوعة الدعاء بلا إنترنت
                </span>
                <span className="text-[11px] text-emerald-200/75 block mt-0.5">
                  جوامع الدعاء من الكتاب والسنة · متاح دائماً
                </span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-amber-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setShowOfflineCenter(true)}
            className="col-span-2 p-4 rounded-2xl bg-[#083325]/90 hover:bg-[#0c4230] border border-amber-500/45 hover:border-amber-400 transition-all flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 text-right">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-amber-200 block">
                  التحميل والعمل بلا إنترنت
                </span>
                <span className="text-[11px] text-emerald-200/75 block mt-0.5">
                  تنزيل المصحف والأذان والأدعية لمرة واحدة ثم دائماً
                </span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-amber-400 shrink-0" />
          </button>

          <button
            onClick={() => onNavigate('sheikh_ai')}
            className="col-span-2 sm:col-span-4 p-4 rounded-2xl bg-[#083325]/90 hover:bg-[#0c4230] border border-amber-500/40 hover:border-amber-400 transition-all flex items-center justify-between gap-4 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-right">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <MessageSquareText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-amber-200 block">
                  اسأل الشيخ أبو نوار (إرشاد شرعي وقور)
                </span>
                <span className="text-xs text-emerald-200/75 block mt-0.5">
                  محاورة ذكية بإرشاد الشيخ أبو نوار في التدبر والوعظ والعبادات
                </span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-amber-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Daily Quranic Verse Card */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-[#06291e] via-[#083a2c] to-[#06291e] border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-amber-300 font-bold px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            آية اليوم الكريمة
          </span>
          <span className="text-xs text-emerald-200/80">
            سورة {dailyAyah.surahName} [الآية {dailyAyah.ayahNumber}]
          </span>
        </div>

        <p className="font-quran text-xl md:text-2xl text-amber-100 text-center leading-loose my-3 select-text">
          {dailyAyah.text}
        </p>

        <p className="text-xs text-emerald-200/70 text-center italic max-w-2xl mx-auto mb-4" dir="ltr">
          "{dailyAyah.translation}"
        </p>

        <div className="flex items-center justify-center gap-3 pt-3 border-t border-emerald-800/40">
          <button
            onClick={() => onNavigate('quran')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>قراءة السورة كاملة</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `آية اليوم - ${dailyAyah.surahName}`,
                  text: `${dailyAyah.text}\n[سورة ${dailyAyah.surahName}: ${dailyAyah.ayahNumber}]\nتطبيق نور القرآن`,
                }).catch(() => {});
              } else if (navigator.clipboard) {
                navigator.clipboard.writeText(`${dailyAyah.text} [سورة ${dailyAyah.surahName}]`).then(() => {
                  setCopiedVerseToast(true);
                  setTimeout(() => setCopiedVerseToast(false), 2500);
                }).catch(() => {});
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/30 border border-emerald-700/40 text-xs text-emerald-200 hover:text-white transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedVerseToast ? 'تم النسخ ✓' : 'مشاركة الآية'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Adhkar Banner: Post-Prayer (Auto) vs Morning/Evening */}
      {postPrayerStatus.isPostPrayer ? (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-amber-500/20 via-[#06291e] to-amber-500/20 border-2 border-amber-400 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 shadow-lg shadow-amber-400/20">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 inline-block mb-1">
                تنبيه تلقائي: دخل وقت الفريضة
              </span>
              <h4 className="text-base font-bold text-white">
                حان الآن وقت «أذكار ما بعد صلاة {postPrayerStatus.prayerNameArabic}»
              </h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                الاستغفار، والتسبيح (٣٣)، والتحميد (٣٣)، والتكبير (٣٣)، وآية الكرسي المأثورة
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('adhkar', { category: 'after_prayer' })}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-[#c5a059] text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
          >
            قراءة أذكار بعد الصلاة
          </button>
        </div>
      ) : (
        <div className="rounded-3xl p-6 bg-[#06241b]/90 border border-emerald-700/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {isMorning ? 'حان وقت أذكار الصباح' : 'حان وقت أذكار المساء'}
              </h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                حصن نفسك بذكر الله العظيم، مع عداد تفاعلي لضبط السنن
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('adhkar', { category: isMorning ? 'morning' : 'evening' })}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-[#c5a059] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
          >
            قراءة الأذكار الآن
          </button>
        </div>
      )}

      <OfflineCenterModal
        isOpen={showOfflineCenter}
        onClose={() => setShowOfflineCenter(false)}
      />
    </div>
  );
};
