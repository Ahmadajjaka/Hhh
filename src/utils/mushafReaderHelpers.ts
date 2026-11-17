export type MushafPaperTheme = 'madani' | 'ivory' | 'sepia' | 'night' | 'darkBlack';

export interface MushafThemeSurface {
  viewportBg: string;
  barBg: string;
  barBorder: string;
  barText: string;
  barMutedText: string;
  buttonBg: string;
  paperBg: string;
  paperBorder: string;
  paperShadow: string;
  isDark: boolean;
  labelArabic: string;
}

export const MUSHAF_MIN_FONT_SIZE = 18;
export const MUSHAF_MAX_FONT_SIZE = 44;

export function clampMushafFontSize(size: number): number {
  if (!Number.isFinite(size)) return 26;
  return Math.max(MUSHAF_MIN_FONT_SIZE, Math.min(MUSHAF_MAX_FONT_SIZE, Math.round(size)));
}

export function getMushafThemeSurface(theme: MushafPaperTheme): MushafThemeSurface {
  switch (theme) {
    case 'ivory':
      return {
        viewportBg: 'bg-[#f3efe4]',
        barBg: 'bg-[#fffdf6]/95',
        barBorder: 'border-[#d4af37]/35',
        barText: 'text-[#241b09]',
        barMutedText: 'text-[#74561b]',
        buttonBg: 'bg-[#efe6cf] hover:bg-[#e5d7b5] text-[#3c2a07] border-[#c5a059]/40',
        paperBg: 'bg-[#fffef9] text-[#111111]',
        paperBorder: 'border-[#d4af37]',
        paperShadow: 'shadow-[0_12px_40px_rgba(68,50,14,0.14)]',
        isDark: false,
        labelArabic: 'عاجي',
      };
    case 'sepia':
      return {
        viewportBg: 'bg-[#e8dcc0]',
        barBg: 'bg-[#f4ebd0]/95',
        barBorder: 'border-[#b8860b]/35',
        barText: 'text-[#2c1d11]',
        barMutedText: 'text-[#724e22]',
        buttonBg: 'bg-[#e6d6b1] hover:bg-[#dac595] text-[#2c1d11] border-[#b8860b]/40',
        paperBg: 'bg-[#f4ebd0] text-[#2c1d11]',
        paperBorder: 'border-[#b8860b]',
        paperShadow: 'shadow-[0_12px_40px_rgba(44,29,17,0.18)]',
        isDark: false,
        labelArabic: 'كلاسيكي',
      };
    case 'night':
      return {
        viewportBg: 'bg-[#04110c]',
        barBg: 'bg-[#061c14]/95',
        barBorder: 'border-amber-500/25',
        barText: 'text-amber-200',
        barMutedText: 'text-emerald-300/75',
        buttonBg: 'bg-emerald-950/80 hover:bg-emerald-900/90 text-amber-200 border-emerald-700/50',
        paperBg: 'bg-[#091510] text-[#ded9c5]',
        paperBorder: 'border-[#8f7438]',
        paperShadow: 'shadow-[0_14px_44px_rgba(0,0,0,0.65)]',
        isDark: true,
        labelArabic: 'زمردي ليلي',
      };
    case 'darkBlack':
      return {
        viewportBg: 'bg-[#000000]',
        barBg: 'bg-[#080c0a]/95',
        barBorder: 'border-[#b8860b]/30',
        barText: 'text-amber-200',
        barMutedText: 'text-slate-400',
        buttonBg: 'bg-[#121916] hover:bg-[#1a2420] text-amber-200 border-slate-700',
        paperBg: 'bg-[#050907] text-[#e2ded2]',
        paperBorder: 'border-[#b8860b]/70',
        paperShadow: 'shadow-[0_14px_44px_rgba(0,0,0,0.9)]',
        isDark: true,
        labelArabic: 'أسود ليلي',
      };
    case 'madani':
    default:
      return {
        viewportBg: 'bg-[#efe6d5]',
        barBg: 'bg-[#faf6ee]/95',
        barBorder: 'border-[#c5a059]/35',
        barText: 'text-[#3b2806]',
        barMutedText: 'text-[#7c591a]',
        buttonBg: 'bg-[#efe3ca] hover:bg-[#e5d3ae] text-[#3b2806] border-[#c5a059]/45',
        paperBg: 'bg-[#faf6ee] text-[#1e1e1e]',
        paperBorder: 'border-[#c5a059]',
        paperShadow: 'shadow-[0_12px_40px_rgba(74,50,6,0.16)]',
        isDark: false,
        labelArabic: 'المدينة',
      };
  }
}

export function formatMushafHeaderSummary(
  surahNames: string[],
  pageNumber: number,
  juzNumber: number
): string {
  const uniqueNames = Array.from(new Set(surahNames.filter((n) => n.trim().length > 0)));
  const surahPart =
    uniqueNames.length === 0
      ? 'المصحف الشريف'
      : uniqueNames.length === 1
      ? `سُورَةُ ${uniqueNames[0]}`
      : `سُورَةُ ${uniqueNames[0]} · ${uniqueNames[uniqueNames.length - 1]}`;
  return `${surahPart} · صفحة ${pageNumber} · الجزء ${juzNumber}`;
}
