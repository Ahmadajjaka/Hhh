import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Trophy,
  Bell,
  ShieldCheck,
  ChevronLeft,
  Volume2,
  Heart,
  Smartphone,
  MessageSquareText,
  Palette,
  Check,
  MonitorPlay,
  HardDrive,
} from 'lucide-react';
import { QuranIntegrityModal } from '../quran/QuranIntegrityModal';
import { PWAInstallGuideModal } from '../pwa/PWAInstallUI';
import { OfflineCenterModal } from '../pwa/OfflineCenterModal';
import {
  APP_CREATOR_NAME,
  APP_DEDICATION_TEXT,
  APP_THEMES,
  AppThemeId,
} from '../../utils/appThemes';

interface MoreHubViewProps {
  onNavigate: (screen: string, extra?: Record<string, unknown>) => void;
  themeId: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
  onReplaySplash: () => void;
}

export const MoreHubView: React.FC<MoreHubViewProps> = ({
  onNavigate,
  themeId,
  onSelectTheme,
  onReplaySplash,
}) => {
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showOfflineCenter, setShowOfflineCenter] = useState(false);

  const menuItems: Array<{
    id: string;
    screen: string;
    extra?: Record<string, unknown>;
    title: string;
    desc: string;
    icon: typeof Sparkles;
    color: string;
  }> = [
    {
      id: 'sheikh_ai',
      screen: 'sheikh_ai',
      title: 'الشيخ أبو نوار',
      desc: 'استشر الشيخ أبو نوار بإرشاد وقور في التفسير والوعظ والعبادات',
      icon: MessageSquareText,
      color: 'text-amber-300',
    },
    {
      id: 'sheikh_duas',
      screen: 'duas_ruqyah',
      extra: { tab: 'duas' },
      title: 'أدعية بصوت كبار الشيوخ',
      desc: 'أدعية القنوت وختم القرآن والتهجد بصوت العفاسي والسديس والمعيقلي والدوسري والقطامي',
      icon: Heart,
      color: 'text-rose-300',
    },
    {
      id: 'ruqyah_shariah',
      screen: 'duas_ruqyah',
      extra: { tab: 'ruqyah' },
      title: 'الرقية الشرعية الصوتية والمقروءة',
      desc: 'رقية كاملة بأصوات كبار القراء مع آيات التحصين العثمانية وأدعية السنة النبوية',
      icon: ShieldCheck,
      color: 'text-emerald-300',
    },
    {
      id: 'sebha',
      screen: 'sebha',
      title: 'المسبحة الإلكترونية التفاعلية',
      desc: 'مسبحة ذكية باللمس والاهتزاز والصوت مع أذكار التسبيح',
      icon: Sparkles,
      color: 'text-amber-400',
    },
    {
      id: 'qibla',
      screen: 'qibla',
      title: 'بوصلة اتجاه القبلة',
      desc: 'تحديد دقيق لاتجاه الكعبة المشرفة وفق موقعك الجغرافي',
      icon: Compass,
      color: 'text-emerald-400',
    },
    {
      id: 'khatmah',
      screen: 'khatmah',
      title: 'خطة ختم القرآن وإحصائيات القراءة',
      desc: 'أهداف الختمة، عداد الصفحات اليومية، والتقويم الهجري',
      icon: Trophy,
      color: 'text-yellow-400',
    },
    {
      id: 'recitations',
      screen: 'recitations',
      title: 'المكتبة الصوتية وكبار القراء',
      desc: 'عبد الباسط، العفاسي، المعيقلي، السديس، الشريم، الحصري، المنشاوي',
      icon: Volume2,
      color: 'text-cyan-400',
    },
    {
      id: 'prayer',
      screen: 'prayer',
      title: 'إعدادات الأذان والتنبيهات',
      desc: 'اختيار صوت الأذان وتحديد مستوى الصوت والتوقيت المحلي بدقة',
      icon: Bell,
      color: 'text-amber-300',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto pb-28 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-amber-300">المزيد من الخدمات والإعدادات</h2>
        <p className="text-xs text-emerald-300/70 mt-1">
          أدوات إسلامية متقدمة وإعدادات لتخصيص تجربتك الروحانية
        </p>
      </div>

      {/* Main Grid */}
      <div className="space-y-3 mb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.screen, item.extra)}
              className="w-full p-4 rounded-2xl bg-[#082a1f]/70 hover:bg-[#0c382b] border border-emerald-700/30 hover:border-amber-400/50 transition-all text-right flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-emerald-800/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-emerald-300/70">{item.desc}</p>
                </div>
              </div>

              <ChevronLeft className="w-5 h-5 text-emerald-400/50 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
            </button>
          );
        })}

        <button
          onClick={() => setShowOfflineCenter(true)}
          className="w-full p-4 rounded-2xl bg-gradient-to-l from-[#0a3627] to-[#06241b] hover:brightness-110 border border-amber-400/50 transition-all text-right flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200 group-hover:text-amber-100 transition-colors">
                مركز العمل والتحميل بلا إنترنت (مرة واحدة ثم دائماً)
              </h3>
              <p className="text-xs text-emerald-200/80">
                تحميل المصحف كاملاً، أصوات الأذان، والأدعية والرقية الصوتية للفتح والتشغيل دون إنترنت
              </p>
            </div>
          </div>

          <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => setShowInstallModal(true)}
          className="w-full p-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-600/40 transition-all text-right flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                تثبيت التطبيق على الموبايل (أندرويد وآيفون)
              </h3>
              <p className="text-xs text-emerald-300/70">
                أضف «نور القرآن» إلى شاشة هاتفك الرئيسية كتطبيق مستقل يعمل دون إنترنت
              </p>
            </div>
          </div>

          <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => setShowIntegrityModal(true)}
          className="w-full p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 transition-all text-right flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                فحص سلامة النص القرآني والتحميل دون إنترنت
              </h3>
              <p className="text-xs text-emerald-300/70">
                مراجعة التوثيق الشرعي (١١٤ سورة · ٦٢٣٦ آية) وتنزيل جزء عمّ للقراءة بلا إنترنت
              </p>
            </div>
          </div>

          <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-all" />
        </button>
      </div>

      {/* Multi-Theme Picker Section */}
      <section
        aria-label="ثيمات ومظهر التطبيق"
        className="mb-6 p-5 rounded-3xl bg-[#06241b]/80 border border-amber-500/30 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                ثيمات التطبيق المتعددة ({APP_THEMES.length})
              </h3>
              <p className="text-xs text-emerald-300/75">
                اختر المظهر المناسب لقراءتك — يُحفظ تلقائياً على جهازك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReplaySplash}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer"
          >
            <MonitorPlay className="w-4 h-4 text-amber-400" />
            <span>عرض شاشة البداية (Splash)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {APP_THEMES.map((theme) => {
            const isSelected = theme.id === themeId;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelectTheme(theme.id)}
                aria-pressed={isSelected}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#0b3b2c] border-amber-400 shadow-md'
                    : 'bg-[#082a1f]/70 border-emerald-800/40 hover:border-amber-500/40'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {theme.swatches.map((hex, idx) => (
                      <span
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full border border-white/25 shrink-0"
                        style={{ backgroundColor: hex }}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="text-xs font-bold text-white truncate mr-1">
                      {theme.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-300/75 leading-snug">
                    {theme.subtitle}
                  </p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Trust, License & Authenticity Note */}
      <div className="p-5 rounded-3xl bg-[#06241b]/60 border border-emerald-800/30 text-xs text-emerald-200/80 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>الموثوقية والضوابط الشرعية لتطبيق «نور القرآن»</span>
        </div>
        <p className="leading-relaxed">
          • النص القرآني الكريم مطابق لمصحف المدينة النبوية الشريفة بالرسم العثماني المعتمد برواية حفص عن عاصم دون أي تدخل أو تعديل آلي.
        </p>
        <p className="leading-relaxed">
          • تلاوات القرآن الكريم بأصوات نخبة من كبار القراء مسجلة من أصولها المعتمدة رسمياً.
        </p>
        <p className="leading-relaxed">
          • أذان الصلوات تسجيلات حقيقية من الحرم المكي الشريف والمسجد النبوي الشريف.
        </p>
      </div>

      {/* App Version & Designer Credits */}
      <div className="mt-8 p-5 rounded-3xl bg-[#06241b]/70 border border-amber-500/25 text-center space-y-1.5">
        <p className="text-xs text-emerald-300/80">تطبيق «نور القرآن» – الإصدار الاحترافي الكامل 1.0</p>
        <p className="text-sm font-extrabold text-amber-300">
          تصميم وتطوير: {APP_CREATOR_NAME}
        </p>
        <p className="text-xs font-semibold text-emerald-200/90">
          {APP_DEDICATION_TEXT} — صدقة جارية
        </p>
      </div>

      {showIntegrityModal && (
        <QuranIntegrityModal onClose={() => setShowIntegrityModal(false)} />
      )}

      <PWAInstallGuideModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      <OfflineCenterModal
        isOpen={showOfflineCenter}
        onClose={() => setShowOfflineCenter(false)}
      />
    </div>
  );
};
