import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Volume2,
  Bookmark,
  Share2,
  Copy,
  ChevronRight,
  ChevronLeft,
  FileText,
  Sliders,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Type,
  ShieldCheck,
  Repeat,
  AlertTriangle,
  Loader2,
  Download,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  ALL_SURAHS,
  VERIFIED_OFFLINE_SURAHS,
  RECITERS,
  JUZ_START_DATA,
  HIZB_START_DATA,
} from '../../data/quranMeta';
import { SurahMeta, Ayah, Bookmark as BookmarkType } from '../../types';
import { MushafPageView } from './MushafPageView';
import { removeLeadingBasmalah } from '../../utils/adhkarPrayerSync';
import {
  validateFetchedSurahAyahs,
  isSajdahAyah,
  normalizeArabicForSearch,
} from '../../utils/quranIntegrity';
import {
  getEveryAyahAudioUrl,
  getPlayableAudioSrc,
  cacheAudioForOffline,
} from '../../utils/quranAudioAndTafsir';
import {
  getOfflineSurah,
  saveOfflineSurah,
  searchOfflineQuranAyahs,
  downloadAudioBatch,
  getCachedAudioUrlsSet,
  countOfflineQuranItems,
  downloadFullMushafOffline,
  BatchDownloadProgress,
  MushafDownloadProgress,
} from '../../utils/offlineStorage';
import {
  clampMushafFontSize,
  MUSHAF_MAX_FONT_SIZE,
  MUSHAF_MIN_FONT_SIZE,
} from '../../utils/mushafReaderHelpers';
import { TafsirTranslationModal } from './TafsirTranslationModal';
import { QuranIntegrityModal } from './QuranIntegrityModal';

interface QuranViewProps {
  initialSurah?: number;
  initialPage?: number;
  onNavigateHome?: () => void;
}

