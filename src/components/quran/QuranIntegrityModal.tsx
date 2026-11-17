import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  Download,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { runQuranIntegrityChecks, QuranIntegrityReport } from '../../utils/quranIntegrity';
import { removeLeadingBasmalah } from '../../utils/adhkarPrayerSync';
import {
  countOfflineQuranItems,
  downloadFullMushafOffline,
  getOfflinePage,
  saveOfflinePage,
} from '../../utils/offlineStorage';

interface QuranIntegrityModalProps {
  onClose: () => void;
}

export const QuranIntegrityModal: React.FC<QuranIntegrityModalProps> = ({ onClose }) => {
  const [report, setReport] = useState<QuranIntegrityReport>(() => runQuranIntegrityChecks());
  const [cachedPagesCount, setCachedPagesCount] = useState<number>(0);
  const [isDownloadingJuz, setIsDownloadingJuz] = useState<boolean>(false);
  const [isDownloadingFull, setIsDownloadingFull] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const recountCachedPages = async () => {
    const summary = await countOfflineQuranItems();
    setCachedPagesCount(summary.pagesCount);
  };

  useEffect(() => {
    void recountCachedPages();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleRerunAudit = () => {
    setReport(runQuranIntegrityChecks());
    void recountCachedPages();
  };

  const handleCacheJuz30Offline = async () => {
    setIsDownloadingJuz(true);
    setDownloadStatus('جاري تنزيل صفحات الجزء الثلاثين (صـ 582 - 604) للقراءة دون إنترنت...');
    let downloaded = 0;
    for (let p = 582; p <= 604; p++) {
      const existing = await getOfflinePage(p);
      if (!existing) {
        try {
          const res = await fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`);
          const data = await res.json();
          if (data?.data?.ayahs) {
            const cleaned = data.data.ayahs.map((ay: { number: number; numberInSurah: number; text: string; page: number; juz: number; surah: { number: number; name: string } }) => ({
              number: ay.number,
              numberInSurah: ay.numberInSurah,
              surahNumber: ay.surah?.number || 1,
              surahNameArabic: (ay.surah?.name || '').replace('سُورَةُ ', ''),
              isFirstAyahOfSurah: ay.numberInSurah === 1,
              text: removeLeadingBasmalah(ay.text, ay.surah?.number || 1, ay.numberInSurah),
              translation: '',
              tafsir: '',
              page: p,
              juz: ay.juz || 30,
            }));
            await saveOfflinePage(p, cleaned);
            downloaded++;
          }
        } catch {}
      }
    }
    await recountCachedPages();
    setIsDownloadingJuz(false);
    setDownloadStatus(
      downloaded > 0
        ? `تم حفظ ${downloaded} صفحة جديدة من الجزء الثلاثين بنجاح للقراءة دون إنترنت.`
        : 'جميع صفحات الجزء الثلاثين محفوظة مسبقاً على جهازك.'
    );
  };

  const handleCacheFullMushaf = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsDownloadingFull(true);
    const res = await downloadFullMushafOffline(
      (prog) => setDownloadStatus(`${prog.message} (${prog.percent}%)`),
      controller.signal
    );
    await recountCachedPages();
    setIsDownloadingFull(false);
    if (res.ok) {
      setDownloadStatus(
        `تم حفظ المصحف كاملاً (${res.pagesSaved} صفحة و${res.surahsSaved} سورة مع التفسير الميسر) للعمل بلا إنترنت دائماً.`
      );
    } else if (res.errorMessage) {
      setDownloadStatus(res.errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#051b14] border-2 border-[#c5a059]/40 rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-800/40 mb-5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-amber-300">
                توثيق وسلامة النص القرآني الشريف
              </h3>
              <p className="text-[11px] text-emerald-300/75">
                فحص آلي ومطابقة دقيقة لبيانات المصحف مع الرواية المعتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/50 text-slate-300 hover:text-white cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* Source Authority Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#072b20] to-[#041912] border border-amber-500/30 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-emerald-300/70 block mb-0.5">المصدر المعتمد:</span>
            <strong className="text-amber-200">{report.sourceAuthorityArabic}</strong>
          </div>
          <div>
            <span className="text-emerald-300/70 block mb-0.5">الرواية القرآنية:</span>
            <strong className="text-amber-200">{report.riwayahArabic}</strong>
          </div>
          <div>
            <span className="text-emerald-300/70 block mb-0.5">معرف قاعدة البيانات والإصدار:</span>
            <strong className="text-white font-mono">
              {report.datasetIdentifier} · v{report.datasetVersion}
            </strong>
          </div>
          <div>
            <span className="text-emerald-300/70 block mb-0.5">حالة الفحص الآلي:</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              {report.passed ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>سليم ومطابق 100% ({report.passedChecks}/{report.totalChecks})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">تحذير في المطابقة</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5 text-center">
          <div className="p-3 rounded-2xl bg-black/35 border border-emerald-800/40">
            <div className="text-lg font-extrabold text-amber-300 tabular-nums">{report.totalSurahs}</div>
            <div className="text-[11px] text-emerald-300/70">سورة</div>
          </div>
          <div className="p-3 rounded-2xl bg-black/35 border border-emerald-800/40">
            <div className="text-lg font-extrabold text-amber-300 tabular-nums">{report.totalAyahs}</div>
            <div className="text-[11px] text-emerald-300/70">آية</div>
          </div>
          <div className="p-3 rounded-2xl bg-black/35 border border-emerald-800/40">
            <div className="text-lg font-extrabold text-amber-300 tabular-nums">{report.totalPages}</div>
            <div className="text-[11px] text-emerald-300/70">صفحة مدنية</div>
          </div>
          <div className="p-3 rounded-2xl bg-black/35 border border-emerald-800/40">
            <div className="text-lg font-extrabold text-amber-300 tabular-nums">{report.totalJuz}</div>
            <div className="text-[11px] text-emerald-300/70">جزءاً</div>
          </div>
          <div className="p-3 rounded-2xl bg-black/35 border border-emerald-800/40 col-span-2 sm:col-span-1">
            <div className="text-lg font-extrabold text-amber-300 tabular-nums">{report.totalHizb}</div>
            <div className="text-[11px] text-emerald-300/70">حزباً</div>
          </div>
        </div>

        {/* Checks List */}
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            <span>نتائج اختبارات سلامة وموثوقية النص</span>
          </h4>
          <button
            onClick={handleRerunAudit}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-emerald-200 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>إعادة الفحص الآن</span>
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {report.results.map((chk) => (
            <div
              key={chk.id}
              className="p-3 rounded-xl bg-black/30 border border-emerald-800/35 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                {chk.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">{chk.titleArabic}</div>
                  <p className="text-[11px] text-emerald-300/70 mt-0.5">{chk.descriptionArabic}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-amber-300 shrink-0">
                {chk.actual}
              </span>
            </div>
          ))}
        </div>

        {/* Offline Storage Manager */}
        <div className="p-4 rounded-2xl bg-[#07291e]/80 border border-emerald-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
                <span>وضع عدم الاتصال والتخزين الدائم (IndexedDB)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-emerald-300 tabular-nums">
                  {cachedPagesCount} / 604 صفحة محفوظة
                </span>
              </h4>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                {downloadStatus ||
                  'تُحفظ كل صفحة تقرؤها تلقائياً على جهازك، ويمكنك حفظ المصحف كاملاً أو الجزء الثلاثين لمرة واحدة ثم القراءة دائماً بلا إنترنت.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCacheFullMushaf}
              disabled={isDownloadingFull || isDownloadingJuz || cachedPagesCount >= 604}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] disabled:opacity-60 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {cachedPagesCount >= 604
                  ? 'المصحف محفوظ بالكامل ✓'
                  : isDownloadingFull
                  ? 'جاري حفظ المصحف...'
                  : 'حفظ المصحف كاملاً (٦٠٤)'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleCacheJuz30Offline}
              disabled={isDownloadingJuz || isDownloadingFull}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 border border-emerald-600/40 text-emerald-200 hover:text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingJuz ? 'جاري التنزيل...' : 'حفظ جزء عمّ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
