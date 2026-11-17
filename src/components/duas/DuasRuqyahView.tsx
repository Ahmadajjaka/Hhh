import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Download,
  Heart,
  Loader2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Search,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import {
  COMPREHENSIVE_WRITTEN_DUAS,
  DUAS_OCCASION_FILTERS,
  RUQYAH_AUDIO_TRACKS,
  RUQYAH_PROPHETIC_DUAS,
  RUQYAH_QURAN_SECTIONS,
  SHEIKH_DUAS,
  WRITTEN_DUA_CATEGORIES,
  WrittenDuaCategory,
  RuqyahAyahItem,
} from '../../data/duasAndRuqyahData';
import { RECITERS } from '../../data/quranMeta';
import {
  cacheAudioForOffline,
  getEveryAyahAudioUrl,
  getPlayableAudioSrc,
} from '../../utils/quranAudioAndTafsir';
import {
  downloadAudioBatch,
  getCachedAudioUrlsSet,
} from '../../utils/offlineStorage';
import {
  filterSheikhAudioTracks,
  formatAudioDuration,
  getNextSequentialAyahIndex,
  validateRuqyahQuranSections,
} from '../../utils/duasRuqyahHelpers';
import { normalizeArabicForSearch } from '../../utils/quranIntegrity';

export type DuasRuqyahTab = 'duas' | 'ruqyah' | 'ruqyah_text' | 'duas_text';

interface DuasRuqyahViewProps {
  initialTab?: DuasRuqyahTab;
  onOpenAdhkar?: () => void;
}

