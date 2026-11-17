export type InstallPlatformMode =
  | 'installed'
  | 'android_prompt'
  | 'android_manual'
  | 'ios_safari'
  | 'desktop_prompt'
  | 'desktop_manual';

export const DEFAULT_ANDROID_API_BASE_URL =
  'https://ais-pre-ew5yiioe6xbqzopizi6v7d-876863590953.europe-west2.run.app';

const SUPPORTED_LAUNCH_SCREENS = new Set([
  'home',
  'quran',
  'recitations',
  'prayer',
  'adhkar',
  'duas_ruqyah',
  'sebha',
  'qibla',
  'khatmah',
  'sheikh_ai',
  'more',
]);

/**
 * Pure check for whether the app is currently running in installed standalone PWA mode.
 */
export function isStandaloneDisplayMode(
  matchMediaStandalone: boolean,
  navigatorStandalone: boolean = false
): boolean {
  return Boolean(matchMediaStandalone || navigatorStandalone);
}

/**
 * Pure detector returning which install experience should be presented to the user.
 */
export function detectInstallPlatform(
  userAgent: string,
  isStandalone: boolean,
  hasBeforeInstallPrompt: boolean
): InstallPlatformMode {
  if (isStandalone) return 'installed';
  const ua = (userAgent || '').toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  if (isIOS) return 'ios_safari';
  if (isAndroid) return hasBeforeInstallPrompt ? 'android_prompt' : 'android_manual';
  return hasBeforeInstallPrompt ? 'desktop_prompt' : 'desktop_manual';
}

/**
 * Normalizes a URL into a clean share/copy origin link without ephemeral query flags.
 */
export function getShareableInstallUrl(rawHref: string): string {
  try {
    const parsed = new URL(rawHref);
    return `${parsed.origin}/`;
  } catch {
    return rawHref || '/';
  }
}

/**
 * Resolves an API endpoint cleanly for both web (relative origin) and Capacitor native Android builds.
 */
export function resolveApiUrl(
  endpoint: string,
  options?: {
    isNative?: boolean;
    apiBaseUrl?: string;
    protocol?: string;
    origin?: string;
  }
): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let isNative = options?.isNative;
  let protocol = options?.protocol;

  if (typeof window !== 'undefined') {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    if (isNative === undefined) {
      isNative = Boolean(cap?.isNativePlatform?.());
    }
    if (protocol === undefined) {
      protocol = window.location.protocol;
    }
  }

  const envApiBaseUrl = (() => {
    try {
      const meta = import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } };
      return meta?.env?.VITE_API_BASE_URL?.trim() || '';
    } catch {
      return '';
    }
  })();

  const isLocalNativeScheme = protocol === 'capacitor:' || protocol === 'file:';
  if (isNative || isLocalNativeScheme) {
    const rawBase = (options?.apiBaseUrl || envApiBaseUrl || DEFAULT_ANDROID_API_BASE_URL).trim();
    const cleanBase = rawBase.replace(/\/+$/, '');
    return `${cleanBase}${normalizedEndpoint}`;
  }

  return normalizedEndpoint;
}

/**
 * Parses Android App Shortcuts / deep-link query params like `/?screen=quran` or `/?screen=duas_ruqyah&tab=ruqyah`.
 */
export function parseInitialScreenFromSearch(search: string): {
  screen: string;
  tab?: 'duas' | 'ruqyah' | 'ruqyah_text' | 'duas_text';
  category?: string;
} | null {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const screen = params.get('screen')?.trim() || '';
    if (!SUPPORTED_LAUNCH_SCREENS.has(screen)) {
      return null;
    }
    const rawTab = params.get('tab')?.trim();
    const tab =
      rawTab === 'ruqyah' || rawTab === 'duas' || rawTab === 'ruqyah_text' || rawTab === 'duas_text'
        ? rawTab
        : undefined;
    const category = params.get('category')?.trim() || undefined;
    return { screen, tab, category };
  } catch {
    return null;
  }
}
