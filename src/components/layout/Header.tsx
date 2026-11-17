import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Moon, Palette, Sun } from 'lucide-react';
import { getHijriDate } from '../../utils/prayerCalculator';
import { APP_THEMES, AppThemeId, getAppTheme } from '../../utils/appThemes';
import { PWAInstallButton } from '../pwa/PWAInstallUI';

interface HeaderProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  themeId: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  setActiveScreen,
  themeId,
  onSelectTheme,
}) => {
  const hijri = getHijriDate();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [lastDarkTheme, setLastDarkTheme] = useState<AppThemeId>('emerald');
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeTheme = getAppTheme(themeId);
  const isDarkMode = activeTheme.isDark;

  useEffect(() => {
    if (activeTheme.isDark) {
      setLastDarkTheme(activeTheme.id);
    }
  }, [activeTheme.id, activeTheme.isDark]);

  useEffect(() => {
    if (!themeMenuOpen) return;
    const onOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setThemeMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutsideClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [themeMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#041e15]/90 backdrop-blur-md border-b border-amber-500/20 px-3 sm:px-5 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand wordmark (single element, whitespace-nowrap shrink-0) */}
        <button
          onClick={() => setActiveScreen('home')}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-amber-300 font-arabic-serif whitespace-nowrap shrink-0 hover:text-amber-200 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <BookOpen className="w-4 h-4" />
          </span>
          <span>نُورُ القُرْآنِ</span>
        </button>

        {/* Zone 2: clean text nav links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-emerald-100/90">
          <button
            onClick={() => setActiveScreen('home')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 cursor-pointer ${
              activeScreen === 'home'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => setActiveScreen('quran')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 cursor-pointer ${
              activeScreen === 'quran'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            المصحف الشريف
          </button>
          <button
            onClick={() => setActiveScreen('recitations')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 cursor-pointer ${
              activeScreen === 'recitations'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            تلاوات عبد الباسط
          </button>
          <button
            onClick={() => setActiveScreen('prayer')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 cursor-pointer ${
              activeScreen === 'prayer'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            مواقيت الصلاة
          </button>
          <button
            onClick={() => setActiveScreen('adhkar')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 cursor-pointer ${
              activeScreen === 'adhkar' || activeScreen === 'duas_ruqyah'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            الأذكار والرقية
          </button>
          <button
            onClick={() => setActiveScreen('sheikh_ai')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 cursor-pointer ${
              activeScreen === 'sheikh_ai'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            الشيخ أبو نوار
          </button>
        </nav>

        {/* Zone 3: Theme switcher + install + primary action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <span className="hidden 2xl:inline text-xs text-amber-200/70 border-l border-emerald-800/40 pl-3 whitespace-nowrap">
            {hijri.fullDateArabic}
          </span>

          {/* Theme Palette Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              aria-label="اختيار ثيم التطبيق"
              aria-expanded={themeMenuOpen}
              title={`الثيم الحالي: ${activeTheme.name}`}
              className="p-2 rounded-xl text-emerald-200/90 hover:text-amber-300 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden 2xl:inline text-xs font-semibold whitespace-nowrap">
                {activeTheme.name}
              </span>
            </button>

            {themeMenuOpen && (
              <div
                role="menu"
                aria-label="قائمة ثيمات التطبيق"
                className="fixed sm:absolute left-3 sm:left-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-24px)] sm:w-72 rounded-2xl border border-amber-500/35 shadow-2xl p-2 space-y-1 z-50"
                style={{
                  backgroundColor: activeTheme.surface,
                  color: activeTheme.textPrimary,
                }}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold opacity-80 border-b border-amber-500/20">
                  اختر ثيم التطبيق ({APP_THEMES.length})
                </div>
                {APP_THEMES.map((theme) => {
                  const isSelected = theme.id === themeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        onSelectTheme(theme.id);
                        setThemeMenuOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 text-right transition-colors cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? activeTheme.surfaceElevated : 'transparent',
                        border: isSelected ? `1px solid ${activeTheme.accent}` : '1px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex items-center gap-0.5 shrink-0" aria-hidden="true">
                          {theme.swatches.map((hex, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-white/25"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">{theme.name}</span>
                          <span className="text-[10px] opacity-70 block truncate">
                            {theme.isDark ? 'ثيم داكن' : 'ثيم نهاري'} · {theme.subtitle}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0" style={{ color: activeTheme.accent }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Day/Night Toggle */}
          <button
            type="button"
            onClick={() => {
              onSelectTheme(isDarkMode ? 'parchment' : lastDarkTheme);
            }}
            aria-label={isDarkMode ? 'التحويل إلى الثيم النهاري الفاتح' : 'التحويل إلى الثيم الداكن'}
            className="hidden sm:inline-flex p-2 rounded-xl text-emerald-200/80 hover:text-amber-300 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/60 transition-colors cursor-pointer"
            title={isDarkMode ? 'التحويل للوضع النهاري' : 'التحويل للوضع الداكن'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-700" />}
          </button>

          <PWAInstallButton />

          <button
            onClick={() => setActiveScreen('quran')}
            className="px-3 sm:px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-[#c5a059] rounded-xl hover:brightness-110 active:scale-95 transition-all whitespace-nowrap shrink-0 shadow-md shadow-amber-900/20 cursor-pointer"
          >
            فتح المصحف
          </button>
        </div>
      </div>
    </header>
  );
};