export const QuranView: React.FC<QuranViewProps> = ({ initialSurah, initialPage }) => {
  // Mode toggle: 'page' (المصحف الحقيقي صفحات) vs 'verses' (عرض الآيات والتفسير)
  const [readingMode, setReadingMode] = useState<'page' | 'verses'>('page');
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (initialPage) return initialPage;
    try {
      const saved = localStorage.getItem('noor_last_read');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pageNumber) return parsed.pageNumber;
      }
    } catch {}
    return 1;
  });

  // Navigation states
  const [selectedSurah, setSelectedSurah] = useState<number | null>(initialSurah || null);
  const [focusedSurahOnPage, setFocusedSurahOnPage] = useState<number | null>(initialSurah || null);
  const [activeTab, setActiveTab] = useState<'surahs' | 'juz' | 'hizb' | 'search' | 'bookmarks'>('surahs');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);

  // Quran Word/Ayah Search State
  const [ayahSearchQuery, setAyahSearchQuery] = useState('');
  const [ayahSearchResults, setAyahSearchResults] = useState<{
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    pageNumber: number;
    text: string;
  }[]>([]);
  const [isSearchingAyahs, setIsSearchingAyahs] = useState(false);
  const [hasSearchedAyahs, setHasSearchedAyahs] = useState(false);
  const [surahValidationError, setSurahValidationError] = useState<string | null>(null);
  const [bookmarkNotice, setBookmarkNotice] = useState<string | null>(null);

  // Offline download status (Full Mushaf & Per-Surah Audio)
  const [offlineSummary, setOfflineSummary] = useState({ pagesCount: 0, surahsCount: 0, fullMushafReady: false });
  const [isDownloadingMushaf, setIsDownloadingMushaf] = useState(false);
  const [mushafProgress, setMushafProgress] = useState<MushafDownloadProgress | null>(null);
  const [mushafStatusMsg, setMushafStatusMsg] = useState<string | null>(null);
  const mushafAbortRef = useRef<AbortController | null>(null);

  const [isSurahAudioCached, setIsSurahAudioCached] = useState(false);
  const [isDownloadingSurahAudio, setIsDownloadingSurahAudio] = useState(false);
  const [surahAudioProgress, setSurahAudioProgress] = useState<BatchDownloadProgress | null>(null);
  const surahAudioAbortRef = useRef<AbortController | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  // Reader settings
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = parseInt(localStorage.getItem('noor_quran_font_size') || '26', 10);
      return clampMushafFontSize(saved);
    } catch {
      return 26;
    }
  });
  const [fontStyle, setFontStyle] = useState<'uthmani' | 'standard'>(() => {
    try {
      return (localStorage.getItem('noor_quran_font_style') as 'uthmani' | 'standard') || 'uthmani';
    } catch {
      return 'uthmani';
    }
  });
  const [readerTheme, setReaderTheme] = useState<'emerald' | 'dark' | 'ivory' | 'sepia'>(() => {
    try {
      return (localStorage.getItem('noor_quran_theme') as 'emerald' | 'dark' | 'ivory' | 'sepia') || 'emerald';
    } catch {
      return 'emerald';
    }
  });

  const handleUpdateFontSize = (nextSize: number) => {
    const clamped = clampMushafFontSize(nextSize);
    setFontSize(clamped);
    try {
      localStorage.setItem('noor_quran_font_size', String(clamped));
    } catch {}
  };

  const handleUpdateReaderTheme = (theme: 'emerald' | 'dark' | 'ivory' | 'sepia') => {
    setReaderTheme(theme);
    try {
      localStorage.setItem('noor_quran_theme', theme);
    } catch {}
  };

  const handleToggleFontStyle = () => {
    const next = fontStyle === 'uthmani' ? 'standard' : 'uthmani';
    setFontStyle(next);
    try {
      localStorage.setItem('noor_quran_font_style', next);
    } catch {}
  };

  // Verses state
  const [surahAyahs, setSurahAyahs] = useState<Ayah[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [activeAyahNumber, setActiveAyahNumber] = useState<number | null>(null);

  // Audio recitation state (including repeat & range A-B)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number>(0);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<'none' | 'single' | 'range'>('none');
  const [rangeStartAyah, setRangeStartAyah] = useState<number>(1);
  const [rangeEndAyah, setRangeEndAyah] = useState<number>(7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal / Drawer state for Tafsir & Translations
  const [selectedAyahForDetails, setSelectedAyahForDetails] = useState<Ayah | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_quran_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const refreshOfflineSummary = async () => {
    const summary = await countOfflineQuranItems();
    setOfflineSummary(summary);
  };

  useEffect(() => {
    void refreshOfflineSummary();
  }, []);

  useEffect(() => {
    return () => {
      mushafAbortRef.current?.abort();
      surahAudioAbortRef.current?.abort();
      audioRef.current?.pause();
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    };
  }, []);

  const handleDownloadFullMushaf = async () => {
    if (isDownloadingMushaf) {
      mushafAbortRef.current?.abort();
      setIsDownloadingMushaf(false);
      return;
    }
    const controller = new AbortController();
    mushafAbortRef.current = controller;
    setIsDownloadingMushaf(true);
    setMushafStatusMsg(null);
    const res = await downloadFullMushafOffline((p) => setMushafProgress(p), controller.signal);
    setIsDownloadingMushaf(false);
    await refreshOfflineSummary();
    if (res.ok) {
      setMushafStatusMsg(`تم حفظ المصحف كاملاً (${res.pagesSaved} صفحة و${res.surahsSaved} سورة) للعمل بلا إنترنت دائماً.`);
    } else if (res.errorMessage) {
      setMushafStatusMsg(res.errorMessage);
    }
  };

  // Check if current Surah's audio is already cached for selectedReciter
  useEffect(() => {
    if (!selectedSurah || surahAyahs.length === 0) {
      setIsSurahAudioCached(false);
      return;
    }
    let cancelled = false;
    const urls = surahAyahs.map((a) => getEveryAyahAudioUrl(selectedReciter, selectedSurah, a.numberInSurah));
    getCachedAudioUrlsSet(urls).then((cachedSet) => {
      if (!cancelled) {
        setIsSurahAudioCached(urls.length > 0 && urls.every((u) => cachedSet.has(u)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSurah, selectedReciter, surahAyahs]);

  const handleDownloadSurahAudioOffline = async () => {
    if (!selectedSurah || surahAyahs.length === 0) return;
    if (isDownloadingSurahAudio) {
      surahAudioAbortRef.current?.abort();
      setIsDownloadingSurahAudio(false);
      return;
    }
    const controller = new AbortController();
    surahAudioAbortRef.current = controller;
    setIsDownloadingSurahAudio(true);

    const meta = ALL_SURAHS.find((s) => s.number === selectedSurah);
    const items = surahAyahs.map((ay) => ({
      id: `${selectedSurah}_${ay.numberInSurah}`,
      label: `${meta?.name || ''} - آية ${ay.numberInSurah}`,
      url: getEveryAyahAudioUrl(selectedReciter, selectedSurah, ay.numberInSurah),
    }));

    const res = await downloadAudioBatch(items, (p) => setSurahAudioProgress(p), controller.signal);
    setIsDownloadingSurahAudio(false);
    setIsSurahAudioCached(res.failedIds.length === 0 && res.cachedIds.length === items.length);
  };

  // Load verses when a Surah is chosen (IndexedDB + localStorage + verified fallback)
  useEffect(() => {
    if (selectedSurah === null) return;

    const surahMeta = ALL_SURAHS.find((s) => s.number === selectedSurah);
    if (!surahMeta) return;

    let cancelled = false;
    setSurahValidationError(null);
    setSurahAyahs([]);
    setSelectedAyahForDetails(null);
    setRangeStartAyah(1);
    setRangeEndAyah(surahMeta.numberOfAyahs);

    // Save as last read position
    localStorage.setItem(
      'noor_last_read',
      JSON.stringify({
        surahNumber: selectedSurah,
        surahName: surahMeta.name,
        ayahNumber: 1,
        pageNumber: surahMeta.page,
        timestamp: new Date().toISOString(),
      })
    );

    const loadSurah = async () => {
      const cached = await getOfflineSurah(selectedSurah);
      if (cancelled) return;
      if (cached && cached.length > 0) {
        const cleaned = cached.map((ay) => ({
          ...ay,
          text: removeLeadingBasmalah(ay.text, selectedSurah, ay.numberInSurah),
        }));
        const check = validateFetchedSurahAyahs(cleaned, selectedSurah);
        if (check.valid) {
          setSurahAyahs(cleaned);
          return;
        }
      }

      if (VERIFIED_OFFLINE_SURAHS[selectedSurah]) {
        const offline = VERIFIED_OFFLINE_SURAHS[selectedSurah];
        const ayahs: Ayah[] = offline.ayahs.map((a, idx) => ({
          number: idx + 1,
          numberInSurah: a.numberInSurah,
          text: removeLeadingBasmalah(a.text, selectedSurah, a.numberInSurah),
          translation: a.translation,
          tafsir: a.tafsir,
          page: surahMeta.page,
          juz: surahMeta.juz,
        }));
        setSurahAyahs(ayahs);
      }

      setIsLoadingVerses(true);
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-uthmani,en.sahih,ar.muyassar`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data && data.data && Array.isArray(data.data) && data.data.length >= 3) {
          const uthmaniEdition = data.data[0];
          const translationEdition = data.data[1];
          const tafsirEdition = data.data[2];

          const fetchedAyahs: Ayah[] = uthmaniEdition.ayahs.map(
            (ay: { number: number; numberInSurah: number; text: string; page: number; juz: number }, i: number) => ({
              number: ay.number,
              numberInSurah: ay.numberInSurah,
              text: removeLeadingBasmalah(ay.text, selectedSurah, ay.numberInSurah),
              translation: translationEdition.ayahs[i]?.text || '',
              tafsir: tafsirEdition.ayahs[i]?.text || '',
              page: ay.page || surahMeta.page,
              juz: ay.juz || surahMeta.juz,
            })
          );

          const check = validateFetchedSurahAyahs(fetchedAyahs, selectedSurah);
          if (!check.valid) {
            setSurahValidationError(check.reason || 'فشل التحقق من سلامة النص القرآني.');
            return;
          }

          setSurahAyahs(fetchedAyahs);
          saveOfflineSurah(selectedSurah, fetchedAyahs).catch(() => {});
          void refreshOfflineSummary();
        }
      } catch (err) {
        console.warn('Using offline data fallback:', err);
        if (!cancelled && !VERIFIED_OFFLINE_SURAHS[selectedSurah]) {
          setSurahValidationError('تعذر جلب السورة حالياً. يرجى التأكد من الاتصال بالإنترنت أو تحميل المصحف للعمل بلا إنترنت.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingVerses(false);
        }
      }
    };

    void loadSurah();
    return () => {
      cancelled = true;
    };
  }, [selectedSurah]);

  // Audio Playback handler with Single Repeat, Range Repeat, & Auto Advance
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.playbackRate = playbackSpeed;

    const handleEnded = () => {
      const currentAyah = surahAyahs[playingAyahIndex];
      if (!currentAyah) {
        setIsPlayingAudio(false);
        return;
      }

      if (repeatMode === 'single') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (repeatMode === 'range') {
        const minAyah = Math.min(rangeStartAyah, rangeEndAyah);
        const maxAyah = Math.max(rangeStartAyah, rangeEndAyah);
        if (currentAyah.numberInSurah >= maxAyah || playingAyahIndex >= surahAyahs.length - 1) {
          const startIdx = surahAyahs.findIndex((a) => a.numberInSurah === minAyah);
          setPlayingAyahIndex(startIdx >= 0 ? startIdx : 0);
          return;
        }
      }

      // Auto advance to next Ayah
      if (playingAyahIndex < surahAyahs.length - 1) {
        setPlayingAyahIndex((prev) => prev + 1);
      } else {
        setIsPlayingAudio(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playingAyahIndex, surahAyahs, playbackSpeed, repeatMode, rangeStartAyah, rangeEndAyah]);

  // Update audio source when playingAyahIndex changes and isPlayingAudio is true (with offline Cache API)
  useEffect(() => {
    if (!isPlayingAudio || !surahAyahs[playingAyahIndex] || !selectedSurah) return;

    let cancelled = false;
    const currentAyah = surahAyahs[playingAyahIndex];
    setActiveAyahNumber(currentAyah.numberInSurah);

    const audioUrl = getEveryAyahAudioUrl(selectedReciter, selectedSurah, currentAyah.numberInSurah);

    const startPlayback = async () => {
      const playableSrc = await getPlayableAudioSrc(audioUrl);
      if (cancelled) {
        if (playableSrc.startsWith('blob:')) URL.revokeObjectURL(playableSrc);
        return;
      }

      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
      if (playableSrc.startsWith('blob:')) {
        audioBlobUrlRef.current = playableSrc;
      }

      if (audioRef.current) {
        audioRef.current.src = playableSrc;
        audioRef.current.playbackRate = playbackSpeed;
        try {
          await audioRef.current.play();
          if (!playableSrc.startsWith('blob:')) {
            cacheAudioForOffline(audioUrl).catch(() => {});
          }
        } catch (e) {
          if (!cancelled) {
            console.warn('Playback error:', e);
            setIsPlayingAudio(false);
          }
        }
      }
    };

    void startPlayback();
    return () => {
      cancelled = true;
    };
  }, [isPlayingAudio, playingAyahIndex, selectedSurah, selectedReciter, surahAyahs, playbackSpeed]);

  const togglePlayAudio = (index: number = playingAyahIndex) => {
    if (isPlayingAudio && playingAyahIndex === index) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      setPlayingAyahIndex(index);
      setIsPlayingAudio(true);
    }
  };

  const handleSaveBookmark = (ayah: Ayah) => {
    if (!selectedSurah) return;
    const meta = ALL_SURAHS.find((s) => s.number === selectedSurah);
    const newBookmark: BookmarkType = {
      id: `${selectedSurah}_${ayah.numberInSurah}_${Date.now()}`,
      surahNumber: selectedSurah,
      surahName: meta?.name || '',
      ayahNumber: ayah.numberInSurah,
      pageNumber: ayah.page,
      createdAt: new Date().toLocaleDateString('ar-SA'),
    };
    const updated = [newBookmark, ...bookmarks.filter((b) => !(b.surahNumber === selectedSurah && b.ayahNumber === ayah.numberInSurah))];
    setBookmarks(updated);
    localStorage.setItem('noor_quran_bookmarks', JSON.stringify(updated));
    setBookmarkNotice(`تم حفظ الإشارة المرجعية لسورة ${meta?.name} - الآية ${ayah.numberInSurah}`);
    setTimeout(() => setBookmarkNotice(null), 3000);
  };

  const handleCopyAyah = (ayah: Ayah) => {
    const meta = ALL_SURAHS.find((s) => s.number === selectedSurah);
    const textToCopy = `﴿${ayah.text}﴾ [سورة ${meta?.name}: ${ayah.numberInSurah}] - عبر تطبيق نور القرآن`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareAyah = (ayah: Ayah) => {
    const meta = ALL_SURAHS.find((s) => s.number === selectedSurah);
    const shareData = {
      title: `سورة ${meta?.name} - آية ${ayah.numberInSurah}`,
      text: `﴿${ayah.text}﴾\n[سورة ${meta?.name}: الآية ${ayah.numberInSurah}]\nنور القرآن الكريم`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopyAyah(ayah);
    }
  };

  // Perform Ayah & Word Search across the Holy Quran (Quran.com v4 API + full IndexedDB offline fallback)
  const handleSearchQuranAyahs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = normalizeArabicForSearch(ayahSearchQuery);
    if (cleaned.length < 2) return;

    setIsSearchingAyahs(true);
    setHasSearchedAyahs(true);

    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
      try {
        const res = await fetch(
          `https://api.quran.com/api/v4/search?q=${encodeURIComponent(cleaned)}&size=30`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.search?.results && Array.isArray(data.search.results)) {
            const formatted = data.search.results.map((m: {
              verse_key: string;
              text: string;
            }) => {
              const [sStr, aStr] = (m.verse_key || '1:1').split(':');
              const sNum = Number(sStr) || 1;
              const aNum = Number(aStr) || 1;
              const sMeta = ALL_SURAHS.find((s) => s.number === sNum);
              return {
                surahNumber: sNum,
                surahName: sMeta?.name || `سورة ${sNum}`,
                ayahNumber: aNum,
                pageNumber: sMeta?.page || 1,
                text: (m.text || '').trim(),
              };
            });
            setAyahSearchResults(formatted);
            setIsSearchingAyahs(false);
            return;
          }
        }
      } catch {}
    }

    // Full IndexedDB + bundled verified offline Surahs fallback
    const localHits = await searchOfflineQuranAyahs(ayahSearchQuery, 40);
    setAyahSearchResults(localHits);
    setIsSearchingAyahs(false);
  };

  // Filter Surahs (diacritic-insensitive)
  const normalizedSurahFilter = normalizeArabicForSearch(searchQuery);
  const filteredSurahs = ALL_SURAHS.filter((s) => {
    const matchesSearch =
      !normalizedSurahFilter ||
      normalizeArabicForSearch(s.name).includes(normalizedSurahFilter) ||
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.number.toString() === searchQuery.trim();
    const matchesType = filterType === 'all' || s.revelationType === filterType;
    return matchesSearch && matchesType;
  });

  // Theme styling dictionary
  const themeClasses = {
    emerald: 'bg-[#042118] text-[#f4eedb]',
    dark: 'bg-[#080d0b] text-[#e0ded7]',
    ivory: 'bg-[#faf6ee] text-[#2c221e]',
    sepia: 'bg-[#f4ecd8] text-[#332619]',
  };

  // ----------------------------------------------------
  // RENDER: SURAH LIST / INDEX
  // ----------------------------------------------------
  if (selectedSurah === null) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-24 px-4">
        {/* Quran Index Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
          <div>
            <h2 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#c5a059]" />
              <span>فهرس القرآن الكريم</span>
            </h2>
            <p className="text-xs text-emerald-300/70 mt-1">
              ١١٤ سورة · ٣٠ جزءاً · ٦٠٤ صفحات مطابقة لمصحف المدينة النبوية
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم سورة أو رقمها..."
              className="w-full pr-10 pl-4 py-2 bg-emerald-950/60 border border-emerald-800/40 rounded-xl text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
          </div>
        </div>

        {/* Mode & Reading Switcher + Integrity Audit + 1-Click Full Offline Mushaf */}
        <div className="flex flex-col gap-3 p-3.5 mb-6 rounded-2xl bg-black/40 border border-amber-500/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setFocusedSurahOnPage(null);
                  setReadingMode('page');
                  setSelectedSurah(1);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>فتح صفحات المصحف الشريف الحقيقي</span>
              </button>
              <button
                onClick={() => setShowIntegrityModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 hover:text-white text-xs font-bold cursor-pointer"
                title="التحقق الآلي من سلامة المصحف ومصادره"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>فحص سلامة المصحف</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadFullMushaf}
                disabled={offlineSummary.fullMushafReady && !isDownloadingMushaf}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  offlineSummary.fullMushafReady
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 cursor-default'
                    : isDownloadingMushaf
                    ? 'bg-red-500/15 border-red-400/50 text-red-200'
                    : 'bg-amber-500/15 border-amber-400/50 text-amber-200 hover:bg-amber-500/25'
                }`}
              >
                {offlineSummary.fullMushafReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>المصحف كامل بلا نت ✓ ({offlineSummary.pagesCount}/604)</span>
                  </>
                ) : isDownloadingMushaf ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>إيقاف ({mushafProgress?.percent || 0}%)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>تحميل المصحف كاملاً بلا نت ({offlineSummary.pagesCount}/604)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-200">
              <span>الانتقال السريع لصفحة:</span>
              <input
                type="number"
                min={1}
                max={604}
                placeholder="١-٦٠٤"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                    if (val >= 1 && val <= 604) {
                      setFocusedSurahOnPage(null);
                      setCurrentPage(val);
                      setReadingMode('page');
                      setSelectedSurah(1);
                    }
                  }
                }}
                className="w-16 px-2 py-1 bg-black/60 border border-emerald-700/50 rounded-lg text-center text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {(isDownloadingMushaf || mushafStatusMsg) && (
            <div className="text-[11px] text-emerald-200 bg-black/30 rounded-xl px-3 py-2 border border-emerald-800/40">
              {isDownloadingMushaf && mushafProgress ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{mushafProgress.message}</span>
                    <span className="tabular-nums font-bold text-amber-300">{mushafProgress.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                    <div className="h-full bg-[#c5a059] transition-all" style={{ width: `${mushafProgress.percent}%` }} />
                  </div>
                </div>
              ) : (
                <span>{mushafStatusMsg}</span>
              )}
            </div>
          )}
        </div>

        {/* Quran Font Size Slider Control Bar */}
        <div className="p-4 mb-6 rounded-2xl bg-[#082a1f]/75 border border-emerald-700/35 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-[220px] flex-1">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="quran-index-font-slider"
                className="flex items-center gap-1.5 text-xs font-bold text-amber-300"
              >
                <Type className="w-4 h-4 text-[#c5a059]" />
                <span>حجم خط النص القرآني</span>
              </label>
              <span
                data-testid="quran-font-size-value"
                className="text-xs font-bold text-amber-200 tabular-nums"
              >
                {fontSize} px
              </span>
            </div>

            <div className="flex items-center gap-2.5 mt-1">
              <button
                type="button"
                onClick={() => handleUpdateFontSize(fontSize - 1)}
                className="min-w-[36px] min-h-[36px] px-2 rounded-lg bg-black/40 border border-emerald-700/40 text-xs font-bold text-emerald-100 hover:text-amber-300 transition-colors cursor-pointer"
                aria-label="تصغير خط القرآن"
              >
                أ-
              </button>
              <input
                id="quran-index-font-slider"
                type="range"
                min={MUSHAF_MIN_FONT_SIZE}
                max={MUSHAF_MAX_FONT_SIZE}
                step={1}
                value={fontSize}
                onChange={(e) => handleUpdateFontSize(Number(e.target.value))}
                aria-label="شريط تمرير حجم خط النص القرآني"
                className="flex-1 h-2 rounded-lg accent-[#c5a059] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleUpdateFontSize(fontSize + 1)}
                className="min-w-[36px] min-h-[36px] px-2 rounded-lg bg-black/40 border border-emerald-700/40 text-xs font-bold text-emerald-100 hover:text-amber-300 transition-colors cursor-pointer"
                aria-label="تكبير خط القرآن"
              >
                أ+
              </button>
            </div>
          </div>

          <div className="md:max-w-xs w-full px-3.5 py-2 rounded-xl bg-black/35 border border-amber-500/20 text-center overflow-hidden">
            <span className="block text-[10px] text-emerald-300/70 mb-0.5">معاينة فورية (يحفظ تلقائياً)</span>
            <p
              style={{ fontSize: `${fontSize}px` }}
              className="font-quran text-amber-100 leading-relaxed truncate"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        </div>

        {/* Tab Switcher: السور / الأجزاء / الأحزاب / البحث في الآيات / الإشارات المرجعية */}
        <div className="flex flex-wrap items-center gap-2 border-b border-emerald-800/40 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('surahs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'surahs'
                ? 'bg-[#c5a059] text-black font-bold shadow-md'
                : 'text-emerald-200/80 hover:text-white bg-emerald-950/40'
            }`}
          >
            السور (114)
          </button>
          <button
            onClick={() => setActiveTab('juz')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'juz'
                ? 'bg-[#c5a059] text-black font-bold shadow-md'
                : 'text-emerald-200/80 hover:text-white bg-emerald-950/40'
            }`}
          >
            الأجزاء (30)
          </button>
          <button
            onClick={() => setActiveTab('hizb')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'hizb'
                ? 'bg-[#c5a059] text-black font-bold shadow-md'
                : 'text-emerald-200/80 hover:text-white bg-emerald-950/40'
            }`}
          >
            الأحزاب (60)
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#c5a059] text-black font-bold shadow-md'
                : 'text-emerald-200/80 hover:text-white bg-emerald-950/40'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>البحث في الآيات</span>
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-[#c5a059] text-black font-bold shadow-md'
                : 'text-emerald-200/80 hover:text-white bg-emerald-950/40'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>المفضلة ({bookmarks.length})</span>
          </button>
        </div>

        {/* Revelation Filter Pills (for Surahs tab) */}
        {activeTab === 'surahs' && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
            >
              الكل ({ALL_SURAHS.length})
            </button>
            <button
              onClick={() => setFilterType('Meccan')}
              className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                filterType === 'Meccan'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
            >
              مكية ({ALL_SURAHS.filter((s) => s.revelationType === 'Meccan').length})
            </button>
            <button
              onClick={() => setFilterType('Medinan')}
              className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                filterType === 'Medinan'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
            >
              مدنية ({ALL_SURAHS.filter((s) => s.revelationType === 'Medinan').length})
            </button>
          </div>
        )}

        {/* Surahs Grid List */}
        {activeTab === 'surahs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredSurahs.map((surah) => (
              <div
                key={surah.number}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c382a] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-right group"
              >
                <button
                  onClick={() => {
                    setFocusedSurahOnPage(surah.number);
                    setCurrentPage(surah.page);
                    setSelectedSurah(surah.number);
                    setReadingMode('page');
                  }}
                  className="flex items-center gap-3 text-right flex-1 cursor-pointer"
                >
                  {/* Surah Number Badge */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-amber-500/20 flex items-center justify-center text-amber-300 font-bold text-sm tabular-nums group-hover:scale-105 transition-transform">
                    {surah.number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {surah.name}
                    </h3>
                    <p className="text-[11px] text-emerald-300/70">
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · {surah.numberOfAyahs} آية
                    </p>
                  </div>
                </button>

                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => {
                      setFocusedSurahOnPage(surah.number);
                      setCurrentPage(surah.page);
                      setSelectedSurah(surah.number);
                      setReadingMode('page');
                    }}
                    className="text-[11px] text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    title="فتح صفحة المصحف الشريف"
                  >
                    صـ {surah.page}
                  </button>
                  <button
                    onClick={() => {
                      setFocusedSurahOnPage(surah.number);
                      setActiveAyahNumber(null);
                      setSelectedSurah(surah.number);
                      setReadingMode('verses');
                    }}
                    className="text-[10px] text-emerald-300/70 hover:text-white underline cursor-pointer"
                    title="عرض الآيات مع التفسير"
                  >
                    عرض الآيات
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accurate 30 Juz View */}
        {activeTab === 'juz' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {JUZ_START_DATA.map((jItem) => (
              <button
                key={jItem.juz}
                onClick={() => {
                  setFocusedSurahOnPage(null);
                  setCurrentPage(jItem.page);
                  setSelectedSurah(jItem.surahNumber);
                  setReadingMode('page');
                }}
                className="p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c382a] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-right flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-sm tabular-nums">
                    {jItem.juz}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      الجزء {jItem.juz} ({jItem.nameArabic})
                    </h4>
                    <p className="text-xs text-emerald-300/70">
                      سورة {jItem.surahNameArabic} ({jItem.ayahNumber}) · صـ {jItem.page}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-emerald-400/50" />
              </button>
            ))}
          </div>
        )}

        {/* 60 Hizb Quick Jump Grid */}
        {activeTab === 'hizb' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {HIZB_START_DATA.map((hItem) => (
              <button
                key={hItem.hizb}
                onClick={() => {
                  setFocusedSurahOnPage(null);
                  setCurrentPage(hItem.page);
                  setSelectedSurah(hItem.surahNumber);
                  setReadingMode('page');
                }}
                className="p-3 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c382a] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-right flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-amber-300">الحزب {hItem.hizb}</div>
                  <div className="text-[11px] text-emerald-300/70">
                    الجزء {hItem.juz} · صـ {hItem.page}
                  </div>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-emerald-400/50" />
              </button>
            ))}
          </div>
        )}

        {/* Word & Ayah Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <form onSubmit={handleSearchQuranAyahs} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={ayahSearchQuery}
                  onChange={(e) => setAyahSearchQuery(e.target.value)}
                  placeholder="ابحث عن أي كلمة أو آية في القرآن الكريم (مثال: الحمد، الكوثر، الله لا إله إلا هو)..."
                  className="w-full pr-10 pl-4 py-2.5 bg-emerald-950/70 border border-emerald-700/50 rounded-xl text-xs text-white placeholder-emerald-300/50 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingAyahs}
                className="px-5 py-2.5 rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSearchingAyahs && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>بحث في القرآن</span>
              </button>
            </form>

            {ayahSearchResults.length > 0 ? (
              <div className="space-y-2.5">
                <div className="text-xs text-emerald-300/80">
                  تم العثور على {ayahSearchResults.length} نتيجة مطابقة:
                </div>
                {ayahSearchResults.map((hit, idx) => (
                  <div
                    key={`${hit.surahNumber}_${hit.ayahNumber}_${idx}`}
                    className="p-4 rounded-2xl bg-[#082a1f]/75 border border-emerald-700/35 hover:border-amber-400/50 transition-all"
                  >
                    <p className="font-quran text-lg text-amber-100 leading-loose text-right mb-2">
                      {hit.text} <span className="text-amber-400">﴿{hit.ayahNumber}﴾</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-800/30 text-xs">
                      <span className="text-emerald-300/80 font-bold">
                        سورة {hit.surahName} · الآية {hit.ayahNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSurah(hit.surahNumber);
                            setActiveAyahNumber(hit.ayahNumber);
                            setReadingMode('verses');
                          }}
                          className="px-3 py-1 rounded-lg bg-[#c5a059] text-black font-bold text-[11px] cursor-pointer"
                        >
                          فتح السورة عند الآية
                        </button>
                        <button
                          onClick={() => {
                            setFocusedSurahOnPage(hit.surahNumber);
                            setCurrentPage(hit.pageNumber);
                            setSelectedSurah(hit.surahNumber);
                            setReadingMode('page');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 text-[11px] cursor-pointer"
                        >
                          صـ {hit.pageNumber}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hasSearchedAyahs ? (
              <div className="text-center py-10 bg-[#082a1f]/30 rounded-2xl border border-dashed border-amber-500/30 text-xs text-amber-200/90 px-4">
                لم يتم العثور على آيات مطابقة لـ «{ayahSearchQuery}» — جرّب كلمة قرآنية مطابقة للرسم مثل: الحمد، الكوثر، الله، كرسيه.
              </div>
            ) : (
              <div className="text-center py-12 bg-[#082a1f]/30 rounded-2xl border border-dashed border-emerald-800/40 text-xs text-emerald-300/70">
                اكتب كلمة أو جملة قرآنية ثم اضغط «بحث في القرآن» للوصول الفوري للآية والسورة
              </div>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="flex flex-col gap-3">
            {bookmarks.length === 0 ? (
              <div className="text-center py-16 bg-[#082a1f]/30 rounded-2xl border border-dashed border-emerald-800/40">
                <Bookmark className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
                <p className="text-sm text-emerald-200/80">لم تحفظ أي إشارات مرجعية بعد</p>
                <p className="text-xs text-emerald-300/60 mt-1">
                  يمكنك حفظ أي آية أو صفحة أثناء القراءة بالضغط عليها واختيار «حفظ إشارة مرجعية»
                </p>
              </div>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#082a1f]/70 border border-emerald-700/30"
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        سورة {bm.surahName} - الآية {bm.ayahNumber}
                      </h4>
                      <p className="text-xs text-emerald-300/60">
                        صفحة {bm.pageNumber} · أضيفت في {bm.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFocusedSurahOnPage(bm.surahNumber);
                        setCurrentPage(bm.pageNumber);
                        setSelectedSurah(bm.surahNumber);
                        setReadingMode('page');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs cursor-pointer"
                    >
                      فتح الصفحة ({bm.pageNumber})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSurah(bm.surahNumber);
                        setActiveAyahNumber(bm.ayahNumber);
                        setReadingMode('verses');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-900/60 text-emerald-200 text-xs hover:text-white cursor-pointer"
                    >
                      عرض الآية
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showIntegrityModal && (
          <QuranIntegrityModal
            onClose={() => {
              setShowIntegrityModal(false);
              void refreshOfflineSummary();
            }}
          />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: PHYSICAL MUSHAF PAGE VIEW MODE (FULL SCREEN)
  // ----------------------------------------------------
  if (readingMode === 'page') {
    return (
      <MushafPageView
        initialPage={currentPage}
        focusedSurahNumber={focusedSurahOnPage}
        onClearFocusSurah={() => setFocusedSurahOnPage(null)}
        onPageChange={(p) => setCurrentPage(p)}
        onOpenIndex={() => setSelectedSurah(null)}
        onSwitchToVersesMode={() => setReadingMode('verses')}
        fontSize={fontSize}
        onFontSizeChange={handleUpdateFontSize}
      />
    );
  }

  // ----------------------------------------------------
  // RENDER: SURAH READER VIEW
  // ----------------------------------------------------
  const currentSurahMeta = ALL_SURAHS.find((s) => s.number === selectedSurah) || ALL_SURAHS[0];

  return (
    <div className={`w-full max-w-4xl mx-auto pb-28 min-h-screen ${themeClasses[readerTheme]} rounded-3xl p-4 md:p-6 shadow-2xl transition-colors`}>
      {/* Reader Control Header */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 mb-6 rounded-2xl bg-black/40 backdrop-blur-md border border-amber-500/20">
        {/* Back to Index & Switch to Pages */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedSurah(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الفهرس</span>
          </button>
          <button
            onClick={() => {
              setCurrentPage(currentSurahMeta.page);
              setReadingMode('page');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-extrabold shadow hover:brightness-110 transition-all cursor-pointer"
            title="الانتقال إلى شكل المصحف الحقيقي صفحات"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>صفحات المصحف</span>
          </button>
        </div>

        {/* Surah Name & Navigation */}
        <div className="flex items-center gap-2">
          <button
            disabled={selectedSurah <= 1}
            onClick={() => setSelectedSurah((prev) => (prev ? prev - 1 : 1))}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white disabled:opacity-30"
            title="السورة السابقة"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-amber-300">{currentSurahMeta.name}</h2>
            <p className="text-[11px] text-emerald-300/70">
              {currentSurahMeta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · {currentSurahMeta.numberOfAyahs} آية · صـ {currentSurahMeta.page}
            </p>
          </div>

          <button
            disabled={selectedSurah >= 114}
            onClick={() => setSelectedSurah((prev) => (prev ? prev + 1 : 114))}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white disabled:opacity-30"
            title="السورة التالية"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Reading Options: Font Style, Font Size, Theme, View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Style Toggle: عثماني / عادي */}
          <button
            onClick={handleToggleFontStyle}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${
              fontStyle === 'uthmani'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                : 'bg-emerald-950/60 text-emerald-100 border-emerald-700/50'
            }`}
            title="التبديل بين الخط العثماني والخط العادي"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>الخط: {fontStyle === 'uthmani' ? 'عثماني' : 'عادي'}</span>
          </button>

          {/* Font Size Slider Control */}
          <div className="flex items-center gap-2 bg-black/30 rounded-xl px-2.5 py-1.5 border border-emerald-800/40 text-xs">
            <button
              type="button"
              onClick={() => handleUpdateFontSize(fontSize - 1)}
              className="px-1.5 py-0.5 hover:text-amber-300 cursor-pointer font-bold whitespace-nowrap shrink-0"
              aria-label="تصغير خط النص القرآني"
              title="تصغير الخط"
            >
              أ-
            </button>
            <input
              type="range"
              min={MUSHAF_MIN_FONT_SIZE}
              max={MUSHAF_MAX_FONT_SIZE}
              step={1}
              value={fontSize}
              onChange={(e) => handleUpdateFontSize(Number(e.target.value))}
              aria-label="التحكم في حجم خط النص القرآني"
              className="w-24 sm:w-32 h-1.5 accent-[#c5a059] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleUpdateFontSize(fontSize + 1)}
              className="px-1.5 py-0.5 hover:text-amber-300 cursor-pointer font-bold whitespace-nowrap shrink-0"
              aria-label="تكبير خط النص القرآني"
              title="تكبير الخط"
            >
              أ+
            </button>
            <span
              data-testid="quran-reader-font-size-value"
              className="px-1 text-[11px] text-amber-300 font-bold tabular-nums whitespace-nowrap shrink-0"
            >
              {fontSize}px
            </span>
          </div>

          {/* Quick Dark vs Light Toggle */}
          <button
            onClick={() => {
              const isDark = readerTheme === 'emerald' || readerTheme === 'dark';
              handleUpdateReaderTheme(isDark ? 'ivory' : 'emerald');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold cursor-pointer"
            title="التبديل بين الخلفيات الداكنة والفاتحة"
          >
            {readerTheme === 'emerald' || readerTheme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>فاتح</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>داكن</span>
              </>
            )}
          </button>

          {/* Theme Palette Selector (الخلفيات الداكنة والفاتحة) */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-emerald-800/40">
            <button
              onClick={() => handleUpdateReaderTheme('emerald')}
              className={`w-5 h-5 rounded-full bg-[#042118] border ${readerTheme === 'emerald' ? 'border-amber-400 scale-110 ring-1 ring-amber-400' : 'border-transparent'}`}
              title="الوضع الزمردي الداكن"
            />
            <button
              onClick={() => handleUpdateReaderTheme('dark')}
              className={`w-5 h-5 rounded-full bg-[#080d0b] border ${readerTheme === 'dark' ? 'border-amber-400 scale-110 ring-1 ring-amber-400' : 'border-transparent'}`}
              title="الوضع الأسود الداكن"
            />
            <button
              onClick={() => handleUpdateReaderTheme('ivory')}
              className={`w-5 h-5 rounded-full bg-[#faf6ee] border ${readerTheme === 'ivory' ? 'border-amber-400 scale-110 ring-1 ring-amber-400' : 'border-transparent'}`}
              title="الوضع العاجي الفاتح"
            />
            <button
              onClick={() => handleUpdateReaderTheme('sepia')}
              className={`w-5 h-5 rounded-full bg-[#f4ecd8] border ${readerTheme === 'sepia' ? 'border-amber-400 scale-110 ring-1 ring-amber-400' : 'border-transparent'}`}
              title="الوضع الكلاسيكي الفاتح"
            />
          </div>
        </div>
      </div>

      {bookmarkNotice && (
        <div className="mb-4 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-center justify-between">
          <span>{bookmarkNotice}</span>
          <button onClick={() => setBookmarkNotice(null)} className="text-amber-300 hover:text-white px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Reciter Selector, Playback Speed & A-B Repeat Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/25 border border-emerald-800/35 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="text-emerald-200/80">القارئ:</span>
          <select
            value={selectedReciter}
            onChange={(e) => setSelectedReciter(e.target.value)}
            className="bg-black/50 border border-emerald-700/40 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                {r.nameArabic} - {r.styleArabic}
              </option>
            ))}
          </select>
        </div>

        {/* Speed, Repeat Mode & Play All */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setRepeatMode((m) => (m === 'none' ? 'single' : m === 'single' ? 'range' : 'none'))
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
              repeatMode !== 'none'
                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                : 'bg-black/40 border-emerald-700/40 text-emerald-200'
            }`}
            title="التبديل بين تكرار آية أو تكرار نطاق محدد للحفظ"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>
              {repeatMode === 'none'
                ? 'بلا تكرار'
                : repeatMode === 'single'
                ? 'تكرار الآية'
                : 'تكرار مجموعة'}
            </span>
          </button>

          {repeatMode === 'range' && (
            <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-lg border border-amber-500/30 text-[11px]">
              <span>من</span>
              <input
                type="number"
                min={1}
                max={currentSurahMeta.numberOfAyahs}
                value={rangeStartAyah}
                onChange={(e) => setRangeStartAyah(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-10 bg-transparent text-center text-amber-300 font-bold border-b border-amber-500/40 focus:outline-none"
              />
              <span>إلى</span>
              <input
                type="number"
                min={1}
                max={currentSurahMeta.numberOfAyahs}
                value={rangeEndAyah}
                onChange={(e) =>
                  setRangeEndAyah(
                    Math.min(currentSurahMeta.numberOfAyahs, parseInt(e.target.value, 10) || currentSurahMeta.numberOfAyahs)
                  )
                }
                className="w-10 bg-transparent text-center text-amber-300 font-bold border-b border-amber-500/40 focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 1.25 : s === 1.25 ? 1.5 : s === 1.5 ? 0.75 : 1))}
            className="px-2 py-1 rounded-lg bg-black/40 border border-emerald-700/40 text-[11px] text-amber-300 tabular-nums cursor-pointer"
            title="سرعة التلاوة"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={() => togglePlayAudio(playingAyahIndex)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] transition-all cursor-pointer"
          >
            {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingAudio ? 'إيقاف مؤقت' : 'استماع للسورة'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSurahAudioOffline}
            disabled={surahAyahs.length === 0 || (isSurahAudioCached && !isDownloadingSurahAudio)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
              isSurahAudioCached
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 cursor-default'
                : isDownloadingSurahAudio
                ? 'bg-red-500/20 border-red-400/50 text-red-200'
                : 'bg-black/40 border-amber-500/40 text-amber-200 hover:bg-amber-500/15'
            }`}
            title="تحميل صوت تلاوة هذه السورة للعمل بلا إنترنت دائماً"
          >
            {isSurahAudioCached ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>التلاوة محفوظة بلا نت ✓</span>
              </>
            ) : isDownloadingSurahAudio ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>
                  إيقاف ({surahAudioProgress?.completed || 0}/{surahAudioProgress?.total || surahAyahs.length})
                </span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>حفظ تلاوة السورة بلا نت</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Elegant Surah Title Header Frame */}
      <div className="w-full text-center py-6 px-4 my-4 rounded-3xl border-2 border-[#c5a059]/40 bg-gradient-to-b from-[#c5a059]/10 to-transparent relative overflow-hidden">
        {/* Decorative corner star geometry */}
        <span className="absolute top-2 right-3 text-amber-400/40 text-lg">۞</span>
        <span className="absolute top-2 left-3 text-amber-400/40 text-lg">۞</span>
        <span className="absolute bottom-2 right-3 text-amber-400/40 text-lg">۞</span>
        <span className="absolute bottom-2 left-3 text-amber-400/40 text-lg">۞</span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-amber-300 font-quran mb-1">
          سُورَةُ {currentSurahMeta.name}
        </h1>
        <p className="text-xs text-amber-200/70">
          آياتها {currentSurahMeta.numberOfAyahs} · ترتيبها {currentSurahMeta.number} · نزلت في {currentSurahMeta.revelationType === 'Meccan' ? 'مكة المكرمة' : 'المدينة المنورة'}
        </p>

        {/* Basmalah (placed ONLY at the top centered banner, unless Surah 9 or Surah 1 where it is verse 1) */}
        {selectedSurah !== 9 && selectedSurah !== 1 && (
          <div className="mt-4 pt-3 border-t border-amber-500/20">
            <p className={`${fontStyle === 'uthmani' ? 'font-quran' : 'font-arabic-serif font-bold'} text-2xl md:text-3xl text-amber-200/90 tracking-wide`}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        )}
      </div>

      {/* Verses Container */}
      {surahValidationError && surahAyahs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-black/30 border border-amber-500/30 mt-6">
          <AlertTriangle className="w-9 h-9 text-amber-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-amber-200 mb-3">{surahValidationError}</p>
          <button
            onClick={() => setSelectedSurah((s) => s)}
            className="px-4 py-1.5 rounded-xl bg-[#c5a059] text-black font-bold text-xs cursor-pointer"
          >
            إعادة المحاولة والتحقق
          </button>
        </div>
      ) : isLoadingVerses && surahAyahs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-emerald-300/80">جاري تحميل الآيات الكريمة بالرسم العثماني...</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4 px-2 md:px-4">
          {surahAyahs.map((ayah, idx) => {
            const isPlayingThisAyah = isPlayingAudio && playingAyahIndex === idx;
            const isHighlighted = activeAyahNumber === ayah.numberInSurah;

            return (
              <div
                key={ayah.numberInSurah}
                id={`ayah-${ayah.numberInSurah}`}
                className={`p-4 md:p-5 rounded-2xl transition-all border ${
                  isPlayingThisAyah
                    ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                    : isHighlighted
                    ? 'border-amber-400/60 bg-emerald-900/30'
                    : 'border-transparent hover:border-emerald-700/30 hover:bg-black/10'
                }`}
              >
                {/* Verse Text in Uthmanic or Standard Font */}
                <div
                  style={{ fontSize: `${fontSize}px` }}
                  className={`${fontStyle === 'uthmani' ? 'font-quran' : 'font-arabic-serif font-medium tracking-normal'} text-right leading-[2.4] select-text cursor-pointer`}
                  onClick={() => setSelectedAyahForDetails(ayah)}
                >
                  <span>{removeLeadingBasmalah(ayah.text, selectedSurah, ayah.numberInSurah)}</span>
                  {/* Uthmanic verse end marker ﴿١﴾ */}
                  <span className="inline-flex items-center justify-center text-amber-400 font-bold mx-2 text-[0.8em] tabular-nums select-none">
                    ﴿{ayah.numberInSurah}﴾
                  </span>
                  {isSajdahAyah(selectedSurah, ayah.numberInSurah) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mr-1">
                      ۩ سجدة تلاوة
                    </span>
                  )}
                </div>

                {/* Verse Action Bar */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-emerald-800/20 text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Play Ayah button */}
                    <button
                      onClick={() => togglePlayAudio(idx)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                        isPlayingThisAyah
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-emerald-950/40 text-emerald-200 hover:text-white'
                      }`}
                    >
                      {isPlayingThisAyah ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingThisAyah ? 'إيقاف' : 'استماع'}</span>
                    </button>

                    {/* Tafsir / Translation toggle */}
                    <button
                      onClick={() => setSelectedAyahForDetails(ayah)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-200 hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>تفسير وترجمة</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-300/70">
                    <button
                      onClick={() => handleSaveBookmark(ayah)}
                      className="p-1.5 rounded-lg hover:text-amber-300 hover:bg-black/20"
                      title="حفظ إشارة مرجعية"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopyAyah(ayah)}
                      className="p-1.5 rounded-lg hover:text-amber-300 hover:bg-black/20"
                      title="نسخ الآية"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareAyah(ayah)}
                      className="p-1.5 rounded-lg hover:text-amber-300 hover:bg-black/20"
                      title="مشاركة الآية"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Multi-Tafsir (Al-Muyassar, Ibn Kathir, Al-Saadi) & Multi-Language Translation Modal */}
      {selectedAyahForDetails && (
        <TafsirTranslationModal
          surahNumber={selectedSurah}
          surahNameArabic={currentSurahMeta.name}
          ayahNumberInSurah={selectedAyahForDetails.numberInSurah}
          ayahText={selectedAyahForDetails.text}
          initialMuyassar={selectedAyahForDetails.tafsir}
          initialTranslation={selectedAyahForDetails.translation}
          onClose={() => setSelectedAyahForDetails(null)}
          onSaveBookmark={() => handleSaveBookmark(selectedAyahForDetails)}
        />
      )}
    </div>
  );
};
