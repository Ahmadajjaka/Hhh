/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { SplashScreen } from './components/layout/SplashScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { QuranView } from './components/quran/QuranView';
import { RecitationsHub } from './components/recitations/RecitationsHub';
import { PrayerTimesView } from './components/prayer/PrayerTimesView';
import { AdhkarView } from './components/adhkar/AdhkarView';
import { DuasRuqyahView, DuasRuqyahTab } from './components/duas/DuasRuqyahView';
import { Sebha3D } from './components/three/Sebha3D';
import { QiblaCompass } from './components/three/QiblaCompass';
import { KhatmahView } from './components/khatmah/KhatmahView';
import { MoreHubView } from './components/more/MoreHubView';
import { SheikhAiView } from './components/sheikh/SheikhAiView';
import { OfflineIndicator } from './components/pwa/PWAInstallUI';
import {
  calculatePrayerTimes,
  getCityWallClockDate,
  POPULAR_CITIES,
} from './utils/prayerCalculator';
import {
  AdhanPlaybackState,
  getAdhanState,
  markAdhanEventTriggered,
  playAdhanAudio,
  stopAdhanAudio,
  subscribeAdhanState,
} from './utils/adhanPlayer';
import { sendLocalNotification } from './utils/adhkarPrayerSync';
import { parseInitialScreenFromSearch } from './utils/pwaHelpers';
import {
  AppThemeId,
  applyThemeToDocument,
  getAppTheme,
  loadSavedThemeId,
  saveThemeId,
  shouldAutoSkipSplash,
} from './utils/appThemes';
import { Sparkles, Compass, Volume2, X } from 'lucide-react';

