import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { applyThemeToDocument, loadSavedThemeId } from './utils/appThemes';
import { requestPersistentStorage } from './utils/offlineStorage';
import './index.css';

applyThemeToDocument(loadSavedThemeId());

// Capture browser beforeinstallprompt early before React tree mounts
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  (window as unknown as { __noorDeferredInstallPrompt?: Event }).__noorDeferredInstallPrompt = event;
});

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    try {
      registerSW({
        immediate: true,
        onOfflineReady() {
          try {
            localStorage.setItem('noor_sw_offline_ready', 'true');
          } catch {}
          requestPersistentStorage().catch(() => {});
        },
      });
    } catch {
      // ignore non-critical SW registration failure
    }
  } else {
    // Clean up any stale dev-sw registrations so dev preview never serves stale cache
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
        if (scriptUrl.includes('dev-sw')) {
          reg.unregister().catch(() => {});
        }
      });
    }).catch(() => {});
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'حدث خطأ غير متوقع' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#031911] text-slate-100 flex items-center justify-center p-6 text-center"
        >
          <div className="max-w-md w-full rounded-3xl p-6 bg-[#06241b] border border-amber-500/40 space-y-4">
            <h1 className="text-xl font-bold text-amber-300">نور القرآن الكريم</h1>
            <p className="text-sm text-emerald-100/90">
              حدث خطأ أثناء عرض التطبيق. اضغط أدناه لتحديث الصفحة والبدء من جديد.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#c5a059] text-black font-bold text-sm cursor-pointer"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
