import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Sliders,
  Play,
  Pause,
  Compass,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Flame,
  Sun,
  Moon,
  BellRing,
  Download,
  Loader2,
} from 'lucide-react';
import {
  downloadAudioBatch,
  getCachedAudioUrlsSet,
} from '../../utils/offlineStorage';
import {
  calculatePrayerTimes,
  getNextPrayerCountdown,
  formatPrayerTime,
  getHijriDate,
  getCityWallClockDate,
  formatCityClockTime,
  POPULAR_CITIES,
  CALCULATION_METHODS,
  getTimeZoneOffsetHours,
  formatUtcOffsetLabel,
  CityOption,
} from '../../utils/prayerCalculator';
import { ADHAN_RECORDINGS } from '../../data/quranMeta';
import {
  getPostPrayerStatus,
  requestSmartNotificationPermission,
  sendLocalNotification,
} from '../../utils/adhkarPrayerSync';
import {
  AdhanPlaybackState,
  getAdhanState,
  markAdhanEventTriggered,
  playAdhanAudio,
  setLiveAdhanVolume,
  stopAdhanAudio,
  subscribeAdhanState,
} from '../../utils/adhanPlayer';

interface PrayerTimesViewProps {
  onOpenQibla?: () => void;
  onOpenAdhkar?: (category?: string) => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ onOpenQibla, onOpenAdhkar }) => {
  // Location state
  const [selectedCity, setSelectedCity] = useState<CityOption>(() => {
    try {
      const savedName = localStorage.getItem('noor_selected_city');
      return POPULAR_CITIES.find((c) => c.nameEnglish === savedName) || POPULAR_CITIES[0];
    } catch {
      return POPULAR_CITIES[0];
    }
  });
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: selectedCity.latitude,
    longitude: selectedCity.longitude,
  });

  // Calculation method & minute adjustments
  const [calcMethod, setCalcMethod] = useState<string>(() => {
    return localStorage.getItem('noor_calc_method') || 'ummAlQura';
  });
  const [minuteAdjustments] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_minute_adjustments') || '{}');
    } catch {
      return {};
    }
  });

  // Adhan settings per prayer
  const [adhanSettings, setAdhanSettings] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('noor_adhan_settings') ||
          JSON.stringify({
            fajr: true,
            dhuhr: true,
            asr: true,
            maghrib: true,
            isha: true,
          })
      );
    } catch {
      return { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
    }
  });

  const [selectedAdhanId, setSelectedAdhanId] = useState<string>(() => {
    return localStorage.getItem('noor_selected_adhan_id') || 'saudi_makkah';
  });
  const [adhanVolume, setAdhanVolume] = useState<number>(() => {
    const saved = parseFloat(localStorage.getItem('noor_adhan_volume') || '0.85');
    return isNaN(saved) ? 0.85 : saved;
  });
  const [preAdhanReminder, setPreAdhanReminder] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('noor_pre_adhan_mins') || '10', 10);
    return isNaN(saved) ? 10 : saved;
  });
  const [adhanPlayback, setAdhanPlayback] = useState<AdhanPlaybackState>(() => getAdhanState());
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [cachedAdhanIds, setCachedAdhanIds] = useState<string[]>([]);
  const [downloadingAdhanAll, setDownloadingAdhanAll] = useState<boolean>(false);

  const syncCachedAdhan = async () => {
    const urls = [
      ...ADHAN_RECORDINGS.map((a) => a.audioUrl),
      ...ADHAN_RECORDINGS.map((a) => a.fallbackAudioUrl || '').filter(Boolean),
    ];
    const cached = await getCachedAudioUrlsSet(urls);
    setCachedAdhanIds(
      ADHAN_RECORDINGS.filter(
        (a) => cached.has(a.audioUrl) || (a.fallbackAudioUrl && cached.has(a.fallbackAudioUrl))
      ).map((a) => a.id)
    );
  };

  useEffect(() => {
    syncCachedAdhan();
  }, []);

  useEffect(() => {
    return subscribeAdhanState((next) => {
      setAdhanPlayback(next);
      if (next.status === 'playing') {
        setTimeout(() => {
          syncCachedAdhan();
        }, 1200);
      }
      if (next.status === 'error' && next.errorMessage) {
        setStatusNotice(next.errorMessage);
      }
    });
  }, []);

  const handleDownloadAllAdhanOffline = async () => {
    if (downloadingAdhanAll) return;
    setDownloadingAdhanAll(true);
    setStatusNotice('جاري حفظ جميع أصوات الأذان للعمل دائماً بدون إنترنت...');
    const res = await downloadAudioBatch(
      ADHAN_RECORDINGS.map((a) => ({
        id: a.id,
        label: a.titleArabic,
        url: a.audioUrl,
        fallbackUrl: a.fallbackAudioUrl,
      }))
    );
    await syncCachedAdhan();
    setDownloadingAdhanAll(false);
    setStatusNotice(
      res.failedIds.length === 0
        ? 'تم حفظ جميع أصوات الأذان (٥ مؤذنين) على جهازك للعمل بلا إنترنت دائماً ✓'
        : `تم حفظ ${res.cachedIds.length} من ${ADHAN_RECORDINGS.length} أصوات أذان؛ يمكنك المحاولة مجدداً لبقية الأصوات.`
    );
  };

  const isPlayingAdhanTest = adhanPlayback.status === 'playing';
  const isLoadingAdhanTest = adhanPlayback.status === 'loading';

  // Live timer tick
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cityNow = useMemo(
    () => getCityWallClockDate(now, selectedCity.timeZone),
    [now, selectedCity.timeZone]
  );
  const cityClockLabel = formatCityClockTime(now, selectedCity.timeZone);

  // Calculate DST-aware prayer times using the city's own local calendar date
  const prayerTimes = useMemo(
    () =>
      calculatePrayerTimes(
        cityNow,
        userCoords.latitude,
        userCoords.longitude,
        calcMethod,
        minuteAdjustments,
        selectedCity.timeZone
      ),
    [cityNow, userCoords.latitude, userCoords.longitude, calcMethod, minuteAdjustments, selectedCity.timeZone]
  );

  const utcOffsetLabel = formatUtcOffsetLabel(
    getTimeZoneOffsetHours(now, selectedCity.timeZone)
  );

  const countdown = getNextPrayerCountdown(prayerTimes, cityNow);
  const hijriDate = getHijriDate(cityNow);
  const postPrayerStatus = getPostPrayerStatus(prayerTimes, cityNow);

  const [smartAdhkarNotifs, setSmartAdhkarNotifs] = useState<boolean>(() => {
    return localStorage.getItem('noor_smart_adhkar_notifs') === 'true';
  });

  // Live auto-Adhan & pre-Adhan reminder monitor (evaluated in city local wall-clock)
  useEffect(() => {
    const prayerKeys: Array<{ key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; label: string }> = [
      { key: 'fajr', label: 'الفجر' },
      { key: 'dhuhr', label: 'الظهر' },
      { key: 'asr', label: 'العصر' },
      { key: 'maghrib', label: 'المغرب' },
      { key: 'isha', label: 'العشاء' },
    ];
    const dayKey = `${cityNow.getFullYear()}-${cityNow.getMonth() + 1}-${cityNow.getDate()}`;

    for (const p of prayerKeys) {
      const target = prayerTimes[p.key];
      if (!target) continue;
      const diffSec = Math.floor((target.getTime() - cityNow.getTime()) / 1000);

      // Pre-Adhan reminder (within 0..10s window of target pre-reminder minute)
      if (preAdhanReminder > 0) {
        const preTargetSec = preAdhanReminder * 60;
        const preId = `${dayKey}-pre-${p.key}-${preAdhanReminder}`;
        if (diffSec <= preTargetSec && diffSec > preTargetSec - 5 && markAdhanEventTriggered(preId)) {
          const msg = `اقترب موعد أذان ${p.label} بعد ${preAdhanReminder} دقائق`;
          setStatusNotice(msg);
          if (smartAdhkarNotifs) {
            sendLocalNotification('نور القرآن - تنبيه ما قبل الصلاة', msg);
          }
        }
      }

      // Exact prayer time hit (within 0..10s window)
      const adhanId = `${dayKey}-adhan-${p.key}`;
      if (diffSec <= 0 && diffSec >= -10 && markAdhanEventTriggered(adhanId)) {
        setStatusNotice(`حان الآن موعد أذان صلاة ${p.label} حسب التوقيت المحلي`);
        if (smartAdhkarNotifs) {
          sendLocalNotification(`حان الآن وقت صلاة ${p.label}`, 'حي على الصلاة · حي على الفلاح');
        }
        if (adhanSettings[p.key]) {
          playAdhanAudio({
            recordingId: selectedAdhanId,
            volume: adhanVolume,
            prayerLabel: `صلاة ${p.label}`,
          }).then((res) => {
            if (!res.ok && res.message) {
              setStatusNotice(res.message);
            }
          });
        }
      }
    }
  }, [cityNow, prayerTimes, preAdhanReminder, adhanSettings, selectedAdhanId, adhanVolume, smartAdhkarNotifs]);

  const handleToggleSmartAdhkarNotifs = async () => {
    if (!smartAdhkarNotifs) {
      const granted = await requestSmartNotificationPermission();
      if (granted) {
        setSmartAdhkarNotifs(true);
        localStorage.setItem('noor_smart_adhkar_notifs', 'true');
        sendLocalNotification(
          'تطبيق نور القرآن - تم تفعيل الإشعارات الذكية',
          'ستصلك إشعارات أذكار الصباح عند أذان الفجر، وأذكار المساء عند أذان العصر، وأذكار ما بعد الصلوات فور دخول وقتها.'
        );
      } else {
        setStatusNotice('يرجى السماح بالإشعارات في المتصفح لتفعيل التنبيهات التلقائية للأذكار.');
      }
    } else {
      setSmartAdhkarNotifs(false);
      localStorage.setItem('noor_smart_adhkar_notifs', 'false');
    }
  };

  // Geolocation auto-detect
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setUserCoords({ latitude: lat, longitude: lon });
          setSelectedCity({
            nameArabic: 'موقعي الحالي',
            nameEnglish: 'Current Location',
            countryArabic: '',
            latitude: lat,
            longitude: lon,
            timeZone: browserTz,
          });
          setStatusNotice('تم تحديث الإحداثيات والمنطقة الزمنية حسب موقعك الحالي.');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setStatusNotice('تعذر تحديد الموقع تلقائياً، يرجى اختيار مدينتك من القائمة.');
        }
      );
    }
  };

  // Toggle per-prayer Adhan notification
  const toggleAdhanForPrayer = (prayerKey: string) => {
    const updated = { ...adhanSettings, [prayerKey]: !adhanSettings[prayerKey] };
    setAdhanSettings(updated);
    localStorage.setItem('noor_adhan_settings', JSON.stringify(updated));
  };

  // Test Adhan sound with verified CDN + fallback
  const handleTestAdhan = async () => {
    if (isPlayingAdhanTest || isLoadingAdhanTest) {
      stopAdhanAudio();
      return;
    }

    setStatusNotice(null);
    const result = await playAdhanAudio({
      recordingId: selectedAdhanId,
      volume: adhanVolume,
      prayerLabel: 'تجربة صوت الأذان',
    });

    if (!result.ok && result.message) {
      setStatusNotice(result.message);
    }
  };

  const prayersList = [
    { key: 'fajr', nameArabic: 'الفجر', time: prayerTimes.fajr, icon: 'Sunrise' },
    { key: 'sunrise', nameArabic: 'الشروق', time: prayerTimes.sunrise, icon: 'Sun' },
    { key: 'dhuhr', nameArabic: 'الظهر', time: prayerTimes.dhuhr, icon: 'Sun' },
    { key: 'asr', nameArabic: 'العصر', time: prayerTimes.asr, icon: 'Sunset' },
    { key: 'maghrib', nameArabic: 'المغرب', time: prayerTimes.maghrib, icon: 'Sunset' },
    { key: 'isha', nameArabic: 'العشاء', time: prayerTimes.isha, icon: 'Moon' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto pb-28 px-4">
      {/* Header with City & Hijri Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#c5a059]" />
            <span>مواقيت الصلاة والأذان</span>
          </h2>
          <p className="text-xs text-emerald-300/70 mt-1 flex flex-wrap items-center gap-2">
            <span>{hijriDate.fullDateArabic} · {cityNow.toLocaleDateString('ar-SA')}</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold text-[11px] tabular-nums">
              الوقت في {selectedCity.nameArabic}: {cityClockLabel}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-black/40 border border-emerald-700/40 text-amber-300 font-mono text-[10px]" dir="ltr">
              {utcOffsetLabel}
            </span>
          </p>
        </div>

        {/* City Selector & Quick Syria Timing Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const damascus = POPULAR_CITIES.find((c) => c.nameEnglish === 'Damascus');
              if (damascus) {
                setSelectedCity(damascus);
                setUserCoords({ latitude: damascus.latitude, longitude: damascus.longitude });
                setCalcMethod('syria');
                try {
                  localStorage.setItem('noor_selected_city', damascus.nameEnglish);
                  localStorage.setItem('noor_calc_method', 'syria');
                } catch {}
              }
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              selectedCity.countryArabic === 'سوريا'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-[#082a1f] border-emerald-700/50 text-emerald-200 hover:border-amber-400/50 hover:text-amber-200'
            }`}
            title="ضبط التوقيت على الجمهورية العربية السورية (دمشق UTC+03:00)"
          >
            توقيت سوريا
          </button>

          <select
            value={selectedCity.nameEnglish}
            onChange={(e) => {
              const city = POPULAR_CITIES.find((c) => c.nameEnglish === e.target.value);
              if (city) {
                setSelectedCity(city);
                setUserCoords({ latitude: city.latitude, longitude: city.longitude });
                if (city.countryArabic === 'سوريا') {
                  setCalcMethod('syria');
                  try {
                    localStorage.setItem('noor_calc_method', 'syria');
                  } catch {}
                }
                try {
                  localStorage.setItem('noor_selected_city', city.nameEnglish);
                } catch {}
              }
            }}
            className="bg-[#082a1f] border border-emerald-700/50 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none"
          >
            {POPULAR_CITIES.map((c) => (
              <option key={c.nameEnglish} value={c.nameEnglish} className="bg-slate-900 text-white">
                {c.nameArabic} ({c.countryArabic})
              </option>
            ))}
          </select>

          <button
            onClick={detectLocation}
            className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors"
            title="تحديد الموقع الجغرافي تلقائياً"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {onOpenQibla && (
            <button
              onClick={onOpenQibla}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#c5a059] text-black font-bold text-xs"
            >
              <Compass className="w-4 h-4" />
              <span>القبلة</span>
            </button>
          )}
        </div>
      </div>

      {statusNotice && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-center justify-between gap-3">
          <span>{statusNotice}</span>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-amber-300 hover:text-white font-bold px-2 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Hero Next Prayer Live Countdown Card */}
      <div className="rounded-3xl p-6 mb-8 bg-gradient-to-b from-[#083325] via-[#05261b] to-[#02150f] border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
          <div>
            <span className="text-xs text-amber-300/90 font-medium px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-2">
              الصلاة القادمة
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
              صلاة {countdown.nextPrayerNameArabic}
            </h3>
            <p className="text-sm text-amber-200/80">
              يحين وقتها في تمام {formatPrayerTime(countdown.nextPrayerTime)}
            </p>
          </div>

          {/* Live Countdown Display */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-black/40 border border-amber-500/20 min-w-48">
            <span className="text-[11px] text-emerald-300/60 mb-1">الوقت المتبقي للأذان</span>
            <div className="text-3xl md:text-4xl font-extrabold text-amber-300 tabular-nums tracking-widest drop-shadow">
              {countdown.formattedCountdown}
            </div>
            <span className="text-[10px] text-amber-400/80 mt-1">
              {adhanSettings[countdown.nextPrayerKey] ? 'الأذان التلقائي مفعل لهذه الصلاة' : 'الأذان صامت'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Prayers Today Timeline Table */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-amber-300 mb-3">جدول مواقيت صلوات اليوم</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {prayersList.map((p) => {
            const isNext = countdown.nextPrayerKey === p.key;
            const hasPassed = p.time.getTime() < cityNow.getTime();
            const isAdhanOn = adhanSettings[p.key];

            return (
              <div
                key={p.key}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                  isNext
                    ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10 scale-105'
                    : hasPassed
                    ? 'bg-[#082a1f]/40 border-emerald-800/20 opacity-75'
                    : 'bg-[#082a1f]/80 border-emerald-700/40'
                }`}
              >
                <div className="text-xs font-bold text-emerald-200 mb-1">{p.nameArabic}</div>

                <div className="text-lg font-bold text-amber-300 tabular-nums my-1">
                  {formatPrayerTime(p.time)}
                </div>

                {p.key !== 'sunrise' ? (
                  <button
                    onClick={() => toggleAdhanForPrayer(p.key)}
                    className={`mt-2 p-1.5 rounded-lg text-xs transition-colors ${
                      isAdhanOn
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-slate-400 bg-black/20 hover:text-slate-200'
                    }`}
                    title={isAdhanOn ? 'تعطيل أذان هذه الصلاة' : 'تفعيل أذان هذه الصلاة'}
                  >
                    {isAdhanOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <span className="text-[10px] text-amber-200/40 mt-2">شروق</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Automatic Post-Prayer Adhkar Section (يظهر تلقائياً بعد دخول وقت الصلاة) */}
      {postPrayerStatus.isPostPrayer && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-[#0d3f30]/60 to-amber-500/20 border-2 border-amber-400 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 pb-3 border-b border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-400/20">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 inline-block">
                  يظهر تلقائياً الآن: دخل وقت الفريضة
                </span>
                <h3 className="text-lg md:text-xl font-extrabold text-white">
                  أذكار ما بعد صلاة {postPrayerStatus.prayerNameArabic}
                </h3>
              </div>
            </div>

            {onOpenAdhkar && (
              <button
                onClick={() => onOpenAdhkar('after_prayer')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#c5a059] text-black font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                فتح قسم أذكار بعد الصلاة كاملاً
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right">
            <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">الاستغفار والسلام:</span>
              <p className="text-xs text-emerald-100 font-arabic-serif leading-relaxed">
                «أَسْتَغْفِرُ اللَّهَ (٣×)، اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ، تَبَارَكْتَ يَا ذَا الجَلاَلِ وَالإِكْرَامِ»
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">التسبيح والتحميد والتكبير:</span>
              <p className="text-xs text-emerald-100 font-arabic-serif leading-relaxed">
                سُبْحَانَ اللَّهِ (٣٣) · الْحَمْدُ لِلَّهِ (٣٣) · اللَّهُ أَكْبَرُ (٣٣) · وتمام المائة بالتوحيد.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">أعظم آية: آية الكرسي</span>
              <p className="text-xs text-emerald-100 font-arabic-serif leading-relaxed">
                «اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...» لم يمنعه من دخول الجنة إلا أن يموت.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Adhkar Notifications Based on Prayer Times */}
      <div className="p-6 rounded-3xl bg-[#06241b]/80 border border-emerald-700/40 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-emerald-800/40">
          <div>
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-400" />
              <span>إشعارات الأذكار الذكية وفق مواقيت الصلاة</span>
            </h3>
            <p className="text-xs text-emerald-300/70 mt-1">
              إرسال إشعارات ذكية لأذكار الصباح مع أذان الفجر، ولأذكار المساء مع أذان العصر، وأذكار ما بعد الصلوات
            </p>
          </div>

          <button
            onClick={handleToggleSmartAdhkarNotifs}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              smartAdhkarNotifs
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'bg-emerald-950/80 border border-amber-500/40 text-amber-300 hover:bg-emerald-900'
            }`}
          >
            {smartAdhkarNotifs ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            <span>{smartAdhkarNotifs ? 'الإشعارات الذكية مفعلة ✓' : 'تفعيل الإشعارات الذكية'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-black/30 border border-emerald-800/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">أذكار الصباح</span>
              <span className="text-[11px] text-emerald-300/70">
                مرتبطة بأذان الفجر ({formatPrayerTime(prayerTimes.fajr)})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-emerald-800/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">أذكار المساء</span>
              <span className="text-[11px] text-emerald-300/70">
                مرتبطة بأذان العصر ({formatPrayerTime(prayerTimes.asr)})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-emerald-800/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">أذكار بعد الصلاة</span>
              <span className="text-[11px] text-emerald-300/70">تلقائياً عند دخول كل فريضة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentic Saudi Adhan Audio Settings & Live Tester */}
      <div className="p-6 rounded-3xl bg-[#06241b]/80 border border-emerald-700/30 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <span>إعدادات صوت الأذان السعودي الأصلي</span>
          </h3>

          <button
            type="button"
            onClick={handleDownloadAllAdhanOffline}
            disabled={downloadingAdhanAll || cachedAdhanIds.length >= ADHAN_RECORDINGS.length}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              cachedAdhanIds.length >= ADHAN_RECORDINGS.length
                ? 'bg-emerald-800/40 border border-emerald-600/50 text-emerald-200'
                : 'bg-[#c5a059] text-black hover:bg-[#d8b368] disabled:opacity-60'
            }`}
          >
            {downloadingAdhanAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري حفظ أصوات الأذان...</span>
              </>
            ) : cachedAdhanIds.length >= ADHAN_RECORDINGS.length ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>جميع الأصوات محفوظة أوفلاين ({cachedAdhanIds.length}/{ADHAN_RECORDINGS.length})</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>حفظ الأذان بلا إنترنت ({cachedAdhanIds.length}/{ADHAN_RECORDINGS.length})</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Adhan Voice Selector */}
          <div>
            <label className="text-xs text-emerald-200/80 block mb-2">اختر تسجيل الأذان:</label>
            <div className="space-y-2">
              {ADHAN_RECORDINGS.map((adhan) => {
                const isCached = cachedAdhanIds.includes(adhan.id);
                return (
                  <button
                    key={adhan.id}
                    type="button"
                    onClick={() => {
                      setSelectedAdhanId(adhan.id);
                      try {
                        localStorage.setItem('noor_selected_adhan_id', adhan.id);
                      } catch {}
                      if (isPlayingAdhanTest || isLoadingAdhanTest) {
                        playAdhanAudio({
                          recordingId: adhan.id,
                          volume: adhanVolume,
                          prayerLabel: 'تجربة صوت الأذان',
                        });
                      }
                    }}
                    className={`w-full p-3 rounded-xl text-right text-xs transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                      selectedAdhanId === adhan.id
                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                        : 'bg-black/30 border-emerald-800/40 text-emerald-200 hover:bg-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{adhan.titleArabic}</span>
                      {isCached && (
                        <span className="text-[10px] text-emerald-300 whitespace-nowrap shrink-0">
                          · بلا نت ✓
                        </span>
                      )}
                    </div>
                    {selectedAdhanId === adhan.id && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume, Pre-reminder, & Test Button */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <label className="text-xs text-emerald-200/80 block mb-2">
                مستوى صوت الأذان ({Math.round(adhanVolume * 100)}%):
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={adhanVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAdhanVolume(val);
                  setLiveAdhanVolume(val);
                  try {
                    localStorage.setItem('noor_adhan_volume', String(val));
                  } catch {}
                }}
                aria-label="مستوى صوت الأذان"
                className="w-full accent-amber-400 bg-emerald-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-emerald-200/80 block mb-2">
                تنبيه اقتراب وقت الصلاة قبل الأذان بـ:
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 0].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setPreAdhanReminder(mins);
                      try {
                        localStorage.setItem('noor_pre_adhan_mins', String(mins));
                      } catch {}
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs border transition-colors cursor-pointer ${
                      preAdhanReminder === mins
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-black/30 border-emerald-800/40 text-emerald-300/70 hover:text-white'
                    }`}
                  >
                    {mins === 0 ? 'معطل' : `${mins} دقائق`}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Adhan Audio Button */}
            <button
              type="button"
              onClick={handleTestAdhan}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-300 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              {isPlayingAdhanTest ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black" />
              )}
              <span>
                {isLoadingAdhanTest
                  ? 'جاري تحميل وتشغيل الأذان...'
                  : isPlayingAdhanTest
                  ? 'إيقاف صوت الأذان'
                  : 'معاينة واختبار صوت الأذان الآن'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Calculation Method & Minute Adjustments Settings */}
      <div className="p-6 rounded-3xl bg-[#06241b]/60 border border-emerald-800/30">
        <h4 className="text-xs font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>طريقة الحساب الفلكي والضبط الدقيق:</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-emerald-300/70 block mb-1.5">الجهة الفقهية المعتمدة:</label>
            <select
              value={calcMethod}
              onChange={(e) => {
                setCalcMethod(e.target.value);
                localStorage.setItem('noor_calc_method', e.target.value);
              }}
              className="w-full bg-black/40 border border-emerald-700/40 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none"
            >
              {Object.values(CALCULATION_METHODS).map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.nameArabic}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-300/70 p-3 rounded-xl bg-black/20 border border-emerald-800/30">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              نظام الأذان يعمل وفق ضوابط المتصفح والأجهزة، مع دعم التنبيهات الصوتية الحقيقية عند دخول وقت كل صلاة.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
