import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Heart,
  Repeat,
  Radio,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Music,
  Loader2,
  X,
} from 'lucide-react';
import { RECITERS, ALL_SURAHS } from '../../data/quranMeta';
import { cacheAudioForOffline, getPlayableAudioSrc } from '../../utils/quranAudioAndTafsir';
import { downloadAudioBatch, getCachedAudioUrlsSet } from '../../utils/offlineStorage';

export const RecitationsHub: React.FC = () => {
  const [selectedReciterId, setSelectedReciterId] = useState<string>('abdul_basit_murattal');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [downloadedKeys, setDownloadedKeys] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_downloaded_recitations') || '[]');
    } catch {
      return [];
    }
  });
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [batchDownloading, setBatchDownloading] = useState<boolean>(false);
  const [batchPercent, setBatchPercent] = useState<number>(0);
  const batchAbortRef = useRef<AbortController | null>(null);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_favorite_recitations') || '[1, 36, 55, 67]');
    } catch {
      return [1, 36, 55, 67];
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentReciter = RECITERS.find((r) => r.id === selectedReciterId) || RECITERS[0];
  const currentSurah = ALL_SURAHS.find((s) => s.number === selectedSurahNumber) || ALL_SURAHS[0];

  // Build audio URL for full Surah recitation (MP3Quran 001.mp3 .. 114.mp3)
  const surahFormatted = String(selectedSurahNumber).padStart(3, '0');
  const fullSurahAudioUrl = `${currentReciter.serverUrl}${surahFormatted}.mp3`;
  const activeKey = `${selectedReciterId}:${selectedSurahNumber}`;

  // Reconcile cached Surahs directly with Cache API whenever reciter switches
  useEffect(() => {
    let cancelled = false;
    const urls = ALL_SURAHS.map(
      (s) => `${currentReciter.serverUrl}${String(s.number).padStart(3, '0')}.mp3`
    );
    getCachedAudioUrlsSet(urls).then((cachedUrls) => {
      if (cancelled) return;
      const syncedForReciter = ALL_SURAHS.filter((s) =>
        cachedUrls.has(`${currentReciter.serverUrl}${String(s.number).padStart(3, '0')}.mp3`)
      ).map((s) => `${selectedReciterId}:${s.number}`);

      if (syncedForReciter.length > 0) {
        setDownloadedKeys((prev) => {
          const merged = Array.from(new Set([...prev, ...syncedForReciter]));
          try {
            localStorage.setItem('noor_downloaded_recitations', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedReciterId, currentReciter.serverUrl]);

  useEffect(() => {
    return () => {
      batchAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    let cancelled = false;
    let blobUrlToRevoke: string | null = null;

    const loadAudio = async () => {
      const src = await getPlayableAudioSrc(fullSurahAudioUrl);
      if (cancelled) {
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
        return;
      }
      if (src.startsWith('blob:')) {
        blobUrlToRevoke = src;
      }
      audio.src = src;
      audio.playbackRate = playbackSpeed;
      if (isPlaying) {
        audio.play().catch((e) => {
          console.warn('Audio play failed:', e);
          setIsPlaying(false);
        });
      }
    };

    loadAudio();

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (selectedSurahNumber < 114) {
        setSelectedSurahNumber((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      cancelled = true;
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke);
      }
    };
  }, [fullSurahAudioUrl, isRepeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleNextSurah = () => {
    if (selectedSurahNumber < 114) {
      setSelectedSurahNumber((s) => s + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevSurah = () => {
    if (selectedSurahNumber > 1) {
      setSelectedSurahNumber((s) => s - 1);
      setIsPlaying(true);
    }
  };

  const toggleFavorite = (surahNum: number) => {
    const updated = favorites.includes(surahNum)
      ? favorites.filter((n) => n !== surahNum)
      : [...favorites, surahNum];
    setFavorites(updated);
    localStorage.setItem('noor_favorite_recitations', JSON.stringify(updated));
  };

  const handleOfflineDownload = async (surahNum: number) => {
    const key = `${selectedReciterId}:${surahNum}`;
    if (downloadedKeys.includes(key) || downloadingKey === key) return;

    const sStr = String(surahNum).padStart(3, '0');
    const url = `${currentReciter.serverUrl}${sStr}.mp3`;
    setDownloadingKey(key);
    setDownloadFeedback(null);

    const ok = await cacheAudioForOffline(url);
    setDownloadingKey(null);

    if (ok) {
      const updated = Array.from(new Set([...downloadedKeys, key]));
      setDownloadedKeys(updated);
      try {
        localStorage.setItem('noor_downloaded_recitations', JSON.stringify(updated));
      } catch {}
      setDownloadFeedback(`تم حفظ سورة ${ALL_SURAHS[surahNum - 1]?.name || ''} في ذاكرة الجهاز للاستماع دون إنترنت.`);
    } else {
      setDownloadFeedback('تعذر حفظ الملف الصوتي دون إنترنت بسبب قيود الشبكة أو الخادم.');
    }
  };

  const handleBatchDownloadRecitations = async (surahNumbers: number[], packLabel: string) => {
    if (batchDownloading) return;
    const ctrl = new AbortController();
    batchAbortRef.current = ctrl;
    setBatchDownloading(true);
    setBatchPercent(5);
    setDownloadFeedback(`جاري حفظ ${packLabel} بصوت ${currentReciter.nameArabic} للعمل بلا إنترنت...`);

    const items = surahNumbers.map((num) => {
      const sStr = String(num).padStart(3, '0');
      const surahName = ALL_SURAHS[num - 1]?.name || String(num);
      return {
        id: `${selectedReciterId}:${num}`,
        label: `سورة ${surahName}`,
        url: `${currentReciter.serverUrl}${sStr}.mp3`,
      };
    });

    const res = await downloadAudioBatch(
      items,
      (p) => {
        const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 100;
        setBatchPercent(Math.max(5, pct));
        if (p.currentLabel) {
          setDownloadFeedback(
            `جاري التحميل (${p.completed + 1}/${p.total}): ${p.currentLabel}`
          );
        }
      },
      ctrl.signal
    );

    const updated = Array.from(new Set([...downloadedKeys, ...res.cachedIds]));
    setDownloadedKeys(updated);
    try {
      localStorage.setItem('noor_downloaded_recitations', JSON.stringify(updated));
    } catch {}
    setBatchDownloading(false);
    setBatchPercent(100);
    setDownloadFeedback(
      ctrl.signal.aborted
        ? 'تم إيقاف التحميل — السور التي اكتمل حفظها تعمل دائماً بلا إنترنت.'
        : `تم حفظ ${res.cachedIds.length} سورة من ${packLabel} في ذاكرة الجهاز للاستماع دائماً دون إنترنت ✓`
    );
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-28 px-4">
      {/* Recitations Hero */}
      <div className="relative rounded-3xl p-6 mb-8 bg-gradient-to-r from-[#04241b] via-[#063326] to-[#084232] border border-amber-500/30 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-right">
            <span className="text-xs text-amber-300 font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 inline-block mb-2">
              مكتبة التلاوات المعتمدة ({RECITERS.length} قراء)
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
              {currentReciter.nameArabic}
            </h2>
            <p className="text-xs text-emerald-200/80 max-w-md leading-relaxed">
              تلاوات أصلية مرخصة ({currentReciter.styleArabic})، مع إمكانية التحكم في سرعة التشغيل وحفظ السور في المتصفح للاستماع دون إنترنت.
            </p>
          </div>

          {/* Reciter Avatar & Golden Ring */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-amber-400/80 p-1 shadow-2xl shadow-amber-500/30 bg-emerald-950 flex items-center justify-center relative">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#02130e] to-[#07382a] flex flex-col items-center justify-center text-center p-2">
              <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-amber-200 line-clamp-2">{currentReciter.nameArabic}</span>
              <span className="text-[9px] text-emerald-300/60 mt-0.5">{currentReciter.styleArabic}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reciters Picker */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <span>اختر القارئ والرواية:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {RECITERS.map((r) => {
            const isSelected = r.id === selectedReciterId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedReciterId(r.id)}
                className={`p-3 rounded-2xl text-right transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                    : 'bg-[#082a1f]/60 border-emerald-800/40 text-emerald-200 hover:bg-[#0c392b]'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-amber-200">{r.nameArabic}</h4>
                  <p className="text-[10px] text-emerald-300/70">{r.styleArabic}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Audio Player Deck */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#06241b] to-[#03150f] border border-amber-500/30 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                سُورَةُ {currentSurah.name}
              </h3>
              <p className="text-xs text-amber-300/80">
                {currentReciter.nameArabic} · {currentReciter.styleArabic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(selectedSurahNumber)}
              className={`p-2 rounded-xl transition-colors ${
                favorites.includes(selectedSurahNumber)
                  ? 'text-rose-400 bg-rose-500/10'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
              title="إضافة للمفضلة"
            >
              <Heart className={`w-5 h-5 ${favorites.includes(selectedSurahNumber) ? 'fill-rose-400' : ''}`} />
            </button>
            <button
              onClick={() => handleOfflineDownload(selectedSurahNumber)}
              disabled={downloadingKey === activeKey}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                downloadedKeys.includes(activeKey)
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
              title={downloadedKeys.includes(activeKey) ? 'محفوظة في الجهاز دون إنترنت' : 'تحميل للاستماع دون إنترنت'}
            >
              {downloadingKey === activeKey ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {downloadFeedback && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/40 text-[11px] text-amber-200 flex items-center justify-between">
            <span>{downloadFeedback}</span>
            <button onClick={() => setDownloadFeedback(null)} className="text-emerald-300 hover:text-white px-1 cursor-pointer">✕</button>
          </div>
        )}

        {/* Audio Progress Seeker Bar */}
        <div className="w-full my-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-amber-400 bg-emerald-950/80 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] text-emerald-300/60 mt-1 tabular-nums">
            <span>{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`p-2 rounded-xl transition-colors ${
              isRepeat ? 'text-amber-400 bg-amber-500/15' : 'text-emerald-300/50 hover:text-white'
            }`}
            title="تكرار السورة"
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrevSurah}
            disabled={selectedSurahNumber <= 1}
            className="p-3 rounded-full text-emerald-300 hover:text-white disabled:opacity-30"
            title="السورة السابقة"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
          </button>

          <button
            onClick={handleNextSurah}
            disabled={selectedSurahNumber >= 114}
            className="p-3 rounded-full text-emerald-300 hover:text-white disabled:opacity-30"
            title="السورة التالية"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 1.25 : s === 1.25 ? 1.5 : 1))}
            className="px-2.5 py-1 rounded-xl bg-black/40 border border-emerald-800/40 text-xs text-amber-300 tabular-nums"
            title="سرعة التشغيل"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Surahs Playlist & Batch Offline Downloader */}
      <div>
        <div className="p-4 rounded-2xl bg-[#041d14] border border-amber-500/30 mb-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-amber-300">
                تحميل التلاوات بلا إنترنت ({downloadedKeys.filter((k) => k.startsWith(`${selectedReciterId}:`)).length} / 114 سورة محفوظة)
              </h3>
              <p className="text-[11px] text-emerald-200/75 mt-0.5">
                حمّل السور مرة واحدة للاستماع إليها دائماً دون اتصال بالشبكة
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {batchDownloading ? (
                <button
                  type="button"
                  onClick={() => batchAbortRef.current?.abort()}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إيقاف التحميل ({batchPercent}%)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleBatchDownloadRecitations(
                        Array.from({ length: 37 }, (_, i) => 78 + i),
                        'جزء عمّ (٣٧ سورة)'
                      )
                    }
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#c5a059] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#d8b368] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل جزء عمّ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleBatchDownloadRecitations(
                        ALL_SURAHS.map((s) => s.number),
                        'المصحف المرتل كاملاً (١١٤ سورة)'
                      )
                    }
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center gap-1.5 hover:text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الكل (١١٤)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {batchDownloading && (
            <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
              <div
                className="h-full bg-[#c5a059] transition-all duration-300"
                style={{ width: `${batchPercent}%` }}
              />
            </div>
          )}
        </div>

        <h3 className="text-sm font-bold text-amber-300 mb-3 flex items-center justify-between">
          <span>قائمة السور ({ALL_SURAHS.length})</span>
          <span className="text-xs text-emerald-300/60 font-normal">اضغط على السورة للاستماع أو زر التحميل للحفظ</span>
        </h3>

        <div className="space-y-2">
          {ALL_SURAHS.map((surah) => {
            const isCurrent = surah.number === selectedSurahNumber;
            const isFav = favorites.includes(surah.number);
            const rowKey = `${selectedReciterId}:${surah.number}`;
            const isDownloaded = downloadedKeys.includes(rowKey);
            const isDownloadingRow = downloadingKey === rowKey;

            return (
              <div
                key={surah.number}
                onClick={() => {
                  setSelectedSurahNumber(surah.number);
                  setIsPlaying(true);
                }}
                className={`p-3.5 rounded-2xl transition-all border flex items-center justify-between cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                    : 'bg-[#082a1f]/60 border-emerald-800/30 hover:bg-[#0c382a] text-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs tabular-nums ${
                      isCurrent
                        ? 'bg-amber-400 text-black'
                        : 'bg-emerald-950/60 border border-emerald-700/40 text-amber-300'
                    }`}
                  >
                    {surah.number}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{surah.name}</h4>
                    <p className="text-[11px] text-emerald-300/70">
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · {surah.numberOfAyahs} آية
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOfflineDownload(surah.number);
                    }}
                    disabled={isDownloadingRow || isDownloaded}
                    aria-label={isDownloaded ? `سورة ${surah.name} محفوظة دون إنترنت` : `تحميل سورة ${surah.name} دون إنترنت`}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                      isDownloaded
                        ? 'bg-emerald-950/80 border-emerald-700/50 text-emerald-300 cursor-default'
                        : 'bg-black/30 border-emerald-700/40 text-amber-300 hover:border-amber-400'
                    }`}
                  >
                    {isDownloadingRow ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isDownloaded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>محفوظ</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>حفظ</span>
                      </>
                    )}
                  </button>
                  {isFav && <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />}
                  {isCurrent && isPlaying ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