export default function App() {
  const initialLaunch =
    typeof window !== 'undefined' ? parseInitialScreenFromSearch(window.location.search) : null;

  const [activeScreen, setActiveScreen] = useState<string>(initialLaunch?.screen || 'home');
  const [themeId, setThemeId] = useState<AppThemeId>(() => loadSavedThemeId());
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !shouldAutoSkipSplash(window.location.search);
  });
  const [splashReplay, setSplashReplay] = useState<boolean>(false);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: POPULAR_CITIES[0].latitude,
    longitude: POPULAR_CITIES[0].longitude,
  });

  const [adhkarCategory, setAdhkarCategory] = useState<string>(
    initialLaunch?.category || 'morning'
  );
  const [duasRuqyahTab, setDuasRuqyahTab] = useState<DuasRuqyahTab>(
    initialLaunch?.tab || 'duas'
  );

  const [adhanState, setAdhanState] = useState<AdhanPlaybackState>(() => getAdhanState());

  useEffect(() => {
    applyThemeToDocument(themeId);
    saveThemeId(themeId);
  }, [themeId]);

  // Global Adhan scheduler & live playback state subscription (works on any screen)
  useEffect(() => {
    const unsubscribe = subscribeAdhanState(setAdhanState);

    const checkGlobalAdhan = () => {
      try {
        const savedCityName = localStorage.getItem('noor_selected_city');
        const city = POPULAR_CITIES.find((c) => c.nameEnglish === savedCityName) || POPULAR_CITIES[0];
        const calcMethod =
          localStorage.getItem('noor_calc_method') ||
          (city.countryArabic === 'سوريا' ? 'syria' : 'ummAlQura');
        const adjustments = JSON.parse(localStorage.getItem('noor_minute_adjustments') || '{}');
        const settings = JSON.parse(
          localStorage.getItem('noor_adhan_settings') ||
            '{"fajr":true,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'
        );
        const now = new Date();
        const cityNow = getCityWallClockDate(now, city.timeZone);
        const times = calculatePrayerTimes(
          cityNow,
          city.latitude,
          city.longitude,
          calcMethod,
          adjustments,
          city.timeZone
        );

        const dayKey = `${cityNow.getFullYear()}-${cityNow.getMonth() + 1}-${cityNow.getDate()}`;
        const fardh: Array<{ key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; label: string }> = [
          { key: 'fajr', label: 'الفجر' },
          { key: 'dhuhr', label: 'الظهر' },
          { key: 'asr', label: 'العصر' },
          { key: 'maghrib', label: 'المغرب' },
          { key: 'isha', label: 'العشاء' },
        ];

        for (const p of fardh) {
          const target = times[p.key];
          if (!target) continue;
          const diffSec = Math.floor((target.getTime() - cityNow.getTime()) / 1000);
          const eventId = `${dayKey}-adhan-${p.key}`;
          if (diffSec <= 0 && diffSec >= -15 && markAdhanEventTriggered(eventId)) {
            if (localStorage.getItem('noor_smart_adhkar_notifs') === 'true') {
              sendLocalNotification(`حان الآن وقت صلاة ${p.label}`, 'حي على الصلاة · حي على الفلاح');
            }
            if (settings[p.key]) {
              playAdhanAudio({
                prayerLabel: `صلاة ${p.label}`,
              }).catch(() => {});
            }
          }
        }
      } catch {}
    };

    const timer = setInterval(checkGlobalAdhan, 5000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const activeTheme = getAppTheme(themeId);

  const handleNavigate = (screen: string, extra?: Record<string, unknown>) => {
    if (screen === 'adhkar' && extra?.category) {
      setAdhkarCategory(extra.category as string);
    }
    if (screen === 'duas_ruqyah' && extra?.tab) {
      setDuasRuqyahTab(extra.tab as DuasRuqyahTab);
    }
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#031911] text-slate-100 flex flex-col font-sans selection:bg-[#c5a059]/30 selection:text-amber-200 islamic-pattern">
      {showSplash && (
        <SplashScreen
          theme={activeTheme}
          autoDismissMs={splashReplay ? 0 : 2600}
          onFinish={() => {
            setShowSplash(false);
            setSplashReplay(false);
          }}
        />
      )}

      {/* Top Header strictly conforming to Top Bar Contract */}
      <Header
        activeScreen={activeScreen}
        setActiveScreen={handleNavigate}
        themeId={themeId}
        onSelectTheme={setThemeId}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-4 pb-20">
        {activeScreen === 'home' && (
          <HomeScreen onNavigate={handleNavigate} />
        )}

        {activeScreen === 'quran' && (
          <QuranView onNavigateHome={() => handleNavigate('home')} />
        )}

        {activeScreen === 'recitations' && (
          <RecitationsHub />
        )}

        {activeScreen === 'prayer' && (
          <PrayerTimesView
            onOpenQibla={() => handleNavigate('qibla')}
            onOpenAdhkar={(cat) => handleNavigate('adhkar', { category: cat || 'after_prayer' })}
          />
        )}

        {activeScreen === 'adhkar' && (
          <AdhkarView
            initialCategory={adhkarCategory}
            onNavigatePrayer={() => handleNavigate('prayer')}
            onNavigateDuasRuqyah={(tab) => handleNavigate('duas_ruqyah', { tab })}
          />
        )}

        {activeScreen === 'duas_ruqyah' && (
          <DuasRuqyahView
            initialTab={duasRuqyahTab}
            onOpenAdhkar={() => handleNavigate('adhkar')}
          />
        )}

        {activeScreen === 'sebha' && (
          <div className="w-full max-w-3xl mx-auto px-4 pb-28 pt-2">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-amber-300 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-[#c5a059]" />
                <span>المسبحة الإلكترونية التفاعلية</span>
              </h2>
              <p className="text-xs text-emerald-300/70 mt-1">
                سبّح واذكر الله بعداد تفاعلي مع اللمس والاهتزاز والصوت
              </p>
            </div>
            <Sebha3D />
          </div>
        )}

        {activeScreen === 'qibla' && (
          <div className="w-full max-w-2xl mx-auto px-4 pb-28 pt-2">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-amber-300 flex items-center justify-center gap-2">
                <Compass className="w-6 h-6 text-[#c5a059]" />
                <span>بوصلة اتجاه القبلة</span>
              </h2>
              <p className="text-xs text-emerald-300/70 mt-1">
                توجيه دقيق نحو الكعبة المشرفة في مكة المكرمة
              </p>
            </div>
            <QiblaCompass userCoords={userCoords} cityName="مكة المكرمة" />
          </div>
        )}

        {activeScreen === 'khatmah' && (
          <KhatmahView />
        )}

        {activeScreen === 'more' && (
          <MoreHubView
            onNavigate={handleNavigate}
            themeId={themeId}
            onSelectTheme={setThemeId}
            onReplaySplash={() => {
              setSplashReplay(true);
              setShowSplash(true);
            }}
          />
        )}

        {activeScreen === 'sheikh_ai' && (
          <SheikhAiView onBack={() => handleNavigate('home')} />
        )}
      </main>

      {/* Global Live Adhan Banner while playing or loading */}
      {(adhanState.status === 'playing' || adhanState.status === 'loading') && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)] rounded-2xl bg-[#07291e]/95 border border-amber-400/60 px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-200 truncate">
                {adhanState.status === 'loading'
                  ? 'جاري تحميل وتشغيل الأذان...'
                  : adhanState.prayerLabel || 'الأذان قيد التشغيل'}
              </p>
              {adhanState.recordingTitle && (
                <p className="text-[11px] text-emerald-200/80 truncate">{adhanState.recordingTitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => stopAdhanAudio()}
            aria-label="إيقاف صوت الأذان"
            className="px-3 py-1.5 rounded-xl bg-[#c5a059] text-black text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>إيقاف</span>
          </button>
        </div>
      )}

      {/* Offline status indicator */}
      <OfflineIndicator />

      {/* Floating Bottom Navigation Bar */}
      <BottomNav activeScreen={activeScreen} setActiveScreen={handleNavigate} />
    </div>
  );
}
