import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Copy,
  Download,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getShareableInstallUrl } from '../../utils/pwaHelpers';
import { OfflineCenterModal } from './OfflineCenterModal';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>(() =>
    isIOS ? 'ios' : 'android'
  );
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const appUrl =
    typeof window !== 'undefined' ? getShareableInstallUrl(window.location.href) : '/';

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl).catch(() => {});
    }
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleDirectInstall = async () => {
    const accepted = await install();
    if (accepted) {
      onClose();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#052319] border border-amber-500/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-l from-[#0a3627] to-[#041d14] border-b border-emerald-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="أيقونة تطبيق نور القرآن"
              className="w-12 h-12 rounded-2xl border border-amber-400/40 shadow-md shrink-0"
            />
            <div>
              <h3
                id="pwa-install-modal-title"
                className="text-base md:text-lg font-extrabold text-amber-300"
              >
                تثبيت «نور القرآن» كتطبيق موبايل
              </h3>
              <p className="text-xs text-emerald-200/80">
                يعمل بشاشة كاملة ويدعم التصفح دون إنترنت على أندرويد وآيفون
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة التثبيت"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-black/30 border border-emerald-800/50 flex items-center justify-center text-emerald-200 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-800/40 border border-emerald-500/50 flex items-center gap-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>التطبيق مثبّت بالفعل ويعمل بوضع التطبيق المستقل على جهازك.</span>
            </div>
          )}

          {/* Direct 1-Click Install CTA when Chromium beforeinstallprompt is available */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={handleDirectInstall}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-gradient-to-r from-[#c5a059] to-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>تثبيت التطبيق الآن بضغطة واحدة</span>
            </button>
          )}

          {/* Platform Switcher Tabs */}
          <div
            role="tablist"
            aria-label="اختيار نظام الهاتف"
            className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/35 border border-emerald-800/40"
          >
            <button
              type="button"
              role="tab"
              aria-selected={platformTab === 'android'}
              onClick={() => setPlatformTab('android')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-colors cursor-pointer ${
                platformTab === 'android'
                  ? 'bg-[#c5a059] text-black'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              أندرويد (Chrome)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platformTab === 'ios'}
              onClick={() => setPlatformTab('ios')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-colors cursor-pointer ${
                platformTab === 'ios'
                  ? 'bg-[#c5a059] text-black'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              آيفون وآيباد (Safari)
            </button>
          </div>

          {/* Step-by-Step Instructions */}
          {platformTab === 'android' ? (
            <div className="space-y-3 text-xs md:text-sm text-emerald-100 leading-relaxed">
              <div className="p-4 rounded-2xl bg-[#041b13] border border-emerald-800/50 space-y-2.5">
                <p className="font-bold text-amber-300">
                  ١) التثبيت الفوري كتطبيق أندرويد (WebAPK — بدون ملف APK):
                </p>
                <ol className="list-decimal list-inside space-y-2 text-emerald-100/90">
                  <li>افتح رابط التطبيق في متصفح <strong>Google Chrome</strong> (وليس داخل نافذة المعاينة).</li>
                  <li>اضغط على زر القائمة <strong>(⋮)</strong> في أعلى المتصفح.</li>
                  <li>اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                  <li>اضغط <strong>«تثبيت»</strong> لتظهر أيقونة «نور القرآن» بين تطبيقاتك وتعمل بدون شريط المتصفح.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-emerald-800/40 space-y-2">
                <p className="font-bold text-emerald-200">
                  ٢) التحويل إلى ملف APK (Capacitor / Netlify / GitHub Actions):
                </p>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  المشروع جاهز للاستضافة على <code className="text-amber-300">Netlify</code> مع دعم الدوال السحابية لـ{' '}
                  <code className="text-amber-300">/api/*</code>، ويمكن تحويله إلى ملف{' '}
                  <code className="text-amber-300">.apk</code> عبر Android Studio أو الأمر:
                </p>
                <pre
                  dir="ltr"
                  className="p-2.5 rounded-xl bg-[#02120c] border border-emerald-900/60 text-[11px] text-amber-200 overflow-x-auto"
                >
                  npm run android:apk
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs md:text-sm text-emerald-100 leading-relaxed">
              <div className="p-4 rounded-2xl bg-[#041b13] border border-emerald-800/50 space-y-2.5">
                <p className="font-bold text-amber-300">خطوات التثبيت على آيفون وآيباد:</p>
                <ol className="list-decimal list-inside space-y-2 text-emerald-100/90">
                  <li>افتح رابط التطبيق باستخدام متصفح <strong>Safari</strong> الأصلي.</li>
                  <li>
                    اضغط على أيقونة{' '}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/70 border border-emerald-700/50 text-amber-200 text-xs align-middle">
                      <Share className="w-3.5 h-3.5" />
                      <span>مشاركة (Share)</span>
                    </span>{' '}
                    في شريط السفاري بالأسفل.
                  </li>
                  <li>مرّر للأسفل واختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen)</strong>.</li>
                  <li>اضغط <strong>«إضافة» (Add)</strong> في الزاوية العلوية ليُثبّت كتطبيق مستقل.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Share / Copy Direct App Link for mobile browsers */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-amber-300">رابط التثبيت المباشر على الجوال:</p>
              <p className="text-[11px] text-emerald-300/75 truncate" dir="ltr">
                {appUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-950 border border-emerald-700/50 text-xs font-bold text-amber-200 hover:text-white flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedUrl ? 'تم نسخ الرابط ✓' : 'نسخ الرابط'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-emerald-300/75">
            <span>شاشة كاملة بدون متصفح</span>
            <span aria-hidden="true">·</span>
            <span>تشغيل دون إنترنت للبيانات المحفوظة</span>
            <span aria-hidden="true">·</span>
            <span>أيقونة مستقلة</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress install button when already running in installed standalone app mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="تثبيت التطبيق على الجوال"
        title="تثبيت نور القرآن كتطبيق موبايل"
        className="px-3 py-2 text-xs font-bold text-amber-200 bg-emerald-950/70 border border-amber-500/40 rounded-xl hover:bg-emerald-900/80 hover:text-amber-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="sm:hidden">تثبيت</span>
      </button>

      <PWAInstallGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showOfflineCenter, setShowOfflineCenter] = useState(false);

  if (isOnline && !showOfflineCenter) return null;

  return (
    <>
      {!isOnline && (
        <button
          type="button"
          onClick={() => setShowOfflineCenter(true)}
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-amber-500 text-black px-4 py-2 text-xs font-bold shadow-xl whitespace-nowrap cursor-pointer hover:brightness-105"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>وضع عدم الاتصال — فتح مركز المحفوظات</span>
        </button>
      )}
      <OfflineCenterModal isOpen={showOfflineCenter} onClose={() => setShowOfflineCenter(false)} />
    </>
  );
};
