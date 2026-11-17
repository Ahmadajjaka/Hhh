export type AppThemeId = 'emerald' | 'sapphire' | 'obsidian' | 'burgundy' | 'parchment';

export interface AppTheme {
  id: AppThemeId;
  name: string;
  subtitle: string;
  isDark: boolean;
  bg: string;
  bgAlt: string;
  headerBg: string;
  navBg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  swatches: [string, string, string];
}

export const APP_THEME_STORAGE_KEY = 'noor_app_theme_v1';
export const DEFAULT_APP_THEME_ID: AppThemeId = 'emerald';
export const APP_CREATOR_NAME = 'أحمد نوار المامو';
export const APP_DEDICATION_TEXT = 'وهذا العمل لوجه الله تعالى';

export const APP_THEMES: AppTheme[] = [
  {
    id: 'emerald',
    name: 'الزمرد النبوي',
    subtitle: 'أخضر مسجد عميق مع لمسات ذهبية وقورة',
    isDark: true,
    bg: '#031911',
    bgAlt: '#041a13',
    headerBg: 'rgba(4, 30, 21, 0.92)',
    navBg: 'rgba(3, 23, 16, 0.95)',
    surface: '#06241b',
    surfaceElevated: '#083325',
    border: 'rgba(16, 185, 129, 0.25)',
    accent: '#c5a059',
    textPrimary: '#f8fafc',
    textSecondary: '#a7f3d0',
    swatches: ['#031911', '#083325', '#c5a059'],
  },
  {
    id: 'sapphire',
    name: 'ليالي الحرم الملكي',
    subtitle: 'أزرق ليلي ملكي مع إضاءة ذهبية دافئة',
    isDark: true,
    bg: '#061124',
    bgAlt: '#091832',
    headerBg: 'rgba(7, 20, 44, 0.92)',
    navBg: 'rgba(5, 15, 34, 0.95)',
    surface: '#0b1e3d',
    surfaceElevated: '#102b54',
    border: 'rgba(96, 165, 250, 0.24)',
    accent: '#d9b566',
    textPrimary: '#f8fafc',
    textSecondary: '#bfdbfe',
    swatches: ['#061124', '#102b54', '#d9b566'],
  },
  {
    id: 'obsidian',
    name: 'كسوة الكعبة',
    subtitle: 'أسود رخامي فاحم بتفاصيل ذهبية خالصة',
    isDark: true,
    bg: '#0a0a0d',
    bgAlt: '#111116',
    headerBg: 'rgba(14, 14, 18, 0.94)',
    navBg: 'rgba(10, 10, 14, 0.96)',
    surface: '#15151c',
    surfaceElevated: '#1e1e28',
    border: 'rgba(212, 175, 55, 0.25)',
    accent: '#d4af37',
    textPrimary: '#fafafa',
    textSecondary: '#e5e7eb',
    swatches: ['#0a0a0d', '#1e1e28', '#d4af37'],
  },
  {
    id: 'burgundy',
    name: 'الديوان الدمشقي',
    subtitle: 'عنابي دمشقي دافئ مستوحى من الزخارف الأندلسية',
    isDark: true,
    bg: '#170a10',
    bgAlt: '#210f17',
    headerBg: 'rgba(28, 12, 19, 0.93)',
    navBg: 'rgba(22, 9, 15, 0.96)',
    surface: '#26121b',
    surfaceElevated: '#331925',
    border: 'rgba(244, 180, 130, 0.22)',
    accent: '#dfb66c',
    textPrimary: '#fdf7f2',
    textSecondary: '#fed7aa',
    swatches: ['#170a10', '#331925', '#dfb66c'],
  },
  {
    id: 'parchment',
    name: 'المصحف الورقي النهاري',
    subtitle: 'ورقي نهاري مريح للعين مع حبر زيتي وذهب عتيق',
    isDark: false,
    bg: '#f5efe1',
    bgAlt: '#ece2cd',
    headerBg: 'rgba(250, 245, 233, 0.94)',
    navBg: 'rgba(245, 238, 222, 0.96)',
    surface: '#fdfaf2',
    surfaceElevated: '#efe6d1',
    border: 'rgba(141, 104, 38, 0.28)',
    accent: '#8d6826',
    textPrimary: '#1a2720',
    textSecondary: '#315241',
    swatches: ['#f5efe1', '#fdfaf2', '#0f5236'],
  },
];

export function isValidAppThemeId(value?: string | null): value is AppThemeId {
  return APP_THEMES.some((theme) => theme.id === value);
}

export function getAppTheme(themeId?: string | null): AppTheme {
  return APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
}

export function loadSavedThemeId(): AppThemeId {
  if (typeof window === 'undefined') return DEFAULT_APP_THEME_ID;
  try {
    const saved = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
    if (isValidAppThemeId(saved)) {
      return saved;
    }
  } catch {
    // ignore storage failures
  }
  return DEFAULT_APP_THEME_ID;
}

export function saveThemeId(themeId: AppThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_THEME_STORAGE_KEY, themeId);
  } catch {
    // ignore storage failures
  }
}

export function applyThemeToDocument(themeId: AppThemeId): AppTheme {
  const theme = getAppTheme(themeId);
  if (typeof document === 'undefined') return theme;

  const root = document.documentElement;
  root.dataset.theme = theme.id;
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.setProperty('--theme-bg', theme.bg);
  root.style.setProperty('--theme-bg-alt', theme.bgAlt);
  root.style.setProperty('--theme-header', theme.headerBg);
  root.style.setProperty('--theme-nav', theme.navBg);
  root.style.setProperty('--theme-surface', theme.surface);
  root.style.setProperty('--theme-surface-elevated', theme.surfaceElevated);
  root.style.setProperty('--theme-border', theme.border);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-text', theme.textPrimary);
  root.style.setProperty('--theme-text-muted', theme.textSecondary);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.bg);
  }

  return theme;
}

export function shouldAutoSkipSplash(search: string): boolean {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const autostart = params.get('autostart');
    const skipSplash = params.get('skipSplash');
    const screen = params.get('screen');
    return autostart === '1' || skipSplash === '1' || Boolean(screen && screen !== 'home');
  } catch {
    return false;
  }
}
