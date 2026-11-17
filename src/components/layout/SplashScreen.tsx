import React, { useEffect } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import {
  APP_CREATOR_NAME,
  APP_DEDICATION_TEXT,
  AppTheme,
} from '../../utils/appThemes';

interface SplashScreenProps {
  theme: AppTheme;
  onFinish: () => void;
  autoDismissMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  theme,
  onFinish,
  autoDismissMs = 2600,
}) => {
  useEffect(() => {
    if (autoDismissMs <= 0) return;
    const timer = window.setTimeout(() => {
      onFinish();
    }, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, onFinish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFinish]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="شاشة الترحيب بتطبيق نور القرآن"
      data-testid="app-splash-screen"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 py-8 sm:py-12 islamic-pattern transition-colors duration-300"
      style={{
        backgroundColor: theme.bg,
        color: theme.textPrimary,
      }}
    >
      {/* Top Basmalah Header */}
      <div className="pt-2 text-center">
        <p
          className="font-quran text-lg sm:text-xl tracking-wide"
          style={{ color: theme.accent }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </div>

      {/* Center Focal Brand Anchor */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6 my-auto">
        <div
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1.5 border shadow-2xl flex items-center justify-center"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.accent,
          }}
        >
          <img
            src="/pwa-192x192.png"
            alt="شعار تطبيق نور القرآن"
            className="w-full h-full rounded-2xl object-cover"
          />
        </div>

        <div className="space-y-2">
          <h1
            className="text-4xl sm:text-5xl font-extrabold font-arabic-serif tracking-tight"
            style={{ color: theme.accent }}
          >
            نُورُ القُرْآنِ
          </h1>
          <p
            className="text-xs sm:text-sm font-medium leading-relaxed max-w-sm mx-auto"
            style={{ color: theme.textSecondary }}
          >
            المصحف الشريف بالرسم العثماني · التلاوات · مواقيت الصلاة · الأذكار والرقية · الشيخ أبو نوار
          </p>
        </div>

        {/* Hairline Divider & Designer / Waqf Attribution */}
        <div
          className="w-full rounded-2xl px-5 py-4 border space-y-1.5"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: theme.accent }}>
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>تصميم وتطوير</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold" style={{ color: theme.textPrimary }}>
            {APP_CREATOR_NAME}
          </p>
          <p
            className="text-xs sm:text-sm font-semibold pt-1 border-t"
            style={{
              color: theme.textSecondary,
              borderColor: theme.border,
            }}
          >
            {APP_DEDICATION_TEXT}
          </p>
        </div>

        <button
          type="button"
          onClick={onFinish}
          aria-label="الدخول إلى التطبيق"
          className="min-h-[46px] px-7 py-2.5 rounded-2xl font-extrabold text-sm flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          style={{
            backgroundColor: theme.accent,
            color: theme.isDark ? '#000000' : '#ffffff',
          }}
        >
          <span>الدخول إلى التطبيق</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle Bottom Progress Bar */}
      <div className="w-full max-w-xs mx-auto space-y-2 pb-2">
        <div
          className="h-1 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: theme.border }}
        >
          <div
            className="h-full rounded-full animate-[splashProgress_2.5s_linear_forwards]"
            style={{ backgroundColor: theme.accent }}
          />
        </div>
        <p
          className="text-[11px] text-center opacity-75"
          style={{ color: theme.textSecondary }}
        >
          الإصدار الاحترافي الكامل · صدقة جارية
        </p>
      </div>
    </div>
  );
};
