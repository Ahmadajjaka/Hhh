import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  CheckCircle2,
  Download,
  HardDrive,
  Heart,
  Loader2,
  ShieldCheck,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react';
import { ADHAN_RECORDINGS } from '../../data/quranMeta';
import { RUQYAH_AUDIO_TRACKS, SHEIKH_DUAS } from '../../data/duasAndRuqyahData';
import {
  countOfflineQuranItems,
  downloadAudioBatch,
  downloadFullMushafOffline,
  getCachedAudioUrlsSet,
  getOfflineStorageEstimate,
  requestPersistentStorage,
} from '../../utils/offlineStorage';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineCenterModal: React.FC<OfflineCenterModalProps> = ({ isOpen, onClose }) => {
  const isOnline = useOnlineStatus();
  const [pagesCount, setPagesCount] = useState(0);
  const [surahsCount, setSurahsCount] = useState(0);
  const [adhanCachedCount, setAdhanCachedCount] = useState(0);
  const [duasCachedCount, setDuasCachedCount] = useState(0);
  const [ruqyahCachedCount, setRuqyahCachedCount] = useState(0);
  const [usageMB, setUsageMB] = useState(0);
  const [persisted, setPersisted] = useState(false);

  const [activeTask, setActiveTask] = useState<null | 'all' | 'mushaf' | 'adhan' | 'duas_ruqyah'>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refreshStats = useCallback(async () => {
    const [quranSummary, storageEst, cachedSet] = await Promise.all([
      countOfflineQuranItems(),
      getOfflineStorageEstimate(),
      getCachedAudioUrlsSet([
        ...ADHAN_RECORDINGS.map((a) => a.audioUrl),
        ...ADHAN_RECORDINGS.map((a) => a.fallbackAudioUrl || '').filter(Boolean),
        ...SHEIKH_DUAS.map((d) => d.audioUrl),
        ...RUQYAH_AUDIO_TRACKS.map((r) => r.audioUrl),
      ]),
    ]);

    setPagesCount(quranSummary.pagesCount);
    setSurahsCount(quranSummary.surahsCount);
    setUsageMB(storageEst.usageMB);
    setPersisted(storageEst.persisted);

    setAdhanCachedCount(
      ADHAN_RECORDINGS.filter(
        (a) => cachedSet.has(a.audioUrl) || (a.fallbackAudioUrl && cachedSet.has(a.fallbackAudioUrl))
      ).length
    );
    setDuasCachedCount(SHEIKH_DUAS.filter((d) => cachedSet.has(d.audioUrl)).length);
    setRuqyahCachedCount(RUQYAH_AUDIO_TRACKS.filter((r) => cachedSet.has(r.audioUrl)).length);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshStats();
  }, [isOpen, refreshStats]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!isOpen) return null;

  const totalAudioDuasAndRuqyah = SHEIKH_DUAS.length + RUQYAH_AUDIO_TRACKS.length;
  const cachedDuasAndRuqyah = duasCachedCount + ruqyahCachedCount;
  const isMushafComplete = pagesCount >= 604 && surahsCount >= 114;
  const isAdhanComplete = adhanCachedCount >= ADHAN_RECORDINGS.length;
  const isDuasAudioComplete = cachedDuasAndRuqyah >= totalAudioDuasAndRuqyah;
  const isEverythingComplete = isMushafComplete && isAdhanComplete && isDuasAudioComplete;

  const handleCancel = () => {
    abortRef.current?.abort();
    setActiveTask(null);
    setProgressMessage('تم إيقاف التحميل — الملفات التي اكتملت تظل محفوظة للأبد.');
  };

  const handleDownloadMushaf = async () => {
    if (activeTask) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setActiveTask('mushaf');
    setStatusError(null);
    setProgressPercent(8);
    setProgressMessage('جاري تنزيل المصحف الشريف كاملاً (١١٤ سورة · ٦٠٤ صفحة)...');

    const res = await downloadFullMushafOffline((p) => {
      setProgressPercent(p.percent);
      setProgressMessage(p.message);
    }, ctrl.signal);

    await refreshStats();
    setActiveTask(null);
    if (!res.ok && res.errorMessage) {
      setStatusError(res.errorMessage);
    }
  };

  const handleDownloadAdhan = async () => {
    if (activeTask) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setActiveTask('adhan');
    setStatusError(null);
    setProgressPercent(5);

    const res = await downloadAudioBatch(
      ADHAN_RECORDINGS.map((a) => ({
        id: a.id,
        label: a.titleArabic,
        url: a.audioUrl,
        fallbackUrl: a.fallbackAudioUrl,
      })),
      (p) => {
        const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 100;
        setProgressPercent(Math.max(5, pct));
        setProgressMessage(
          p.currentLabel
            ? `جاري حفظ ${p.currentLabel} (${p.completed + 1} من ${p.total})...`
            : `تم حفظ ${p.completed - p.failed} من ${p.total} أصوات أذان للأبد.`
        );
      },
      ctrl.signal
    );

    await refreshStats();
    setActiveTask(null);
    if (res.failedIds.length > 0 && !ctrl.signal.aborted) {
      setStatusError(`تعذر تنزيل ${res.failedIds.length} ملف أذان مؤقتاً؛ يمكنك المحاولة مجدداً.`);
    }
  };

  const handleDownloadDuasAndRuqyahAudio = async () => {
    if (activeTask) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setActiveTask('duas_ruqyah');
    setStatusError(null);
    setProgressPercent(5);

    const items = [
      ...SHEIKH_DUAS.map((d) => ({
        id: d.id,
        label: `${d.titleArabic} (${d.sheikhNameArabic})`,
        url: d.audioUrl,
      })),
      ...RUQYAH_AUDIO_TRACKS.map((r) => ({
        id: r.id,
        label: `${r.titleArabic} (${r.sheikhNameArabic})`,
        url: r.audioUrl,
      })),
    ];

    const res = await downloadAudioBatch(
      items,
      (p) => {
        const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 100;
        setProgressPercent(Math.max(5, pct));
        setProgressMessage(
          p.currentLabel
            ? `جاري حفظ: ${p.currentLabel} (${p.completed + 1} من ${p.total})`
            : `تم حفظ ${p.completed - p.failed} من ${p.total} دعاءً ورقية للعمل دائماً بدون نت.`
        );
      },
      ctrl.signal
    );

    try {
      const prev = JSON.parse(localStorage.getItem('noor_downloaded_duas') || '[]') as string[];
      const merged = Array.from(new Set([...prev, ...res.cachedIds]));
      localStorage.setItem('noor_downloaded_duas', JSON.stringify(merged));
    } catch {}

    await refreshStats();
    setActiveTask(null);
    if (res.failedIds.length > 0 && !ctrl.signal.aborted) {
      setStatusError(`تعذر تنزيل ${res.failedIds.length} مقطع صوتي مؤقتاً؛ ما تم تحميله محفوظ بالفعل.`);
    }
  };

  const handleDownloadEverythingOnce = async () => {
    if (activeTask) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setActiveTask('all');
    setStatusError(null);
    await requestPersistentStorage();

    // 1. Full Mushaf
    if (!isMushafComplete && !ctrl.signal.aborted) {
      await downloadFullMushafOffline((p) => {
        setProgressPercent(Math.round(p.percent * 0.3));
        setProgressMessage(p.message);
      }, ctrl.signal);
    }

    // 2. Adhan voices
    if (!isAdhanComplete && !ctrl.signal.aborted) {
      await downloadAudioBatch(
        ADHAN_RECORDINGS.map((a) => ({
          id: a.id,
          label: a.titleArabic,
          url: a.audioUrl,
          fallbackUrl: a.fallbackAudioUrl,
        })),
        (p) => {
          const base = 30;
          const pct = p.total > 0 ? Math.round((p.completed / p.total) * 20) : 20;
          setProgressPercent(base + pct);
          setProgressMessage(
            p.currentLabel ? `أصوات الأذان: ${p.currentLabel}` : 'اكتمل حفظ أصوات الأذان.'
          );
        },
        ctrl.signal
      );
    }

    // 3. Sheikh Duas & Audio Ruqyah
    if (!isDuasAudioComplete && !ctrl.signal.aborted) {
      const items = [
        ...SHEIKH_DUAS.map((d) => ({ id: d.id, label: d.titleArabic, url: d.audioUrl })),
        ...RUQYAH_AUDIO_TRACKS.map((r) => ({ id: r.id, label: r.titleArabic, url: r.audioUrl })),
      ];
      const res = await downloadAudioBatch(
        items,
        (p) => {
          const base = 50;
          const pct = p.total > 0 ? Math.round((p.completed / p.total) * 50) : 50;
          setProgressPercent(base + pct);
          setProgressMessage(
            p.currentLabel
              ? `الأدعية والرقية (${p.completed + 1}/${p.total}): ${p.currentLabel}`
              : 'اكتمل تحميل الحزمة الشاملة للعمل بلا إنترنت دائماً!'
          );
        },
        ctrl.signal
      );

      try {
        const prev = JSON.parse(localStorage.getItem('noor_downloaded_duas') || '[]') as string[];
        localStorage.setItem('noor_downloaded_duas', JSON.stringify(Array.from(new Set([...prev, ...res.cachedIds]))));
      } catch {}
    }

    await refreshStats();
    setActiveTask(null);
    if (!ctrl.signal.aborted) {
      setProgressPercent(100);
      setProgressMessage('تم تنزيل الحزمة الكاملة بنجاح — يفتح التطبيق ويعمل معك دائماً بلا إنترنت!');
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-center-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#052319] border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-l from-[#0a3627] to-[#041d14] border-b border-emerald-800/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="offline-center-title" className="text-base md:text-lg font-extrabold text-amber-300 truncate">
                مركز التحميل والعمل بلا إنترنت
              </h3>
              <p className="text-xs text-emerald-200/80">
                تحميل لمرة واحدة فقط ثم يعمل ويفتح دائماً دون الحاجة إلى إنترنت
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق مركز العمل بلا إنترنت"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-black/30 border border-emerald-800/50 flex items-center justify-center text-emerald-200 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {!isOnline && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center gap-2.5 text-xs text-amber-200">
              <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
              <span>أنت الآن في وضع عدم الاتصال — كل ما تم حفظه يعمل معك فوراً دون إنترنت.</span>
            </div>
          )}

          {/* Master 1-Click Full Package CTA */}
          <div className="p-4 rounded-2xl bg-gradient-to-l from-[#093828] to-[#052117] border border-amber-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  {isEverythingComplete
                    ? 'التطبيق مكتمل للعمل دائماً بلا إنترنت ✓'
                    : 'الحزمة الشاملة لمرة واحدة ثم دائماً'}
                </h4>
                <p className="text-xs text-emerald-200/80 mt-0.5 tabular-nums">
                  تشمل المصحف كاملاً ({pagesCount}/604 ص) · الأذان ({adhanCachedCount}/5) · الأدعية والرقية الصوتية ({cachedDuasAndRuqyah}/{totalAudioDuasAndRuqyah})
                </p>
              </div>

              {activeTask ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  إيقاف مؤقت
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadEverythingOnce}
                  disabled={!isOnline && !isEverythingComplete}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 whitespace-nowrap shrink-0 hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {isEverythingComplete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم التحميل بالكامل ✓</span>
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

            {(activeTask || progressMessage) && (
              <div className="space-y-1.5 pt-1">
                {activeTask && (
                  <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#c5a059] to-amber-300 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(4, progressPercent))}%` }}
                    />
                  </div>
                )}
                <p className="text-[11px] text-amber-200 flex items-center gap-1.5">
                  {activeTask && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                  <span>{progressMessage}</span>
                </p>
              </div>
            )}

            {statusError && (
              <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-700/40 rounded-xl p-2.5">
                {statusError}
              </p>
            )}
          </div>

          {/* Individual Offline Pack Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Full Mushaf */}
            <div className="p-4 rounded-2xl bg-[#041b13] border border-emerald-800/50 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>المصحف الشريف والتفسير</span>
                  </span>
                  <span className="text-[11px] text-emerald-300 tabular-nums">
                    {pagesCount} / 604 ص
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/75 leading-relaxed">
                  حفظ ١١٤ سورة كاملة بالرسم العثماني والتفسير الميسر مع البحث دون إنترنت.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadMushaf}
                disabled={Boolean(activeTask) || isMushafComplete || !isOnline}
                className={`min-h-[40px] w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isMushafComplete
                    ? 'bg-emerald-800/40 border border-emerald-600/50 text-emerald-200'
                    : 'bg-[#c5a059] text-black hover:bg-[#d8b368] disabled:opacity-50'
                }`}
              >
                {isMushafComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>محفوظ كاملاً للأبد</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تحميل المصحف كاملاً</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Adhan Sounds */}
            <div className="p-4 rounded-2xl bg-[#041b13] border border-emerald-800/50 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span>أصوات الأذان (٥ مؤذنين)</span>
                  </span>
                  <span className="text-[11px] text-emerald-300 tabular-nums">
                    {adhanCachedCount} / {ADHAN_RECORDINGS.length}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/75 leading-relaxed">
                  حفظ أصوات أذان الحرم المكي والنبوي والعفاسي والأقصى ليعمل الأذان بلا نت.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadAdhan}
                disabled={Boolean(activeTask) || isAdhanComplete || !isOnline}
                className={`min-h-[40px] w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isAdhanComplete
                    ? 'bg-emerald-800/40 border border-emerald-600/50 text-emerald-200'
                    : 'bg-[#c5a059] text-black hover:bg-[#d8b368] disabled:opacity-50'
                }`}
              >
                {isAdhanComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>محفوظة للأبد ✓</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تحميل أصوات الأذان</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Audio Duas & Ruqyah */}
            <div className="p-4 rounded-2xl bg-[#041b13] border border-emerald-800/50 flex flex-col justify-between gap-3 sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-300 shrink-0" />
                    <span className="text-xs font-bold text-amber-300">
                      الأدعية الصوتية والرقية الشرعية بأصوات الشيوخ ({cachedDuasAndRuqyah} / {totalAudioDuasAndRuqyah})
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/75 leading-relaxed">
                    أدعية القنوت وختم القرآن والتهجد والرقية الشرعية الكاملة بأصوات العفاسي والسديس والمعيقلي والدوسري.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadDuasAndRuqyahAudio}
                  disabled={Boolean(activeTask) || isDuasAudioComplete || !isOnline}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isDuasAudioComplete
                      ? 'bg-emerald-800/40 border border-emerald-600/50 text-emerald-200'
                      : 'bg-[#c5a059] text-black hover:bg-[#d8b368] disabled:opacity-50'
                  }`}
                >
                  {isDuasAudioComplete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>جميعها محفوظة ✓</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>تحميل جميع الأدعية الصوتية</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Built-in Always-Offline Modules Summary */}
          <div className="p-4 rounded-2xl bg-black/30 border border-emerald-800/40 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 text-emerald-200 font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>أقسام مدمجة تعمل دائماً بدون إنترنت:</span>
              </span>
              <span className="text-[11px] text-amber-300 tabular-nums">
                {usageMB > 0 ? `المساحة المستخدمة: ${usageMB} MB` : 'تخزين محلي دائم'}
                {persisted ? ' · محمي من المسح' : ''}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              موسوعة الدعاء الشاملة · أذكار الصباح والمساء وبعد الصلاة · آيات وأدعية الرقية المكتوبة · مواقيت الصلاة · بوصلة القبلة · المسبحة الإلكترونية · واجهة التطبيق والفتح دون شبكة.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