export const DuasRuqyahView: React.FC<DuasRuqyahViewProps> = ({
  initialTab = 'duas',
  onOpenAdhkar,
}) => {
  const [activeTab, setActiveTab] = useState<DuasRuqyahTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Search & Filter states for Audio Duas / Ruqyah Audio
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [occasionFilter, setOccasionFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_favorite_duas') || '["dua_alafasy_qunoot","ruqyah_alafasy"]');
    } catch {
      return ['dua_alafasy_qunoot', 'ruqyah_alafasy'];
    }
  });

  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_downloaded_duas') || '[]');
    } catch {
      return [];
    }
  });

  // Shared Audio Player state for Sheikh Duas & Audio Ruqyah
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    initialTab === 'ruqyah' ? RUQYAH_AUDIO_TRACKS[0].id : SHEIKH_DUAS[0].id
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  // Interactive Quranic Ruqyah verse-by-verse player state
  const [selectedQariId, setSelectedQariId] = useState<string>(RECITERS[2]?.id || RECITERS[0].id);
  const [activeAyahFlatIndex, setActiveAyahFlatIndex] = useState<number | null>(null);
  const [isPlayingRuqyahVerses, setIsPlayingRuqyahVerses] = useState<boolean>(false);
  const [repeatSingleAyah, setRepeatSingleAyah] = useState<boolean>(false);

  // Prophetic Ruqyah Duas interactive counter & copy state
  const [propheticCounts, setPropheticCounts] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_ruqyah_prophetic_counts') || '{}');
    } catch {
      return {};
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Batch download & written offline Duas encyclopedia states
  const [batchDownloading, setBatchDownloading] = useState<boolean>(false);
  const [batchProgressText, setBatchProgressText] = useState<string | null>(null);
  const [batchPercent, setBatchPercent] = useState<number>(0);
  const batchAbortRef = useRef<AbortController | null>(null);

  const [writtenCategory, setWrittenCategory] = useState<WrittenDuaCategory>('all');
  const [writtenSearch, setWrittenSearch] = useState<string>('');
  const [writtenFavOnly, setWrittenFavOnly] = useState<boolean>(false);
  const [writtenFavIds, setWrittenFavIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_written_dua_favs') || '[]');
    } catch {
      return [];
    }
  });
  const [writtenCounts, setWrittenCounts] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_written_dua_counts') || '{}');
    } catch {
      return {};
    }
  });
  const [ruqyahVersesCachedForQari, setRuqyahVersesCachedForQari] = useState<boolean>(false);
  const [downloadingRuqyahVerses, setDownloadingRuqyahVerses] = useState<boolean>(false);

  const trackAudioRef = useRef<HTMLAudioElement | null>(null);
  const verseAudioRef = useRef<HTMLAudioElement | null>(null);

  // Build flat list of all Ruqyah Ayahs for sequential recitation
  const flatRuqyahAyahs = useMemo<RuqyahAyahItem[]>(
    () => RUQYAH_QURAN_SECTIONS.flatMap((sec) => sec.ayahs),
    []
  );

  const ruqyahIntegrity = useMemo(
    () => validateRuqyahQuranSections(RUQYAH_QURAN_SECTIONS),
    []
  );

  // Combine searchable audio list depending on active tab ('duas' or 'ruqyah')
  const allTrackPool = useMemo(
    () => [...SHEIKH_DUAS, ...RUQYAH_AUDIO_TRACKS],
    []
  );

  const currentTabTracks = useMemo(() => {
    if (activeTab === 'ruqyah') {
      return filterSheikhAudioTracks(
        RUQYAH_AUDIO_TRACKS,
        searchQuery,
        'all',
        favoritesOnly,
        favoriteIds
      );
    }
    return filterSheikhAudioTracks(
      SHEIKH_DUAS,
      searchQuery,
      occasionFilter,
      favoritesOnly,
      favoriteIds
    );
  }, [activeTab, searchQuery, occasionFilter, favoritesOnly, favoriteIds]);

  const activeTrack = useMemo(
    () => allTrackPool.find((t) => t.id === selectedTrackId) || SHEIKH_DUAS[0],
    [allTrackPool, selectedTrackId]
  );

  // Sync default selected track when switching between 'duas' and 'ruqyah' tabs if nothing is playing
  const handleSwitchTab = (tab: DuasRuqyahTab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setOccasionFilter('all');
    if (tab === 'ruqyah' && !isPlaying && !RUQYAH_AUDIO_TRACKS.some((r) => r.id === selectedTrackId)) {
      setSelectedTrackId(RUQYAH_AUDIO_TRACKS[0].id);
    } else if (tab === 'duas' && !isPlaying && !SHEIKH_DUAS.some((d) => d.id === selectedTrackId)) {
      setSelectedTrackId(SHEIKH_DUAS[0].id);
    }
  };

  // Stop verse-by-verse audio if user plays a full Sheikh MP3, and vice versa
  const stopVerseAudio = () => {
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
    }
    setIsPlayingRuqyahVerses(false);
    setActiveAyahFlatIndex(null);
  };

  const stopTrackAudio = () => {
    if (trackAudioRef.current) {
      trackAudioRef.current.pause();
    }
    setIsPlaying(false);
    setIsBuffering(false);
  };

  // Main Track Audio Loader & Playback Effect
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isRepeatRef = useRef(isRepeat);
  isRepeatRef.current = isRepeat;
  const speedRef = useRef(playbackSpeed);
  speedRef.current = playbackSpeed;
  const tabTracksRef = useRef(currentTabTracks);
  tabTracksRef.current = currentTabTracks;

  useEffect(() => {
    if (!trackAudioRef.current) {
      trackAudioRef.current = new Audio();
    }
    const audio = trackAudioRef.current;
    let cancelled = false;
    let blobUrl: string | null = null;

    setAudioError(null);
    setCurrentTime(0);
    setDuration(0);

    const loadSrc = async () => {
      const playable = await getPlayableAudioSrc(activeTrack.audioUrl);
      if (cancelled) {
        if (playable.startsWith('blob:')) URL.revokeObjectURL(playable);
        return;
      }
      if (playable.startsWith('blob:')) {
        blobUrl = playable;
      }
      audio.src = playable;
      audio.playbackRate = speedRef.current;
      if (isPlayingRef.current) {
        setIsBuffering(true);
        audio.play()
          .then(() => {
            if (!cancelled) setIsBuffering(false);
          })
          .catch(() => {
            if (!cancelled) {
              setIsBuffering(false);
              setIsPlaying(false);
              setAudioError('تعذر تشغيل هذا المقطع الصوتي حالياً. يرجى التحقق من الاتصال والمحاولة مجدداً.');
            }
          });
      }
    };

    loadSrc();

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => {
      if (isRepeatRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      const list = tabTracksRef.current;
      const idx = list.findIndex((item) => item.id === activeTrack.id);
      if (idx !== -1 && idx + 1 < list.length) {
        setSelectedTrackId(list[idx + 1].id);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    };
    const onError = () => {
      if (!cancelled && isPlayingRef.current) {
        setIsBuffering(false);
        setIsPlaying(false);
        setAudioError('تعذر تحميل الملف الصوتي. تأكد من الاتصال بالإنترنت أو جرّب شيخاً آخر.');
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      cancelled = true;
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [activeTrack.id, activeTrack.audioUrl]);

  useEffect(() => {
    if (trackAudioRef.current) {
      trackAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync downloadedIds directly with Cache API truth on mount ("once downloaded, always cached")
  useEffect(() => {
    let cancelled = false;
    const allTracks = [...SHEIKH_DUAS, ...RUQYAH_AUDIO_TRACKS];
    getCachedAudioUrlsSet(allTracks.map((t) => t.audioUrl)).then((cachedUrls) => {
      if (cancelled) return;
      const realIds = allTracks.filter((t) => cachedUrls.has(t.audioUrl)).map((t) => t.id);
      if (realIds.length > 0) {
        setDownloadedIds(realIds);
        try {
          localStorage.setItem('noor_downloaded_duas', JSON.stringify(realIds));
        } catch {}
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Check whether all Ruqyah Quranic verses are cached for selected Qari
  useEffect(() => {
    let cancelled = false;
    const urls = flatRuqyahAyahs.map((a) =>
      getEveryAyahAudioUrl(selectedQariId, a.surahNumber, a.ayahNumber)
    );
    getCachedAudioUrlsSet(urls).then((set) => {
      if (!cancelled) {
        setRuqyahVersesCachedForQari(urls.length > 0 && set.size >= urls.length);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedQariId, flatRuqyahAyahs]);

  // Cleanup both audio elements and active batch downloads on unmount
  useEffect(() => {
    return () => {
      batchAbortRef.current?.abort();
      trackAudioRef.current?.pause();
      verseAudioRef.current?.pause();
    };
  }, []);

  const handleTogglePlayTrack = (trackId?: string) => {
    stopVerseAudio();
    const targetId = trackId || activeTrack.id;

    if (targetId !== activeTrack.id) {
      setSelectedTrackId(targetId);
      setIsPlaying(true);
      return;
    }

    const audio = trackAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      setAudioError(null);
      setIsBuffering(true);
      audio.playbackRate = playbackSpeed;
      audio.play()
        .then(() => {
          setIsBuffering(false);
          setIsPlaying(true);
        })
        .catch(() => {
          setIsBuffering(false);
          setIsPlaying(false);
          setAudioError('اضغط تشغيل مرة أخرى للسماح بالصوت أو تحقق من الاتصال.');
        });
    }
  };

  const handleStepTrack = (direction: 'next' | 'prev') => {
    const list = currentTabTracks.length > 0 ? currentTabTracks : allTrackPool;
    const idx = list.findIndex((t) => t.id === activeTrack.id);
    if (list.length === 0) return;
    const nextIdx =
      direction === 'next'
        ? (idx + 1) % list.length
        : (idx - 1 + list.length) % list.length;
    stopVerseAudio();
    setSelectedTrackId(list[nextIdx].id);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (trackAudioRef.current && Number.isFinite(val)) {
      trackAudioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleFavorite = (id: string) => {
    const updated = favoriteIds.includes(id)
      ? favoriteIds.filter((x) => x !== id)
      : [...favoriteIds, id];
    setFavoriteIds(updated);
    try {
      localStorage.setItem('noor_favorite_duas', JSON.stringify(updated));
    } catch {}
  };

  const handleCacheOffline = async (id: string, audioUrl: string, titleArabic: string) => {
    setDownloadingId(id);
    setDownloadMessage(null);
    const ok = await cacheAudioForOffline(audioUrl);
    setDownloadingId(null);
    if (ok) {
      const updated = Array.from(new Set([...downloadedIds, id]));
      setDownloadedIds(updated);
      try {
        localStorage.setItem('noor_downloaded_duas', JSON.stringify(updated));
      } catch {}
      setDownloadMessage(`تم حفظ «${titleArabic}» للاستماع دون إنترنت.`);
    } else {
      setDownloadMessage('تعذر تنزيل الملف للتخزين المحلي الآن؛ يمكنك الاستماع عبر الإنترنت.');
    }
  };

  const handleBatchCacheTabTracks = async () => {
    if (batchDownloading) return;
    const pool = activeTab === 'ruqyah' ? RUQYAH_AUDIO_TRACKS : SHEIKH_DUAS;
    const ctrl = new AbortController();
    batchAbortRef.current = ctrl;
    setBatchDownloading(true);
    setBatchPercent(5);
    setBatchProgressText(
      activeTab === 'ruqyah'
        ? 'جاري حفظ جميع تلاوات الرقية الشرعية للعمل بلا إنترنت...'
        : 'جاري حفظ جميع الأدعية الصوتية للعمل بلا إنترنت...'
    );

    const res = await downloadAudioBatch(
      pool.map((t) => ({
        id: t.id,
        label: `${t.titleArabic} (${t.sheikhNameArabic})`,
        url: t.audioUrl,
      })),
      (p) => {
        const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 100;
        setBatchPercent(Math.max(5, pct));
        if (p.currentLabel) {
          setBatchProgressText(`جاري الحفظ (${p.completed + 1}/${p.total}): ${p.currentLabel}`);
        }
      },
      ctrl.signal
    );

    const updated = Array.from(new Set([...downloadedIds, ...res.cachedIds]));
    setDownloadedIds(updated);
    try {
      localStorage.setItem('noor_downloaded_duas', JSON.stringify(updated));
    } catch {}
    setBatchDownloading(false);
    setBatchPercent(100);
    setBatchProgressText(
      ctrl.signal.aborted
        ? 'تم إيقاف التنزيل — الملفات التي اكتملت محفوظة دائماً بدون نت.'
        : res.failedIds.length === 0
        ? `تم حفظ جميع المقاطع (${pool.length}/${pool.length}) — متاحة الآن بلا إنترنت دائماً ✓`
        : `تم حفظ ${res.cachedIds.length} من ${pool.length} مقطعاً بنجاح.`
    );
  };

  const handleCacheAllRuqyahVerses = async () => {
    if (downloadingRuqyahVerses) return;
    setDownloadingRuqyahVerses(true);
    const items = flatRuqyahAyahs.map((a, i) => ({
      id: `${a.surahNumber}:${a.ayahNumber}:${i}`,
      label: `سورة ${a.surahNameArabic} - الآية ${a.ayahNumber}`,
      url: getEveryAyahAudioUrl(selectedQariId, a.surahNumber, a.ayahNumber),
    }));
    const res = await downloadAudioBatch(items);
    setDownloadingRuqyahVerses(false);
    setRuqyahVersesCachedForQari(res.failedIds.length === 0);
  };

  const filteredWrittenDuas = useMemo(() => {
    const q = normalizeArabicForSearch(writtenSearch);
    return COMPREHENSIVE_WRITTEN_DUAS.filter((d) => {
      if (writtenCategory !== 'all' && d.categoryId !== writtenCategory) return false;
      if (writtenFavOnly && !writtenFavIds.includes(d.id)) return false;
      if (q) {
        const hay = normalizeArabicForSearch(`${d.titleArabic} ${d.text} ${d.categoryArabic} ${d.benefitArabic}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [writtenCategory, writtenSearch, writtenFavOnly, writtenFavIds]);

  const toggleWrittenFavorite = (id: string) => {
    const updated = writtenFavIds.includes(id)
      ? writtenFavIds.filter((x) => x !== id)
      : [...writtenFavIds, id];
    setWrittenFavIds(updated);
    try {
      localStorage.setItem('noor_written_dua_favs', JSON.stringify(updated));
    } catch {}
  };

  const handleIncrementWritten = (id: string, maxCount: number) => {
    const cur = writtenCounts[id] || 0;
    const next = Math.min(maxCount, cur + 1);
    const updated = { ...writtenCounts, [id]: next };
    setWrittenCounts(updated);
    try {
      localStorage.setItem('noor_written_dua_counts', JSON.stringify(updated));
    } catch {}
  };

  // Sequential Verse-by-Verse Ruqyah Playback (with Cache API offline playback)
  const repeatSingleAyahRef = useRef(repeatSingleAyah);
  repeatSingleAyahRef.current = repeatSingleAyah;
  const selectedQariRef = useRef(selectedQariId);
  selectedQariRef.current = selectedQariId;

  const playRuqyahAyahAtIndex = async (flatIdx: number) => {
    const item = flatRuqyahAyahs[flatIdx];
    if (!item) {
      setIsPlayingRuqyahVerses(false);
      setActiveAyahFlatIndex(null);
      return;
    }

    stopTrackAudio();
    if (!verseAudioRef.current) {
      verseAudioRef.current = new Audio();
    }
    const audio = verseAudioRef.current;
    const rawUrl = getEveryAyahAudioUrl(selectedQariRef.current, item.surahNumber, item.ayahNumber);
    const playable = await getPlayableAudioSrc(rawUrl);

    audio.src = playable;
    audio.playbackRate = 1;
    setActiveAyahFlatIndex(flatIdx);
    setIsPlayingRuqyahVerses(true);

    audio.onended = () => {
      if (playable.startsWith('blob:')) URL.revokeObjectURL(playable);
      const nextIdx = getNextSequentialAyahIndex(
        flatIdx,
        flatRuqyahAyahs.length,
        repeatSingleAyahRef.current
      );
      if (nextIdx !== null) {
        playRuqyahAyahAtIndex(nextIdx);
      } else {
        setIsPlayingRuqyahVerses(false);
        setActiveAyahFlatIndex(null);
      }
    };

    audio
      .play()
      .then(() => {
        cacheAudioForOffline(rawUrl).catch(() => {});
      })
      .catch(() => {
        setIsPlayingRuqyahVerses(false);
      });
  };

  const handleToggleAllRuqyahVerses = () => {
    if (isPlayingRuqyahVerses) {
      stopVerseAudio();
    } else {
      playRuqyahAyahAtIndex(activeAyahFlatIndex ?? 0);
    }
  };

  const handleIncrementProphetic = (id: string, maxCount: number) => {
    const cur = propheticCounts[id] || 0;
    const next = Math.min(maxCount, cur + 1);
    const updated = { ...propheticCounts, [id]: next };
    setPropheticCounts(updated);
    try {
      localStorage.setItem('noor_ruqyah_prophetic_counts', JSON.stringify(updated));
    } catch {}
  };

  const handleResetProphetic = () => {
    setPropheticCounts({});
    try {
      localStorage.setItem('noor_ruqyah_prophetic_counts', '{}');
    } catch {}
  };

  const handleCopyText = (id: string, text: string, source: string) => {
    const payload = `${text}\n(${source})\nتطبيق نور القرآن`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper metadata for active track
  const activeMetaLabel =
    'categoryArabic' in activeTrack
      ? activeTrack.categoryArabic
      : activeTrack.focusArabic;

  // Map (surah, ayah) to flat index for quick lookup while rendering sections
  let runningFlatIndex = 0;

  return (
    <div className="w-full max-w-6xl mx-auto pb-28 px-4 space-y-6">
      {/* Header & Top Sanctuary Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-amber-300 font-arabic-serif">
            الأدعية الصوتية والرقية الشرعية
          </h2>
          <p className="text-xs md:text-sm text-emerald-200/80 mt-1 max-w-2xl">
            أدعية خاشعة ومختارات القنوت وختم القرآن بأصوات كبار الشيوخ، مع الرقية الشرعية الصوتية الكاملة وآيات التحصين بالرسم العثماني الموثق.
          </p>
        </div>

        {onOpenAdhkar && (
          <button
            type="button"
            onClick={onOpenAdhkar}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/50 text-xs font-semibold text-emerald-200 hover:text-amber-300 hover:border-amber-500/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            الانتقال إلى أذكار حصن المسلم
          </button>
        )}
      </div>

      {/* Primary 4-Tab Segmented Navigation */}
      <div
        role="tablist"
        aria-label="أقسام الأدعية والرقية الشرعية"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[#041d14] border border-emerald-800/40"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'duas'}
          onClick={() => handleSwitchTab('duas')}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'duas'
              ? 'bg-[#c5a059] text-black shadow-md'
              : 'text-emerald-200 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>أدعية صوتية ({SHEIKH_DUAS.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'duas_text'}
          onClick={() => handleSwitchTab('duas_text')}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'duas_text'
              ? 'bg-[#c5a059] text-black shadow-md'
              : 'text-emerald-200 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <Heart className="w-4 h-4 shrink-0" />
          <span>الدعاء بلا نت ({COMPREHENSIVE_WRITTEN_DUAS.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ruqyah'}
          onClick={() => handleSwitchTab('ruqyah')}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'ruqyah'
              ? 'bg-[#c5a059] text-black shadow-md'
              : 'text-emerald-200 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>الرقية الصوتية ({RUQYAH_AUDIO_TRACKS.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ruqyah_text'}
          onClick={() => handleSwitchTab('ruqyah_text')}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'ruqyah_text'
              ? 'bg-[#c5a059] text-black shadow-md'
              : 'text-emerald-200 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>آيات الرقية المكتوبة</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1 & TAB 2: AUDIO PLAYER STUDIO + SHEIKH LIST                     */}
      {/* =================================================================== */}
      {(activeTab === 'duas' || activeTab === 'ruqyah') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/First Column: Dedicated Audio Studio Player */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 rounded-3xl p-6 bg-gradient-to-b from-[#072e21] to-[#041912] border border-amber-500/35 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/90 font-medium">
                  <span>{activeTrack.sheikhNameArabic}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeMetaLabel}</span>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-white mt-1.5 leading-snug">
                  {activeTrack.titleArabic}
                </h3>
                <p className="text-xs text-emerald-200/75 mt-1.5 leading-relaxed">
                  {activeTrack.descriptionArabic}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleFavorite(activeTrack.id)}
                aria-label={favoriteIds.includes(activeTrack.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-black/30 border border-emerald-800/40 flex items-center justify-center text-amber-400 hover:border-amber-400/50 transition-colors cursor-pointer shrink-0"
              >
                <Heart
                  className={`w-5 h-5 ${
                    favoriteIds.includes(activeTrack.id) ? 'fill-amber-400 text-amber-400' : 'text-emerald-300/70'
                  }`}
                />
              </button>
            </div>

            {/* Progress Slider & Tabular Time */}
            <div>
              <input
                type="range"
                aria-label="موضع التقدم في المقطع الصوتي"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-amber-400 bg-emerald-950 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-emerald-300/80 mt-2 tabular-nums">
                <span>{formatAudioDuration(currentTime)}</span>
                <span>
                  {duration > 0 ? formatAudioDuration(duration) : activeTrack.durationLabel}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleStepTrack('prev')}
                aria-label="المقطع السابق"
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-black/30 border border-emerald-800/40 flex items-center justify-center text-emerald-200 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => handleTogglePlayTrack()}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#c5a059] to-amber-300 text-black flex items-center justify-center shadow-xl shadow-amber-900/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                {isBuffering ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 fill-black" />
                ) : (
                  <Play className="w-7 h-7 fill-black mr-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleStepTrack('next')}
                aria-label="المقطع التالي"
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-black/30 border border-emerald-800/40 flex items-center justify-center text-emerald-200 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <SkipBack className="w-5 h-5" />
              </button>
            </div>

            {/* Secondary Controls: Speed, Repeat, Offline Save */}
            <div className="pt-4 border-t border-emerald-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 0.75 : 1;
                    setPlaybackSpeed(next);
                  }}
                  className="min-h-[40px] px-3 rounded-xl bg-black/30 border border-emerald-800/40 text-amber-300 font-bold tabular-nums whitespace-nowrap cursor-pointer"
                >
                  السرعة {playbackSpeed}x
                </button>

                <button
                  type="button"
                  onClick={() => setIsRepeat((r) => !r)}
                  className={`min-h-[40px] px-3 rounded-xl border flex items-center gap-1.5 font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isRepeat
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-black/30 border-emerald-800/40 text-emerald-200 hover:text-white'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>تكرار</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCacheOffline(activeTrack.id, activeTrack.audioUrl, activeTrack.titleArabic)
                }
                disabled={downloadingId === activeTrack.id}
                className={`min-h-[40px] px-3.5 rounded-xl border flex items-center gap-1.5 font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  downloadedIds.includes(activeTrack.id)
                    ? 'bg-emerald-800/40 border-emerald-600/50 text-emerald-200'
                    : 'bg-[#c5a059] border-[#c5a059] text-black hover:bg-[#d8b368]'
                }`}
              >
                {downloadingId === activeTrack.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : downloadedIds.includes(activeTrack.id) ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>محفوظ أوفلاين</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>حفظ للاستماع بدون نت</span>
                  </>
                )}
              </button>
            </div>

            {audioError && (
              <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-700/40 rounded-xl p-3">
                {audioError}
              </p>
            )}

            {downloadMessage && (
              <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                {downloadMessage}
              </p>
            )}
          </div>

          {/* Right/Second Column: Offline Batch Bar, Search, Filters & Track List */}
          <div className="lg:col-span-7 space-y-4">
            {/* One-Time Batch Offline Download Bar */}
            {(() => {
              const tabPool = activeTab === 'ruqyah' ? RUQYAH_AUDIO_TRACKS : SHEIKH_DUAS;
              const cachedInTab = tabPool.filter((t) => downloadedIds.includes(t.id)).length;
              const allTabCached = cachedInTab >= tabPool.length;
              return (
                <div className="p-4 rounded-2xl bg-[#041d14] border border-amber-500/35 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-amber-300">
                        {activeTab === 'ruqyah'
                          ? `تحميل الرقية الصوتية بلا إنترنت (${cachedInTab}/${tabPool.length})`
                          : `تحميل الأدعية الصوتية بلا إنترنت (${cachedInTab}/${tabPool.length})`}
                      </h4>
                      <p className="text-[11px] text-emerald-200/75 mt-0.5">
                        حمّلها لمرة واحدة فقط لتعمل معك دائماً في أي وقت دون اتصال بالإنترنت
                      </p>
                    </div>

                    {batchDownloading ? (
                      <button
                        type="button"
                        onClick={() => batchAbortRef.current?.abort()}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>إيقاف التحميل</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBatchCacheTabTracks}
                        disabled={allTabCached}
                        className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          allTabCached
                            ? 'bg-emerald-800/40 border border-emerald-600/50 text-emerald-200'
                            : 'bg-[#c5a059] text-black hover:bg-[#d8b368]'
                        }`}
                      >
                        {allTabCached ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>الكل محفوظ دائماً ✓</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>تحميل الكل مرة واحدة</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {(batchDownloading || batchProgressText) && (
                    <div className="space-y-1">
                      {batchDownloading && (
                        <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full bg-[#c5a059] transition-all duration-300"
                            style={{ width: `${batchPercent}%` }}
                          />
                        </div>
                      )}
                      {batchProgressText && (
                        <p className="text-[11px] text-amber-200">{batchProgressText}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Search & Favorites Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-300/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'duas'
                      ? 'ابحث باسم الشيخ أو نوع الدعاء (مثل: السديس، قنوت، ختم)...'
                      : 'ابحث باسم الشيخ للرقية الشرعية (مثل: العفاسي، المعيقلي)...'
                  }
                  className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-xl bg-[#041d14] border border-emerald-800/50 text-xs md:text-sm text-white placeholder:text-emerald-300/50 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setFavoritesOnly((f) => !f)}
                className={`min-h-[44px] px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  favoritesOnly
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-[#041d14] border-emerald-800/50 text-emerald-200 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400' : ''}`} />
                <span>المفضلة فقط</span>
              </button>
            </div>

            {/* Occasion Filter Buttons (for Duas tab) */}
            {activeTab === 'duas' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {DUAS_OCCASION_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOccasionFilter(f.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                      occasionFilter === f.id
                        ? 'bg-[#c5a059] text-black border-[#c5a059] font-bold'
                        : 'bg-[#06241b]/70 text-emerald-200 border-emerald-800/40 hover:text-white'
                    }`}
                  >
                    {f.labelArabic}
                  </button>
                ))}
              </div>
            )}

            {/* Tracks List */}
            {currentTabTracks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#041d14] border border-emerald-800/40 text-center space-y-2">
                <p className="text-sm font-bold text-amber-200">لا توجد نتائج مطابقة لبحثك</p>
                <p className="text-xs text-emerald-300/70">
                  جرّب مسح نص البحث أو عرض جميع التسجيلات المتاحة.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentTabTracks.map((track) => {
                  const isSelected = track.id === activeTrack.id;
                  const isTrackPlaying = isSelected && isPlaying;
                  const metaCategory =
                    'categoryArabic' in track ? track.categoryArabic : track.focusArabic;
                  const isCached = downloadedIds.includes(track.id);
                  const isFav = favoriteIds.includes(track.id);

                  return (
                    <div
                      key={track.id}
                      className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#0a3627] border-amber-400/70 shadow-lg'
                          : 'bg-[#06241b]/80 border-emerald-800/40 hover:border-amber-500/35'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm md:text-base font-bold text-white leading-snug">
                          {track.titleArabic}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/90 tabular-nums">
                          <span>{track.sheikhNameArabic}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-200/80">{metaCategory}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-300/70">{track.durationLabel}</span>
                          {isCached && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-300">محفوظ دون إنترنت</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-emerald-200/70 leading-relaxed">
                          {track.descriptionArabic}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCacheOffline(track.id, track.audioUrl, track.titleArabic)}
                          disabled={downloadingId === track.id || isCached}
                          aria-label={isCached ? 'محفوظ دون إنترنت' : `تحميل ${track.titleArabic} دون إنترنت`}
                          title={isCached ? 'محفوظ دائماً بلا إنترنت' : 'تحميل لمرة واحدة ثم بلا إنترنت دائماً'}
                          className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                            isCached
                              ? 'bg-emerald-800/40 border-emerald-600/50 text-emerald-200 cursor-default'
                              : 'bg-black/30 border-emerald-800/50 text-amber-300 hover:border-amber-400'
                          }`}
                        >
                          {downloadingId === track.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isCached ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span className="hidden sm:inline">محفوظ</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">تحميل</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(track.id)}
                          aria-label={`تفضيل ${track.titleArabic}`}
                          className="min-h-[44px] min-w-[44px] rounded-xl bg-black/30 border border-emerald-800/40 flex items-center justify-center text-emerald-300/70 hover:text-amber-300 cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePlayTrack(track.id)}
                          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                            isTrackPlaying
                              ? 'bg-amber-400 text-black'
                              : 'bg-[#c5a059] text-black hover:bg-[#d8b368]'
                          }`}
                        >
                          {isTrackPlaying ? (
                            <>
                              <Pause className="w-4 h-4 fill-black" />
                              <span>إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-black" />
                              <span>استماع</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: AUTHENTIC QURANIC & PROPHETIC RUQYAH SHAR'IYAH TEXT + AUDIO   */}
      {/* =================================================================== */}
      {activeTab === 'ruqyah_text' && (
        <div className="space-y-6">
          {/* Interactive Sequential Ruqyah Quranic Player Toolbar */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#072e21] via-[#0a3c2c] to-[#072e21] border border-amber-500/35 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c5a059]" />
                <span>الرقية الشرعية بالآيات القرآنية (مقروءة ومسموعة آية بآية)</span>
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                آيات الرقية الكاملة بالرسم العثماني المعتمد ({ruqyahIntegrity.totalAyahs} آية) · اختر القارئ واستمع متصلاً أو انقر على أي آية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="اختيار القارئ لتلاوة آيات الرقية"
                value={selectedQariId}
                onChange={(e) => {
                  setSelectedQariId(e.target.value);
                  if (isPlayingRuqyahVerses && activeAyahFlatIndex !== null) {
                    setTimeout(() => playRuqyahAyahAtIndex(activeAyahFlatIndex), 40);
                  }
                }}
                className="min-h-[44px] bg-black/50 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none cursor-pointer"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.nameArabic}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setRepeatSingleAyah((r) => !r)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  repeatSingleAyah
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-black/40 border-emerald-800/50 text-emerald-200'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>تكرار الآية</span>
              </button>

              <button
                type="button"
                onClick={handleCacheAllRuqyahVerses}
                disabled={downloadingRuqyahVerses || ruqyahVersesCachedForQari}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  ruqyahVersesCachedForQari
                    ? 'bg-emerald-800/40 border-emerald-600/50 text-emerald-200'
                    : 'bg-black/40 border-amber-500/50 text-amber-200 hover:bg-black/60'
                }`}
              >
                {downloadingRuqyahVerses ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري حفظ الآيات...</span>
                  </>
                ) : ruqyahVersesCachedForQari ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>الآيات محفوظة أوفلاين ✓</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>حفظ آيات الرقية أوفلاين</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleAllRuqyahVerses}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-amber-400 text-black font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-md hover:brightness-110 transition-all cursor-pointer"
              >
                {isPlayingRuqyahVerses ? (
                  <>
                    <Pause className="w-4 h-4 fill-black" />
                    <span>إيقاف تلاوة الآيات</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    <span>تشغيل آيات الرقية متصلة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {!ruqyahIntegrity.valid ? (
            <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-700/40 text-sm text-rose-200">
              {ruqyahIntegrity.reason}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Quranic Ruqyah Verses Column */}
              <div className="lg:col-span-7 space-y-5">
                {RUQYAH_QURAN_SECTIONS.map((sec) => {
                  const sectionStartIdx = runningFlatIndex;
                  runningFlatIndex += sec.ayahs.length;

                  return (
                    <section
                      key={sec.id}
                      className="p-5 md:p-6 rounded-3xl bg-[#06241b]/90 border border-amber-500/25 space-y-4"
                    >
                      <div className="pb-3 border-b border-emerald-800/40">
                        <h4 className="text-base font-bold text-amber-300">{sec.titleArabic}</h4>
                        <p className="text-xs text-emerald-200/75 mt-1">{sec.benefitArabic}</p>
                      </div>

                      {sec.showBasmalahHeader && (
                        <p className="font-quran text-lg md:text-xl text-amber-100 text-center py-1">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </p>
                      )}

                      <div className="space-y-3">
                        {sec.ayahs.map((ayah, idx) => {
                          const flatIdx = sectionStartIdx + idx;
                          const isCurrent = isPlayingRuqyahVerses && activeAyahFlatIndex === flatIdx;

                          return (
                            <div
                              key={`${ayah.surahNumber}:${ayah.ayahNumber}`}
                              className={`p-4 rounded-2xl border transition-colors ${
                                isCurrent
                                  ? 'bg-amber-500/20 border-amber-400 shadow-md'
                                  : 'bg-black/25 border-emerald-800/35 hover:border-amber-500/35'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-emerald-800/25 text-xs">
                                <span className="text-amber-300/90 font-semibold tabular-nums">
                                  سورة {ayah.surahNameArabic} · الآية {ayah.ayahNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    isCurrent ? stopVerseAudio() : playRuqyahAyahAtIndex(flatIdx)
                                  }
                                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    isCurrent
                                      ? 'bg-amber-400 text-black'
                                      : 'bg-emerald-950/70 border border-emerald-700/40 text-amber-200 hover:text-white'
                                  }`}
                                >
                                  {isCurrent ? (
                                    <>
                                      <Pause className="w-3.5 h-3.5" />
                                      <span>إيقاف</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5" />
                                      <span>استماع</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <p className="font-quran text-xl md:text-2xl text-emerald-50 leading-[2.3] text-right select-text">
                                {ayah.text}{' '}
                                <span className="text-amber-400 font-bold text-lg mx-1 tabular-nums">
                                  ﴿{ayah.ayahNumber}﴾
                                </span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* Prophetic Sunnah Ruqyah Duas Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between gap-2 p-4 rounded-2xl bg-[#041d14] border border-emerald-800/40">
                  <div>
                    <h4 className="text-base font-bold text-amber-300">أدعية الرقية من السنة النبوية</h4>
                    <p className="text-xs text-emerald-300/70 mt-0.5">
                      أدعية صحيحة للتحصين والشفاء مع عداد التكرار المأثور
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetProphetic}
                    aria-label="تصفير عدادات أدعية الرقية"
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 hover:bg-rose-900/40 text-xs flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تصفير</span>
                  </button>
                </div>

                {RUQYAH_PROPHETIC_DUAS.map((dua) => {
                  const count = propheticCounts[dua.id] || 0;
                  const done = count >= dua.repeatCount;

                  return (
                    <div
                      key={dua.id}
                      className={`p-5 rounded-3xl border transition-colors space-y-3 ${
                        done
                          ? 'bg-[#082a1f]/60 border-emerald-500/50'
                          : 'bg-[#06241b]/85 border-emerald-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-sm font-bold text-amber-300">{dua.titleArabic}</h5>
                          <p className="text-[11px] text-emerald-300/70 mt-0.5">{dua.reference}</p>
                        </div>
                      </div>

                      <p className="font-arabic-serif text-lg md:text-xl text-white leading-loose select-text">
                        {dua.text}
                      </p>

                      <p className="text-xs text-emerald-200/75 leading-relaxed">
                        {dua.instructionArabic}
                      </p>

                      <div className="pt-3 border-t border-emerald-800/30 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(dua.id, dua.text, dua.reference)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-black/30 border border-emerald-800/40 text-xs text-emerald-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedId === dua.id ? 'تم النسخ ✓' : 'نسخ'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={done}
                          onClick={() => handleIncrementProphetic(dua.id, dua.repeatCount)}
                          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 tabular-nums transition-colors cursor-pointer ${
                            done
                              ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40 cursor-default'
                              : 'bg-[#c5a059] text-black hover:bg-[#d8b368]'
                          }`}
                        >
                          {done ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>اكتمل ({dua.repeatCount})</span>
                            </>
                          ) : (
                            <>
                              <span>اضغط للتكرار</span>
                              <span className="px-2 py-0.5 rounded bg-black/20 font-extrabold">
                                {count} / {dua.repeatCount}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: COMPREHENSIVE OFFLINE WRITTEN DUAS ENCYCLOPEDIA               */}
      {/* =================================================================== */}
      {activeTab === 'duas_text' && (
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#072e21] via-[#0a3c2c] to-[#072e21] border border-amber-500/35 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-amber-300 flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-400" />
                <span>موسوعة الدعاء المأثور — متاحة دائماً بلا إنترنت</span>
              </h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                جوامع الأدعية النبوية والقرآنية الصحيحة مدمجة داخل التطبيق وتعمل دائماً دون الحاجة لأي اتصال بالإنترنت ({COMPREHENSIVE_WRITTEN_DUAS.length} دعاءً جامعاً).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setWrittenCounts({});
                try {
                  localStorage.setItem('noor_written_dua_counts', '{}');
                } catch {}
              }}
              className="self-start md:self-auto min-h-[40px] px-3.5 py-2 rounded-xl bg-black/35 border border-emerald-700/50 text-xs font-bold text-emerald-200 hover:text-white flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير العدادات</span>
            </button>
          </div>

          {/* Search & Favorites Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-300/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={writtenSearch}
                onChange={(e) => setWrittenSearch(e.target.value)}
                placeholder="ابحث في الأدعية المأثورة (مثل: الكرب، الرزق، الوالدين، الاستغفار)..."
                className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-xl bg-[#041d14] border border-emerald-800/50 text-xs md:text-sm text-white placeholder:text-emerald-300/50 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="button"
              onClick={() => setWrittenFavOnly((f) => !f)}
              className={`min-h-[44px] px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                writtenFavOnly
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[#041d14] border-emerald-800/50 text-emerald-200 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${writtenFavOnly ? 'fill-amber-400' : ''}`} />
              <span>المفضلة ({writtenFavIds.length})</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {WRITTEN_DUA_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setWrittenCategory(cat.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                  writtenCategory === cat.id
                    ? 'bg-[#c5a059] text-black border-[#c5a059] font-bold'
                    : 'bg-[#06241b]/70 text-emerald-200 border-emerald-800/40 hover:text-white'
                }`}
              >
                {cat.labelArabic}
              </button>
            ))}
          </div>

          {/* Written Duas Grid */}
          {filteredWrittenDuas.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#041d14] border border-emerald-800/40 text-center space-y-2">
              <p className="text-sm font-bold text-amber-200">لا توجد أدعية مطابقة لبحثك</p>
              <p className="text-xs text-emerald-300/70">جرّب مسح نص البحث أو اختيار جميع الأدعية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWrittenDuas.map((dua) => {
                const count = writtenCounts[dua.id] || 0;
                const done = count >= dua.repeatCount;
                const isFav = writtenFavIds.includes(dua.id);

                return (
                  <div
                    key={dua.id}
                    className={`p-5 rounded-3xl border transition-colors flex flex-col justify-between gap-4 ${
                      done
                        ? 'bg-[#082a1f]/65 border-emerald-500/50'
                        : 'bg-[#06241b]/85 border-emerald-800/40'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-amber-300">{dua.titleArabic}</h4>
                          <p className="text-[11px] text-emerald-300/75 mt-0.5">
                            {dua.categoryArabic} · {dua.reference}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleWrittenFavorite(dua.id)}
                          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-black/30 border border-emerald-800/40 flex items-center justify-center text-emerald-300/70 hover:text-amber-300 cursor-pointer shrink-0"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>

                      <p className="font-arabic-serif text-lg md:text-xl text-white leading-loose select-text">
                        {dua.text}
                      </p>

                      <p className="text-xs text-emerald-200/75 leading-relaxed">{dua.benefitArabic}</p>
                    </div>

                    <div className="pt-3 border-t border-emerald-800/30 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyText(dua.id, dua.text, dua.reference)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-black/30 border border-emerald-800/40 text-xs text-emerald-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === dua.id ? 'تم النسخ ✓' : 'نسخ الدعاء'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={done}
                        onClick={() => handleIncrementWritten(dua.id, dua.repeatCount)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 tabular-nums transition-colors cursor-pointer ${
                          done
                            ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40 cursor-default'
                            : 'bg-[#c5a059] text-black hover:bg-[#d8b368]'
                        }`}
                      >
                        {done ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>تمت القراءة</span>
                          </>
                        ) : (
                          <>
                            <span>قرأتُه</span>
                            <span className="px-2 py-0.5 rounded bg-black/20 font-extrabold">
                              {count} / {dua.repeatCount}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
