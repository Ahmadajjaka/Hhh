import React, { useEffect, useState } from 'react';
import { FileText, Globe, Copy, Check, Bookmark, BookOpen, Loader2 } from 'lucide-react';
import {
  fetchAyahTafsirsAndTranslations,
  TafsirBundle,
  TRANSLATION_LANGUAGES,
} from '../../utils/quranAudioAndTafsir';
import { removeLeadingBasmalah } from '../../utils/adhkarPrayerSync';

interface TafsirTranslationModalProps {
  surahNumber: number;
  surahNameArabic: string;
  ayahNumberInSurah: number;
  ayahText: string;
  initialMuyassar?: string;
  initialTranslation?: string;
  onClose: () => void;
  onSaveBookmark?: () => void;
}

export const TafsirTranslationModal: React.FC<TafsirTranslationModalProps> = ({
  surahNumber,
  surahNameArabic,
  ayahNumberInSurah,
  ayahText,
  initialMuyassar,
  initialTranslation,
  onClose,
  onSaveBookmark,
}) => {
  const [activeTafsir, setActiveTafsir] = useState<'muyassar' | 'ibnKathir' | 'saadi'>('muyassar');
  const [activeLang, setActiveLang] = useState<'en' | 'fr' | 'ur' | 'id' | 'tr'>('en');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [bundle, setBundle] = useState<TafsirBundle>({
    muyassar: initialMuyassar || '',
    ibnKathir: '',
    saadi: '',
    translations: {
      en: initialTranslation || '',
      fr: '',
      ur: '',
      id: '',
      tr: '',
    },
  });

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchAyahTafsirsAndTranslations(surahNumber, ayahNumberInSurah, initialMuyassar)
      .then((res) => {
        if (mounted) {
          setBundle(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [surahNumber, ayahNumberInSurah, initialMuyassar]);

  const cleanAyahText = removeLeadingBasmalah(ayahText, surahNumber, ayahNumberInSurah);

  const handleCopy = () => {
    const tafsirText =
      activeTafsir === 'muyassar'
        ? bundle.muyassar
        : activeTafsir === 'ibnKathir'
        ? bundle.ibnKathir
        : bundle.saadi;
    const text = `﴿${cleanAyahText}﴾ [سورة ${surahNameArabic}: ${ayahNumberInSurah}]\n\n${tafsirText ? `التفسير:\n${tafsirText}` : ''}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const activeLangMeta = TRANSLATION_LANGUAGES.find((l) => l.code === activeLang) || TRANSLATION_LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#051a13] border border-amber-500/35 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[88vh] overflow-y-auto shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#c5a059]" />
            <h3 className="text-base font-bold text-amber-300">
              سورة {surahNameArabic} - الآية {ayahNumberInSurah}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-slate-300 hover:text-white cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* Dedicated Strictly-Separated Quran Ayah Block */}
        <div className="p-4 rounded-2xl bg-[#03120d] border-2 border-[#c5a059]/30 mb-5">
          <div className="text-[10px] text-amber-400/80 font-bold mb-1.5 flex items-center justify-between">
            <span>النص القرآني الكريم (بالرسم العثماني)</span>
            <span>حفص عن عاصم</span>
          </div>
          <p className="font-quran text-xl sm:text-2xl text-amber-100 text-right leading-[2.2]">
            {cleanAyahText} <span className="text-[#c5a059] text-lg">﴿{ayahNumberInSurah}﴾</span>
          </p>
        </div>

        {/* Tafsir Selector Tabs (الميسر / ابن كثير / السعدي) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>التفسير المعتمد</span>
            </h4>
            {isLoading && (
              <span className="text-[11px] text-emerald-300/70 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>جاري جلب التفاسير...</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setActiveTafsir('muyassar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTafsir === 'muyassar'
                  ? 'bg-[#c5a059] text-black shadow'
                  : 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 hover:text-white'
              }`}
            >
              التفسير الميسر
            </button>
            <button
              onClick={() => setActiveTafsir('ibnKathir')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTafsir === 'ibnKathir'
                  ? 'bg-[#c5a059] text-black shadow'
                  : 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 hover:text-white'
              }`}
            >
              تفسير ابن كثير
            </button>
            <button
              onClick={() => setActiveTafsir('saadi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTafsir === 'saadi'
                  ? 'bg-[#c5a059] text-black shadow'
                  : 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 hover:text-white'
              }`}
            >
              تفسير السعدي
            </button>
          </div>

          <div className="text-sm text-emerald-50 leading-loose bg-[#082a1f]/60 p-4 rounded-2xl border border-emerald-800/40 max-h-60 overflow-y-auto whitespace-pre-line">
            {activeTafsir === 'muyassar' &&
              (bundle.muyassar || 'التفسير الميسر غير متوفر حالياً بدون اتصال لهذه الآية.')}
            {activeTafsir === 'ibnKathir' &&
              (bundle.ibnKathir || (isLoading ? 'جاري تحميل تفسير الحافظ ابن كثير...' : 'يرجى الاتصال بالإنترنت لجلب تفسير ابن كثير الكامل لهذه الآية.'))}
            {activeTafsir === 'saadi' &&
              (bundle.saadi || (isLoading ? 'جاري تحميل تفسير الشيخ السعدي...' : 'يرجى الاتصال بالإنترنت لجلب تفسير السعدي لهذه الآية.'))}
          </div>
        </div>

        {/* Multi-language Translations */}
        <div className="mb-5 pt-2 border-t border-emerald-800/30">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>ترجمة معاني القرآن الكريم</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              {TRANSLATION_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setActiveLang(lang.code as 'en' | 'fr' | 'ur' | 'id' | 'tr')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                    activeLang === lang.code
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                      : 'bg-black/30 text-emerald-300/70 hover:text-white'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div
            dir={activeLangMeta.dir}
            className={`text-xs text-slate-200 leading-relaxed bg-black/35 p-3.5 rounded-xl border border-emerald-800/30 ${
              activeLangMeta.dir === 'rtl' ? 'text-right font-arabic-serif text-sm' : 'text-left'
            }`}
          >
            <div className="text-[10px] text-amber-300/70 mb-1">{activeLangMeta.labelArabic}</div>
            {bundle.translations[activeLang] ||
              (isLoading ? 'Loading translation...' : 'Translation unavailable offline.')}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-800/40">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 text-xs text-emerald-200 cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'تم النسخ!' : 'نسخ الآية والتفسير'}</span>
          </button>

          {onSaveBookmark && (
            <button
              onClick={onSaveBookmark}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>حفظ في المفضلة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
