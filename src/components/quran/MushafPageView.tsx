import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Volume2,
  FileText,
  Copy,
  Sliders,
  Check,
  Play,
  Pause,
  Columns2,
  EyeOff,
  Eye,
  List,
  AlignJustify,
  Sun,
  Moon,
  Type,
  Repeat,
  AlertTriangle,
  X,
} from 'lucide-react';
import { RECITERS } from '../../data/quranMeta';
import { Ayah } from '../../types';
import { removeLeadingBasmalah } from '../../utils/adhkarPrayerSync';
import { validateFetchedPageAyahs, isSajdahAyah, filterPageAyahsBySurah } from '../../utils/quranIntegrity';
import {
  getEveryAyahAudioUrl,
  recordPageRead,
  getPlayableAudioSrc,
  cacheAudioForOffline,
} from '../../utils/quranAudioAndTafsir';
import { getOfflinePage, saveOfflinePage } from '../../utils/offlineStorage';
import {
  clampMushafFontSize,
  formatMushafHeaderSummary,
  getMushafThemeSurface,
  MUSHAF_MAX_FONT_SIZE,
  MUSHAF_MIN_FONT_SIZE,
  MushafPaperTheme,
} from '../../utils/mushafReaderHelpers';
import { TafsirTranslationModal } from './TafsirTranslationModal';

interface PageAyah extends Ayah {
  surahNumber: number;
  surahNameArabic: string;
  isFirstAyahOfSurah?: boolean;
}

interface MushafPageViewProps {
  initialPage?: number;
  focusedSurahNumber?: number | null;
  onClearFocusSurah?: () => void;
  onPageChange?: (page: number) => void;
  onOpenIndex?: () => void;
  onSwitchToVersesMode?: () => void;
  fontSize?: number;
  onFontSizeChange?: (nextSize: number) => void;
}

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  initialPage = 1,
  focusedSurahNumber = null,
  onClearFocusSurah,
  onPageChange,
  onOpenIndex,
  onSwitchToVersesMode,
  fontSize: controlledFontSize,
  onFontSizeChange,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const focusedSurahRef = useRef<number | null>(focusedSurahNumber);
  focusedSurahRef.current = focusedSurahNumber;

  const prevInitialPageRef = useRef<number>(initialPage);
  const lastReportedPageRef = useRef<number>(initialPage);

  // Sync only when parent genuinely navigates to a different initialPage (never when focusedSurahNumber changes or when initialPage echoes onPageChange)
  useEffect(() => {
    if (prevInitialPageRef.current !== initialPage) {
      prevInitialPageRef.current = initialPage;
      if (initialPage !== lastReportedPageRef.current) {
        lastReportedPageRef.current = initialPage;
        setCurrentPage(initialPage);
        setSelectedAyah(null);
      }
    }
  }, [initialPage]);

  useEffect(() => {
    setSelectedAyah(null);
  }, [focusedSurahNumber]);

  const [pageAyahs, setPageAyahs] = useState<PageAyah[]>([]);
  const [leftPageAyahs, setLeftPageAyahs] = useState<PageAyah[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDualPage, setIsDualPage] = useState<boolean>(false);
  // 'continuous' = صفحة المصحف المتصلة / 'individual' = كل آية مفردة بسطرها المستقل
  const [verseLayout, setVerseLayout] = useState<'individual' | 'continuous'>(() => {
    return (localStorage.getItem('noor_verse_layout') as 'individual' | 'continuous') || 'continuous';
  });
  const [paperTheme, setPaperTheme] = useState<MushafPaperTheme>(() => {
    return (localStorage.getItem('noor_paper_theme') as MushafPaperTheme) || 'madani';
  });
  const [fontStyle, setFontStyle] = useState<'uthmani' | 'standard'>(() => {
    return (localStorage.getItem('noor_quran_font_style') as 'uthmani' | 'standard') || 'uthmani';
  });
  const [internalFontSize, setInternalFontSize] = useState<number>(() => {
    try {
      return clampMushafFontSize(parseInt(localStorage.getItem('noor_quran_font_size') || '26', 10));
    } catch {
      return 26;
    }
  });

  const fontSize = controlledFontSize !== undefined ? clampMushafFontSize(controlledFontSize) : internalFontSize;

  useEffect(() => {
    if (controlledFontSize !== undefined) {
      setInternalFontSize(clampMushafFontSize(controlledFontSize));
    }
  }, [controlledFontSize]);

  const handleUpdateLayout = (layout: 'individual' | 'continuous') => {
    setVerseLayout(layout);
    localStorage.setItem('noor_verse_layout', layout);
  };

  const handleUpdateTheme = (theme: MushafPaperTheme) => {
    setPaperTheme(theme);
    localStorage.setItem('noor_paper_theme', theme);
  };

  const handleToggleDarkLight = () => {
    const isCurrentlyDark = paperTheme === 'night' || paperTheme === 'darkBlack';
    const nextTheme = isCurrentlyDark ? 'madani' : 'night';
    handleUpdateTheme(nextTheme);
  };

  const handleToggleFontStyle = () => {
    const nextStyle = fontStyle === 'uthmani' ? 'standard' : 'uthmani';
    setFontStyle(nextStyle);
    localStorage.setItem('noor_quran_font_style', nextStyle);
  };

  const handleSetFontSize = (nextRaw: number) => {
    const nextSize = clampMushafFontSize(nextRaw);
    setInternalFontSize(nextSize);
    if (onFontSizeChange) {
      onFontSizeChange(nextSize);
    } else {
      try {
        localStorage.setItem('noor_quran_font_size', String(nextSize));
      } catch {}
    }
  };

  const handleUpdateFontSize = (delta: number) => {
    handleSetFontSize(fontSize + delta);
  };

  // Selected Ayah for audio / tafsir
  const [selectedAyah, setSelectedAyah] = useState<PageAyah | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);
  const [selectedReciter, setSelectedReciter] = useState<string>(RECITERS[0].id);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [repeatAyah, setRepeatAyah] = useState<boolean>(false);
  const [autoAdvancePageAudio, setAutoAdvancePageAudio] = useState<boolean>(true);
  const [integrityError, setIntegrityError] = useState<string | null>(null);
  const [showTafsirModal, setShowTafsirModal] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [pageTurnDir, setPageTurnDir] = useState<'next' | 'prev' | null>(null);
  const [pageTurnAnimKey, setPageTurnAnimKey] = useState<number>(0);
  const [turnBadgeLabel, setTurnBadgeLabel] = useState<string | null>(null);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('noor_page_bookmarks');
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const audioSessionRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const turnBadgeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      audioSessionRef.current += 1;
      audioRef.current?.pause();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Play realistic paper page turn sound
  const playPageTurnSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const bufferSize = ctx.sampleRate * 0.12; // 120ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {}
  };

  // Fetch page content with strict integrity validation (localStorage + IndexedDB)
  const fetchPageData = async (pageNum: number): Promise<PageAyah[]> => {
    const cached = await getOfflinePage(pageNum);
    if (cached && cached.length > 0) {
      try {
        const cleaned = cached.map((ay) => ({
          ...ay,
          text: removeLeadingBasmalah(ay.text, ay.surahNumber, ay.numberInSurah),
        }));
        const validation = validateFetchedPageAyahs(cleaned, pageNum);
        if (validation.valid) {
          return cleaned;
        }
      } catch {}
    }

    try {
      const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`);
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data.ayahs)) {
        const rawAyahs = data.data.ayahs;

        const ayahs: PageAyah[] = rawAyahs.map((ay: { number: number; numberInSurah: number; text: string; page: number; juz: number; surah: { number: number; name: string } }) => {
          const surahNumber = ay.surah?.number || 1;
          const cleanText = removeLeadingBasmalah(ay.text, surahNumber, ay.numberInSurah);
          return {
            number: ay.number,
            numberInSurah: ay.numberInSurah,
            surahNumber,
            surahNameArabic: (ay.surah?.name || 'الفَاتِحَة').replace('سُورَةُ ', ''),
            isFirstAyahOfSurah: ay.numberInSurah === 1,
            text: cleanText,
            translation: '',
            tafsir: '',
            page: pageNum,
            juz: ay.juz || 1,
          };
        });

        const validation = validateFetchedPageAyahs(ayahs, pageNum);
        if (!validation.valid) {
          setIntegrityError(validation.reason || 'فشل التحقق من سلامة بيانات الصفحة القرآنية.');
          return [];
        }

        // Background enrich with Tafsir Al-Muyassar and persist to IndexedDB
        fetch(`https://api.alquran.cloud/v1/page/${pageNum}/ar.muyassar`)
          .then((tRes) => tRes.json())
          .then((tData) => {
            if (tData && tData.data && Array.isArray(tData.data.ayahs)) {
              tData.data.ayahs.forEach((tAy: { text: string }, idx: number) => {
                if (ayahs[idx]) ayahs[idx].tafsir = tAy.text;
              });
              saveOfflinePage(pageNum, ayahs).catch(() => {});
            }
          })
          .catch(() => {});

        saveOfflinePage(pageNum, ayahs).catch(() => {});
        return ayahs;
      }
    } catch (err) {
      console.warn('Page fetch error:', err);
    }

    // Offline fallback for Page 1
    if (pageNum === 1) {
      return [
        { number: 1, numberInSurah: 1, surahNumber: 1, surahNameArabic: 'الفَاتِحَة', isFirstAyahOfSurah: true, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', tafsir: 'أبتدئ قراءة القرآن باسم الله مستعينا به.', page: 1, juz: 1 },
        { number: 2, numberInSurah: 2, surahNumber: 1, surahNameArabic: 'الفَاتِحَة', text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', translation: '[All] praise is [due] to Allah, Lord of the worlds -', tafsir: 'الثناء الكامل لله وحده، الخالق المدبر لجميع العوالم.', page: 1, juz: 1 },
        { number: 3, numberInSurah: 3, surahNumber: 1, surahNameArabic: 'الفَاتِحَة', text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful,', tafsir: 'الذي وسعت رحمته كل شيء.', page: 1, juz: 1 },
        { number: 4, numberInSurah: 4, surahNumber: 1, surahNameArabic: 'الفَاتِحَة', text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', translation: 'Sovereign of the Day of Recompense.', tafsir: 'المتصرف وحده في يوم الجزاء والحساب.', page: 1, juz: 1 },
        { number: 5, numberInSurah: 5, surahNumber: 1, surahNameArabic: 'الفَاتِحَة', text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.', tafsir: 'نخصك وحدك بالعبادة، ونطلب منك وحدك العون.', page: 1, juz: 1 },
        { number: 6, numberInSurah: 6, surahNumber: 1, surahNameArabic: 'الفَاتِحَة', text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', translation: 'Guide us to the straight path -', tafsir: 'دلنا وأرشدنا ووفقنا إلى الطريق الواضح.', page: 1, juz: 1 },
        { number: 7, numberInSurah: 7, surahNumber: 1, surahNameArabic: 'الفَاتِحَة', text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.', tafsir: 'طريق المنعم عليهم من النبيين والصديقين والشهداء والصالحين.', page: 1, juz: 1 },
      ];
    }
    return [];
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setIntegrityError(null);
    setSelectedAyah(null);

    if (lastReportedPageRef.current !== currentPage) {
      lastReportedPageRef.current = currentPage;
      onPageChangeRef.current?.(currentPage);
    }

    fetchPageData(currentPage).then((ayahs) => {
      if (cancelled) return;
      setPageAyahs(ayahs);
      setIsLoading(false);

      if (ayahs.length > 0) {
        recordPageRead(currentPage);
        const visible = filterPageAyahsBySurah(ayahs, focusedSurahRef.current);
        const first = visible[0] || ayahs[0];
        localStorage.setItem(
          'noor_last_read',
          JSON.stringify({
            surahNumber: first.surahNumber,
            surahName: first.surahNameArabic,
            ayahNumber: first.numberInSurah,
            pageNumber: currentPage,
            timestamp: new Date().toISOString(),
          })
        );
      } else if (currentPage !== 1) {
        setIntegrityError('تعذر تحميل بيانات هذه الصفحة أو التحقق منها حالياً. يرجى التأكد من الاتصال بالإنترنت والمحاولة مجدداً.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentPage, reloadNonce]);

  useEffect(() => {
    if (!isDualPage || focusedSurahNumber || currentPage >= 604) {
      setLeftPageAyahs([]);
      return;
    }
    let cancelled = false;
    fetchPageData(currentPage + 1).then((ayahs) => {
      if (!cancelled) {
        setLeftPageAyahs(ayahs);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentPage, isDualPage, focusedSurahNumber, reloadNonce]);

  const displayedPageAyahs = filterPageAyahsBySurah(pageAyahs, focusedSurahNumber);
  const isShowingFocusedSurahOnly =
    Boolean(focusedSurahNumber) &&
    pageAyahs.length > 0 &&
    displayedPageAyahs.length < pageAyahs.length;

  // Audio Playback with offline Cache API support, playback speed, repeat, & auto-advance
  const playAyahAudio = async (ayah: PageAyah, activeList: PageAyah[] = displayedPageAyahs) => {
    const key = `${ayah.surahNumber}_${ayah.numberInSurah}`;
    if (isPlayingAudio && playingAyahKey === key) {
      audioSessionRef.current += 1;
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      setPlayingAyahKey(null);
      return;
    }

    const session = ++audioSessionRef.current;
    const url = getEveryAyahAudioUrl(selectedReciter, ayah.surahNumber, ayah.numberInSurah);

    setIsPlayingAudio(true);
    setPlayingAyahKey(key);
    setSelectedAyah(ayah);

    const playableSrc = await getPlayableAudioSrc(url);
    if (audioSessionRef.current !== session) {
      if (playableSrc.startsWith('blob:')) {
        URL.revokeObjectURL(playableSrc);
      }
      return;
    }

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (playableSrc.startsWith('blob:')) {
      blobUrlRef.current = playableSrc;
    }

    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = playableSrc;
    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current.onended = () => {
      if (repeatAyah) {
        audioRef.current!.currentTime = 0;
        audioRef.current!.play().catch(() => {});
        return;
      }
      if (autoAdvancePageAudio) {
        const idx = activeList.findIndex(
          (a) => a.surahNumber === ayah.surahNumber && a.numberInSurah === ayah.numberInSurah
        );
        if (idx !== -1 && idx + 1 < activeList.length) {
          void playAyahAudio(activeList[idx + 1], activeList);
          return;
        }
      }
      setIsPlayingAudio(false);
      setPlayingAyahKey(null);
    };

    try {
      await audioRef.current.play();
      if (!playableSrc.startsWith('blob:')) {
        cacheAudioForOffline(url).catch(() => {});
      }
    } catch {
      if (audioSessionRef.current === session) {
        setIsPlayingAudio(false);
        setPlayingAyahKey(null);
      }
    }
  };

  const triggerPageTurnFeedback = (dir: 'next' | 'prev', targetPage: number) => {
    setPageTurnDir(dir);
    setPageTurnAnimKey((k) => k + 1);
    setTurnBadgeLabel(
      dir === 'next' ? `الصفحة التالية (${targetPage})` : `الصفحة السابقة (${targetPage})`
    );
    if (turnBadgeTimerRef.current) {
      window.clearTimeout(turnBadgeTimerRef.current);
    }
    turnBadgeTimerRef.current = window.setTimeout(() => {
      setTurnBadgeLabel(null);
    }, 900);
  };

  const handleNextPage = () => {
    if (currentPage < 604) {
      const nextPage = isDualPage && !focusedSurahNumber ? Math.min(604, currentPage + 2) : currentPage + 1;
      playPageTurnSound();
      triggerPageTurnFeedback('next', nextPage);
      onClearFocusSurah?.();
      setCurrentPage(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = isDualPage && !focusedSurahNumber ? Math.max(1, currentPage - 2) : currentPage - 1;
      playPageTurnSound();
      triggerPageTurnFeedback('prev', prevPage);
      onClearFocusSurah?.();
      setCurrentPage(prevPage);
    }
  };

  // Horizontal touch swipe gesture across Mushaf page container (RTL book: swipe left -> Next, swipe right -> Prev)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Require clear horizontal swipe and avoid misfires during vertical reading scroll
    if (dt < 800 && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      if (dx < 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
  };

  const navHandlersRef = useRef({ handleNextPage, handlePrevPage, showTafsirModal });
  navHandlersRef.current = { handleNextPage, handlePrevPage, showTafsirModal };

  // Keyboard arrow navigation (RTL: ArrowLeft -> Next page, ArrowRight -> Previous page)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (navHandlersRef.current.showTafsirModal) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navHandlersRef.current.handleNextPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navHandlersRef.current.handlePrevPage();
      } else if (e.key === 'Escape') {
        setShowSettings(false);
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleBookmark = (pageNum: number) => {
    const updated = bookmarks.includes(pageNum)
      ? bookmarks.filter((p) => p !== pageNum)
      : [...bookmarks, pageNum];
    setBookmarks(updated);
    localStorage.setItem('noor_page_bookmarks', JSON.stringify(updated));
  };

  // Find Surah & Juz info for current page
  const primarySurahName = displayedPageAyahs[0]?.surahNameArabic || pageAyahs[0]?.surahNameArabic || 'الفَاتِحَة';
  const primaryJuzNumber = displayedPageAyahs[0]?.juz || pageAyahs[0]?.juz || 1;
  const headerSummaryText = formatMushafHeaderSummary(
    displayedPageAyahs.map((a) => a.surahNameArabic),
    currentPage,
    primaryJuzNumber
  );

  const surface = getMushafThemeSurface(paperTheme);
  const isDarkPaper = surface.isDark;
  const isCurrentPageBookmarked = bookmarks.includes(currentPage);

  const handleQuickPlayPageAudio = () => {
    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      setPlayingAyahKey(null);
      return;
    }
    const targetAyah = selectedAyah || displayedPageAyahs[0];
    if (targetAyah) {
      playAyahAudio(targetAyah, displayedPageAyahs);
    }
  };

  const renderSurahHeaderBlock = (ayah: PageAyah) => (
    <div key={`surah-banner-${ayah.surahNumber}`} className="my-3 sm:my-4 text-center block">
      <div className="relative py-2.5 px-6 rounded-xl border-2 border-[#b8860b] bg-gradient-to-r from-[#0d3f30]/15 via-[#c5a059]/25 to-[#0d3f30]/15 shadow-sm">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${isDarkPaper ? 'text-amber-300' : 'text-[#805b12]'}`}>۝</span>
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${isDarkPaper ? 'text-amber-300' : 'text-[#805b12]'}`}>۝</span>
        <h2 className={`text-xl md:text-2xl font-bold font-quran ${isDarkPaper ? 'text-amber-200' : 'text-[#4a3206]'}`}>
          سُورَةُ {ayah.surahNameArabic}
        </h2>
      </div>

      {/* Basmalah (unless Surah At-Tawbah 9 or Al-Fatihah 1 where it is Ayah 1) */}
      {ayah.surahNumber !== 9 && ayah.surahNumber !== 1 && (
        <div className="my-3 text-center">
          <p className={`font-quran text-lg md:text-2xl font-medium ${isDarkPaper ? 'text-amber-100' : 'text-[#2c1d05]'}`}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}
    </div>
  );

  // Helper to render a single physical Mushaf Page filling the full-screen canvas cleanly
  const renderPhysicalPage = (ayahs: PageAyah[], pageNum: number, _isRightPage: boolean) => {
    const isBookmarked = bookmarks.includes(pageNum);
    const surahOnPage = ayahs[0]?.surahNameArabic || primarySurahName;
    const juzOnPage = ayahs[0]?.juz || primaryJuzNumber;

    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between rounded-2xl ${surface.paperBg} ${surface.paperShadow} border-2 ${surface.paperBorder} px-4 py-4 sm:px-8 sm:py-6 select-text transition-colors duration-200 ${
          isFocusMode ? 'min-h-[calc(100vh-1.5rem)]' : 'min-h-[calc(100vh-8.25rem)]'
        }`}
      >
        {/* Silk Bookmark Ribbon at top edge */}
        {isBookmarked && (
          <button
            type="button"
            className="absolute -top-1.5 left-12 sm:left-24 w-5 h-11 bg-gradient-to-b from-red-700 via-red-600 to-red-800 shadow-lg rounded-b z-30 flex items-end justify-center pb-1 cursor-pointer transition-transform hover:translate-y-0.5"
            title="علامة الفاصل المحفوظة (انقر للإزالة)"
            aria-label="إزالة فاصل المصحف"
            onClick={() => toggleBookmark(pageNum)}
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white/90" />
          </button>
        )}

        {/* Outer Ornate Double Golden Border (الإطار الملكي المذهب) */}
        <div className={`absolute inset-1.5 sm:inset-2 border-2 ${surface.paperBorder} rounded-xl pointer-events-none opacity-80`} />
        <div className={`absolute inset-2.5 sm:inset-3 border ${surface.paperBorder} rounded-lg pointer-events-none opacity-55`} />

        {/* Ornate Corner Arabesques (زخارف الزوايا) */}
        <span className="hidden sm:inline absolute top-3 right-3.5 text-[#9c782b] text-sm font-bold pointer-events-none select-none">۞</span>
        <span className="hidden sm:inline absolute top-3 left-3.5 text-[#9c782b] text-sm font-bold pointer-events-none select-none">۞</span>
        <span className="hidden sm:inline absolute bottom-3 right-3.5 text-[#9c782b] text-sm font-bold pointer-events-none select-none">۞</span>
        <span className="hidden sm:inline absolute bottom-3 left-3.5 text-[#9c782b] text-sm font-bold pointer-events-none select-none">۞</span>

        {/* Page Header (ترويسة الصفحة: اسم السورة واسم الجزء) */}
        <div className={`relative z-10 flex items-center justify-between px-2 sm:px-5 pb-2 mb-3 border-b border-[#c5a059]/35 text-xs font-bold ${isDarkPaper ? 'text-amber-300' : 'text-[#744e0b]'}`}>
          <span className="font-arabic-serif tracking-wide">{surahOnPage ? `سُورَةُ ${surahOnPage}` : ''}</span>
          <button
            type="button"
            onClick={() => toggleBookmark(pageNum)}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
            title={isBookmarked ? 'إزالة الفاصل' : 'وضع فاصل المصحف'}
            aria-label={isBookmarked ? 'إزالة فاصل المصحف' : 'وضع فاصل المصحف'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-red-600 fill-red-600' : isDarkPaper ? 'text-amber-300/75 hover:text-amber-200' : 'text-[#744e0b]/75 hover:text-[#744e0b]'}`} />
          </button>
          <span className="font-arabic-serif tracking-wide">الجُزْءُ {juzOnPage}</span>
        </div>

        {/* Page Content Flow */}
        <div className="relative z-10 flex-1 text-right flex flex-col justify-center">
          {ayahs.length === 0 && isLoading ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-3">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className={`text-xs ${isDarkPaper ? 'text-amber-300' : 'text-amber-900'}`}>جاري تصفح صفحة المصحف الشريف...</p>
            </div>
          ) : ayahs.length === 0 && integrityError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-4">
              <AlertTriangle className="w-9 h-9 text-amber-600" />
              <p className={`text-sm font-bold ${isDarkPaper ? 'text-amber-200' : 'text-amber-900'}`}>{integrityError}</p>
              <button
                type="button"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="px-4 py-1.5 rounded-xl bg-[#c5a059] text-black text-xs font-bold cursor-pointer"
              >
                إعادة التحقق والتحميل
              </button>
            </div>
          ) : (
            <div className="w-full">
              {/* Render verses: Continuous (صفحة مصحف متصلة) or Individual (كل آية مفردة) */}
              {verseLayout === 'individual' ? (
                <div className="space-y-3.5 my-2">
                  {ayahs.map((ayah) => {
                    const key = `${ayah.surahNumber}_${ayah.numberInSurah}`;
                    const isPlayingThis = isPlayingAudio && playingAyahKey === key;
                    const isSelected = selectedAyah?.number === ayah.number;

                    return (
                      <React.Fragment key={ayah.number}>
                        {ayah.isFirstAyahOfSurah && renderSurahHeaderBlock(ayah)}
                        <div
                          onClick={() => setSelectedAyah(ayah)}
                          className={`group relative p-3.5 md:p-4 rounded-xl border transition-all cursor-pointer ${
                            isPlayingThis
                              ? 'bg-amber-400/20 border-amber-500 shadow-md ring-1 ring-amber-400'
                              : isSelected
                              ? 'bg-amber-500/15 border-amber-600/60'
                              : isDarkPaper
                              ? 'bg-white/5 hover:bg-white/10 border-amber-500/25 hover:border-amber-400/50'
                              : 'bg-black/[0.03] hover:bg-black/[0.06] border-amber-700/25 hover:border-amber-600/50'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-600/25 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#b8860b]/20 border border-[#b8860b]/40 font-bold tabular-nums ${isDarkPaper ? 'text-amber-300' : 'text-[#6e4909]'}`}>
                                {ayah.numberInSurah}
                              </span>
                              <span className={`font-arabic-serif font-bold ${isDarkPaper ? 'text-amber-200' : 'text-[#6e4909]'}`}>
                                سورة {ayah.surahNameArabic} · الآية {ayah.numberInSurah}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 opacity-95 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playAyahAudio(ayah);
                                }}
                                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isPlayingThis
                                    ? 'bg-amber-500 text-black shadow'
                                    : isDarkPaper
                                    ? 'bg-[#b8860b]/25 text-amber-200 hover:bg-[#b8860b]/40'
                                    : 'bg-[#b8860b]/20 text-[#5c3c06] hover:bg-[#b8860b]/35'
                                }`}
                                title="استمع لتلاوة هذه الآية"
                              >
                                {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                <span>{isPlayingThis ? 'إيقاف' : 'استماع'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAyah(ayah);
                                  setShowTafsirModal(true);
                                }}
                                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                  isDarkPaper
                                    ? 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900/80'
                                    : 'bg-emerald-900/10 text-emerald-950 hover:bg-emerald-900/20 border border-emerald-900/20'
                                }`}
                                title="عرض التفسير والترجمة"
                              >
                                <FileText className={`w-3 h-3 ${isDarkPaper ? 'text-amber-400' : 'text-amber-700'}`} />
                                <span className="hidden sm:inline">تفسير</span>
                              </button>
                            </div>
                          </div>

                          <div
                            style={{ fontSize: `${fontSize}px` }}
                            className={`${fontStyle === 'uthmani' ? 'font-quran' : 'font-arabic-serif font-medium tracking-normal'} leading-[2.4] text-right select-text pt-1`}
                          >
                            <span>{removeLeadingBasmalah(ayah.text, ayah.surahNumber, ayah.numberInSurah)}</span>
                            <span className={`inline-flex items-center justify-center font-bold mx-2 text-[0.85em] tabular-nums select-none ${isDarkPaper ? 'text-amber-400' : 'text-[#8c6718]'}`}>
                              ﴿{ayah.numberInSurah}﴾
                            </span>
                            {isSajdahAyah(ayah.surahNumber, ayah.numberInSurah) && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-600/40 text-[11px] font-bold mr-1 ${isDarkPaper ? 'text-amber-300' : 'text-amber-950'}`}>
                                ۩ سجدة تلاوة
                              </span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                /* Classic Connected Mushaf Page Flow */
                <div
                  style={{ fontSize: `${fontSize}px` }}
                  className={`${fontStyle === 'uthmani' ? 'font-quran' : 'font-arabic-serif font-medium tracking-normal'} leading-[2.45] sm:leading-[2.6] text-justify select-text py-2`}
                >
                  {ayahs.map((ayah) => {
                    const key = `${ayah.surahNumber}_${ayah.numberInSurah}`;
                    const isPlayingThis = isPlayingAudio && playingAyahKey === key;
                    const isSelected = selectedAyah?.number === ayah.number;

                    return (
                      <React.Fragment key={ayah.number}>
                        {ayah.isFirstAyahOfSurah && renderSurahHeaderBlock(ayah)}
                        <span
                          onClick={() => setSelectedAyah(ayah)}
                          className={`inline cursor-pointer transition-colors rounded px-0.5 ${
                            isPlayingThis
                              ? isDarkPaper ? 'bg-amber-400/30 text-amber-100 ring-2 ring-amber-400' : 'bg-amber-400/40 text-amber-950 ring-2 ring-amber-500'
                              : isSelected
                              ? isDarkPaper ? 'bg-amber-900/40' : 'bg-amber-200/60'
                              : isDarkPaper ? 'hover:bg-amber-900/20' : 'hover:bg-amber-200/35'
                          }`}
                          title={`سورة ${ayah.surahNameArabic} - آية ${ayah.numberInSurah} (انقر للاستماع والتفسير)`}
                        >
                          <span>{removeLeadingBasmalah(ayah.text, ayah.surahNumber, ayah.numberInSurah)}</span>
                          <span className={`inline-flex items-center justify-center font-bold mx-1.5 text-[0.8em] tabular-nums select-none ${isDarkPaper ? 'text-amber-400' : 'text-amber-800'}`}>
                            ﴿{ayah.numberInSurah}﴾
                          </span>
                          {isSajdahAyah(ayah.surahNumber, ayah.numberInSurah) && (
                            <span className={`text-[0.65em] font-bold mx-1 ${isDarkPaper ? 'text-amber-300' : 'text-amber-900'}`}>۩</span>
                          )}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page Footer (رقم الصفحة داخل حلية في المنتصف) */}
        <div className="relative z-10 px-2 sm:px-5 pt-3 mt-4 border-t border-amber-600/30 flex items-center justify-between text-xs font-bold tabular-nums">
          <span className={`text-[11px] ${isDarkPaper ? 'text-amber-300/70' : 'text-[#744e0b]/75'}`}>
            مصحف المدينة المنورة
          </span>
          <span className={`${isDarkPaper ? 'text-amber-300' : 'text-[#5b3d08]'}`}>
            صفحة {pageNum}
          </span>
          <span className={`text-[11px] ${isDarkPaper ? 'text-amber-300/70' : 'text-[#744e0b]/75'}`}>
            حفص عن عاصم
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="fullscreen-mushaf-reader"
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden ${surface.viewportBg} transition-colors duration-200`}
    >
      {/* Slim Single-Row Top Reader Bar */}
      {!isFocusMode ? (
        <header
          className={`shrink-0 h-14 px-2.5 sm:px-5 border-b ${surface.barBg} ${surface.barBorder} ${surface.barText} backdrop-blur-md flex items-center justify-between gap-2 z-40`}
        >
          {/* Start in RTL (Right): Back to Index + Surah & Page Label */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                audioRef.current?.pause();
                setIsPlayingAudio(false);
                onOpenIndex?.();
              }}
              className="flex items-center gap-1 px-2.5 sm:px-3 min-h-[40px] rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="العودة إلى الفهرس"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الفهرس</span>
            </button>

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="hidden sm:block text-sm font-bold truncate">{headerSummaryText}</h1>
              <span className="sm:hidden text-xs font-bold truncate">
                سُورَةُ {primarySurahName} · صـ {currentPage}
              </span>
              {isShowingFocusedSurahOnly && onClearFocusSurah && (
                <button
                  type="button"
                  onClick={onClearFocusSurah}
                  className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${surface.buttonBg}`}
                  title="هذه الصفحة مشتركة مع سور أخرى؛ انقر لعرض كامل الصفحة"
                >
                  عرض كامل الصفحة
                </button>
              )}
            </div>
          </div>

          {/* End in RTL (Left): Reader Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isShowingFocusedSurahOnly && onClearFocusSurah && (
              <button
                type="button"
                onClick={onClearFocusSurah}
                className={`sm:hidden px-2 min-h-[38px] rounded-xl border text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${surface.buttonBg}`}
              >
                كامل الصفحة
              </button>
            )}

            <button
              type="button"
              onClick={handleQuickPlayPageAudio}
              className={`flex items-center gap-1 px-2.5 min-h-[40px] rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-500 text-black border-amber-400'
                  : surface.buttonBg
              }`}
              aria-label={isPlayingAudio ? 'إيقاف التلاوة' : 'تشغيل تلاوة الصفحة'}
              title={isPlayingAudio ? 'إيقاف التلاوة' : 'تشغيل تلاوة الصفحة'}
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isPlayingAudio ? 'إيقاف' : 'تلاوة'}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleBookmark(currentPage)}
              className={`hidden sm:flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border transition-colors shrink-0 cursor-pointer ${surface.buttonBg}`}
              aria-label={isCurrentPageBookmarked ? 'إزالة فاصل الصفحة' : 'حفظ فاصل الصفحة'}
              title={isCurrentPageBookmarked ? 'إزالة الفاصل' : 'حفظ فاصل الصفحة'}
            >
              <Bookmark className={`w-4 h-4 ${isCurrentPageBookmarked ? 'text-red-600 fill-red-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleDarkLight}
              className={`hidden sm:flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border transition-colors shrink-0 cursor-pointer ${surface.buttonBg}`}
              aria-label="التبديل بين الوضع الليلي والنهاري"
              title="التبديل بين الوضع الليلي والنهاري"
            >
              {isDarkPaper ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {onSwitchToVersesMode && (
              <button
                type="button"
                onClick={onSwitchToVersesMode}
                className={`hidden lg:flex items-center gap-1 px-2.5 min-h-[40px] rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${surface.buttonBg}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>الآيات والتفسير</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 min-h-[40px] rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                showSettings ? 'bg-[#c5a059] text-black border-[#c5a059]' : surface.buttonBg
              }`}
              aria-expanded={showSettings}
              aria-label="إعدادات المصحف"
              title="إعدادات الخط والمظهر والقارئ"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSettings(false);
                setIsFocusMode(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 min-h-[40px] rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${surface.buttonBg}`}
              aria-label="إخفاء إعدادات المصحف والفهرس"
              title="إخفاء إعدادات المصحف والفهرس لقراءة صافية"
            >
              <EyeOff className="w-4 h-4" />
              <span className="sm:hidden">إخفاء</span>
              <span className="hidden sm:inline">إخفاء الإعدادات والفهرس</span>
            </button>
          </div>
        </header>
      ) : (
        <div className="fixed top-3 left-3 z-[55] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFocusMode(false)}
            className={`flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl border shadow-lg text-xs font-bold backdrop-blur-md opacity-85 hover:opacity-100 transition-opacity cursor-pointer ${surface.barBg} ${surface.barBorder} ${surface.barText}`}
            aria-label="إظهار إعدادات المصحف والفهرس"
            title="إظهار الفهرس وإعدادات المصحف"
          >
            <Eye className="w-4 h-4" />
            <span className="sm:hidden">إظهار القوائم</span>
            <span className="hidden sm:inline">إظهار الإعدادات والفهرس</span>
          </button>
        </div>
      )}

      {/* Collapsible Mushaf Settings Drawer */}
      {showSettings && !isFocusMode && (
        <div
          role="dialog"
          aria-label="إعدادات المصحف الشريف"
          className={`fixed top-16 left-3 right-3 sm:right-auto sm:w-[400px] z-[60] rounded-2xl border p-4 shadow-2xl max-h-[78vh] overflow-y-auto space-y-4 text-xs ${surface.barBg} ${surface.barBorder} ${surface.barText}`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/25">
            <h2 className="text-sm font-bold">إعدادات الصفحة القرآنية</h2>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="p-1.5 rounded-lg hover:bg-black/10 cursor-pointer"
              aria-label="إغلاق الإعدادات"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Layout mode */}
          <div>
            <div className={`font-bold mb-1.5 ${surface.barMutedText}`}>نمط عرض الآيات</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateLayout('continuous')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                  verseLayout === 'continuous'
                    ? 'bg-[#c5a059] text-black border-[#c5a059]'
                    : surface.buttonBg
                }`}
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span>صفحة مصحف متصلة</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateLayout('individual')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                  verseLayout === 'individual'
                    ? 'bg-[#c5a059] text-black border-[#c5a059]'
                    : surface.buttonBg
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>كل آية مفردة</span>
              </button>
            </div>
          </div>

          {/* Font style & size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={`font-bold mb-1.5 ${surface.barMutedText}`}>نوع الخط</div>
              <button
                type="button"
                onClick={handleToggleFontStyle}
                className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-bold cursor-pointer ${surface.buttonBg}`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>{fontStyle === 'uthmani' ? 'رسم عثماني' : 'خط عادي'}</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-bold ${surface.barMutedText}`}>حجم الخط</span>
                <span className="font-bold tabular-nums">{fontSize} px</span>
              </div>
              <div className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${surface.buttonBg}`}>
                <button
                  type="button"
                  onClick={() => handleUpdateFontSize(-1)}
                  className="px-2 py-0.5 font-bold cursor-pointer shrink-0"
                  aria-label="تصغير الخط"
                >
                  أ-
                </button>
                <input
                  type="range"
                  min={MUSHAF_MIN_FONT_SIZE}
                  max={MUSHAF_MAX_FONT_SIZE}
                  step={1}
                  value={fontSize}
                  onChange={(e) => handleSetFontSize(Number(e.target.value))}
                  aria-label="شريط تمرير حجم خط المصحف"
                  className="flex-1 min-w-0 h-1.5 accent-[#c5a059] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateFontSize(1)}
                  className="px-2 py-0.5 font-bold cursor-pointer shrink-0"
                  aria-label="تكبير الخط"
                >
                  أ+
                </button>
              </div>
            </div>
          </div>

          {/* Paper themes */}
          <div>
            <div className={`font-bold mb-1.5 ${surface.barMutedText}`}>لون ورق المصحف</div>
            <div className="grid grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'madani', label: 'المدينة', swatch: 'bg-[#faf6ee]' },
                  { id: 'ivory', label: 'عاجي', swatch: 'bg-[#fffef9]' },
                  { id: 'sepia', label: 'كلاسيكي', swatch: 'bg-[#f4ebd0]' },
                  { id: 'night', label: 'زمردي', swatch: 'bg-[#091510]' },
                  { id: 'darkBlack', label: 'أسود', swatch: 'bg-[#000000]' },
                ] as const
              ).map((themeItem) => (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => handleUpdateTheme(themeItem.id)}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border cursor-pointer ${
                    paperTheme === themeItem.id
                      ? 'border-[#c5a059] ring-1 ring-[#c5a059]'
                      : 'border-transparent hover:border-amber-500/40'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full border border-amber-600/50 ${themeItem.swatch}`} />
                  <span className="text-[10px] font-semibold whitespace-nowrap">{themeItem.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop dual page spread */}
          <div className="hidden md:flex items-center justify-between pt-1">
            <span className="font-bold">عرض صفحتين متقابلتين</span>
            <button
              type="button"
              onClick={() => setIsDualPage((d) => !d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold cursor-pointer ${
                isDualPage ? 'bg-[#c5a059] text-black border-[#c5a059]' : surface.buttonBg
              }`}
            >
              <Columns2 className="w-4 h-4" />
              <span>{isDualPage ? 'مفعّل' : 'صفحة واحدة'}</span>
            </button>
          </div>

          {/* Audio Reciter & Playback Controls */}
          <div className="space-y-2.5 pt-2 border-t border-amber-500/25">
            <div className="flex items-center justify-between gap-2">
              <span className={`font-bold flex items-center gap-1 ${surface.barMutedText}`}>
                <Volume2 className="w-3.5 h-3.5" />
                <span>القارئ</span>
              </span>
              <select
                value={selectedReciter}
                onChange={(e) => setSelectedReciter(e.target.value)}
                className={`flex-1 max-w-[230px] rounded-xl border px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer ${surface.buttonBg}`}
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id} className={isDarkPaper ? 'bg-slate-900 text-white' : 'bg-white text-black'}>
                    {r.nameArabic} ({r.styleArabic})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 0.75 : 1;
                  setPlaybackSpeed(next);
                  if (audioRef.current) audioRef.current.playbackRate = next;
                }}
                className={`px-2.5 py-1.5 rounded-xl border font-bold tabular-nums cursor-pointer ${surface.buttonBg}`}
              >
                السرعة {playbackSpeed}x
              </button>

              <button
                type="button"
                onClick={() => setRepeatAyah((r) => !r)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold cursor-pointer ${
                  repeatAyah ? 'bg-[#c5a059] text-black border-[#c5a059]' : surface.buttonBg
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>تكرار الآية</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoAdvancePageAudio((a) => !a)}
                className={`px-2.5 py-1.5 rounded-xl border font-bold cursor-pointer ${
                  autoAdvancePageAudio ? 'bg-emerald-600 text-white border-emerald-600' : surface.buttonBg
                }`}
              >
                {autoAdvancePageAudio ? 'انتقال تلقائي' : 'آية واحدة'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleBookmark(currentPage)}
              className={`flex-1 py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                isCurrentPageBookmarked ? 'bg-red-600/15 border-red-500/50 text-red-500' : surface.buttonBg
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{isCurrentPageBookmarked ? 'إزالة فاصل الصفحة' : 'وضع فاصل للصفحة'}</span>
            </button>

            {onSwitchToVersesMode && (
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  onSwitchToVersesMode();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>الآيات والتفسير</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Full-Viewport Mushaf Page Scroll Canvas */}
      <div
        className="relative flex-1 overflow-y-auto touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Floating Page Turn Feedback Badge */}
        {turnBadgeLabel && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[55] px-3.5 py-1 rounded-full bg-[#06241b]/90 border border-amber-400/50 text-amber-300 text-xs font-bold tabular-nums shadow-lg pointer-events-none">
            {turnBadgeLabel}
          </div>
        )}

        {/* Right Side Edge Touch Zone (الجانب الأيمن -> الصفحة السابقة في المصحف العربي RTL) */}
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          aria-label="الصفحة السابقة - لمس جانبي"
          title="المس الجانب الأيمن للعودة للصفحة السابقة"
          className="group fixed top-16 bottom-14 right-0 z-30 w-6 sm:w-14 flex items-center justify-center hover:bg-amber-500/10 active:bg-amber-500/20 disabled:opacity-0 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <span className="w-5 h-9 sm:w-10 sm:h-14 rounded-full bg-[#06241b]/65 sm:bg-[#06241b]/85 border border-amber-500/45 text-amber-300 shadow-lg flex items-center justify-center opacity-45 sm:opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all backdrop-blur-sm pointer-events-none">
            <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </span>
        </button>

        {/* Left Side Edge Touch Zone (الجانب الأيسر -> الصفحة التالية في المصحف العربي RTL) */}
        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage >= 604}
          aria-label="الصفحة التالية - لمس جانبي"
          title="المس الجانب الأيسر للانتقال للصفحة التالية"
          className="group fixed top-16 bottom-14 left-0 z-30 w-6 sm:w-14 flex items-center justify-center hover:bg-amber-500/10 active:bg-amber-500/20 disabled:opacity-0 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <span className="w-5 h-9 sm:w-10 sm:h-14 rounded-full bg-[#06241b]/65 sm:bg-[#06241b]/85 border border-amber-500/45 text-amber-300 shadow-lg flex items-center justify-center opacity-45 sm:opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all backdrop-blur-sm pointer-events-none">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </span>
        </button>

        <div className="min-h-full w-full flex flex-col items-center px-2 sm:px-14 md:px-16 py-2 sm:py-3">
          <div
            key={pageTurnAnimKey}
            className={`w-full flex-1 flex flex-col items-center ${
              pageTurnDir === 'next'
                ? 'animate-mushaf-next'
                : pageTurnDir === 'prev'
                ? 'animate-mushaf-prev'
                : ''
            }`}
          >
            {isDualPage && !focusedSurahNumber ? (
              <div className="w-full max-w-6xl flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch relative">
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/15 via-black/30 to-black/15 pointer-events-none z-20" />
                <div className="h-full">{renderPhysicalPage(displayedPageAyahs, currentPage, true)}</div>
                <div className="h-full">
                  {currentPage < 604 && renderPhysicalPage(leftPageAyahs, currentPage + 1, false)}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-4xl flex-1">
                {renderPhysicalPage(displayedPageAyahs, currentPage, true)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slim Bottom Page Turn & Quick-Jump Footer */}
      {!isFocusMode && (
        <footer
          className={`shrink-0 h-13 px-2.5 sm:px-6 border-t ${surface.barBg} ${surface.barBorder} ${surface.barText} backdrop-blur-md flex items-center justify-between gap-2 sm:gap-4 z-40`}
        >
          {/* Previous Page (Right side in RTL) */}
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 min-h-[38px] rounded-xl border text-xs font-bold disabled:opacity-30 whitespace-nowrap shrink-0 cursor-pointer ${surface.buttonBg}`}
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">السابقة</span>
          </button>

          {/* Center Slider + Editable Page Counter */}
          <div className="flex-1 flex items-center gap-2 sm:gap-3 max-w-xl mx-auto">
            <input
              type="range"
              aria-label="الانتقال السريع بين صفحات المصحف"
              min={1}
              max={604}
              value={currentPage}
              onChange={(e) => {
                onClearFocusSurah?.();
                setCurrentPage(parseInt(e.target.value, 10));
              }}
              className="flex-1 accent-[#c5a059] h-1.5 rounded-lg cursor-pointer"
            />
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold tabular-nums shrink-0 ${surface.buttonBg}`}>
              <input
                type="number"
                aria-label="رقم الصفحة"
                min={1}
                max={604}
                value={currentPage}
                onChange={(e) => {
                  const p = parseInt(e.target.value, 10);
                  if (p >= 1 && p <= 604) {
                    onClearFocusSurah?.();
                    setCurrentPage(p);
                  }
                }}
                className="w-9 bg-transparent text-center font-extrabold tabular-nums focus:outline-none border-b border-[#c5a059]/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="opacity-70">/ 604</span>
            </div>
          </div>

          {/* Next Page (Left side in RTL) */}
          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= 604}
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 min-h-[38px] rounded-xl border text-xs font-bold disabled:opacity-30 whitespace-nowrap shrink-0 cursor-pointer ${surface.buttonBg}`}
            title="الصفحة التالية"
          >
            <span className="hidden sm:inline">التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </footer>
      )}

      {/* Ayah Bottom Action Bar (when an Ayah is tapped) */}
      {selectedAyah && (
        <div className="fixed bottom-16 left-3 right-3 z-[55] max-w-3xl mx-auto p-3.5 rounded-2xl bg-[#06241b]/95 border-2 border-amber-400 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-amber-300">
              سورة {selectedAyah.surahNameArabic} - الآية {selectedAyah.numberInSurah}
            </h4>
            <p className="font-quran text-sm text-emerald-100 truncate">
              {selectedAyah.text}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => playAyahAudio(selectedAyah)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] transition-all cursor-pointer"
            >
              {isPlayingAudio && playingAyahKey === `${selectedAyah.surahNumber}_${selectedAyah.numberInSurah}` ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-black" />
                  <span>إيقاف</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>استماع</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowTafsirModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-emerald-700/50 text-xs text-emerald-200 hover:text-white transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>التفسير والترجمة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = `﴿${selectedAyah.text}﴾ [سورة ${selectedAyah.surahNameArabic}: ${selectedAyah.numberInSurah}] - عبر تطبيق نور القرآن`;
                navigator.clipboard.writeText(text);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="p-2 rounded-xl bg-black/40 text-emerald-300 hover:text-white cursor-pointer"
              title="نسخ الآية"
              aria-label="نسخ الآية"
            >
              {isCopied ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedAyah(null)}
              className="text-xs px-2 py-1 rounded text-slate-400 hover:text-white cursor-pointer"
              aria-label="إغلاق شريط الآية"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Unified Multi-Tafsir (Al-Muyassar, Ibn Kathir, Al-Saadi) & Multi-Language Translation Modal */}
      {showTafsirModal && selectedAyah && (
        <TafsirTranslationModal
          surahNumber={selectedAyah.surahNumber}
          surahNameArabic={selectedAyah.surahNameArabic}
          ayahNumberInSurah={selectedAyah.numberInSurah}
          ayahText={selectedAyah.text}
          initialMuyassar={selectedAyah.tafsir}
          initialTranslation={selectedAyah.translation}
          onClose={() => setShowTafsirModal(false)}
        />
      )}
    </div>
  );
};
