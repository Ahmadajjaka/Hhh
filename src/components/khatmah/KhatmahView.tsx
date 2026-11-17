import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Trophy,
  BookOpen,
  Flame,
  Bell,
  BellOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getDailyReadingStats,
  updateReadingReminderSettings,
  DailyReadingStats,
} from '../../utils/quranAudioAndTafsir';
import {
  requestSmartNotificationPermission,
  sendLocalNotification,
} from '../../utils/adhkarPrayerSync';

export const KhatmahView: React.FC = () => {
  const [targetDays, setTargetDays] = useState<number>(() => {
    return parseInt(localStorage.getItem('noor_khatmah_target_days') || '30', 10);
  });

  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noor_khatmah_completed_days') || '[]');
    } catch {
      return [];
    }
  });

  const [readingStats, setReadingStats] = useState<DailyReadingStats>(() => getDailyReadingStats());
  const [confirmReset, setConfirmReset] = useState(false);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);

  const totalPages = 604;
  const pagesPerDay = Math.ceil(totalPages / targetDays);

  const toggleDay = (day: number) => {
    let updated: number[];
    if (completedDays.includes(day)) {
      updated = completedDays.filter((d) => d !== day);
    } else {
      updated = [...completedDays, day].sort((a, b) => a - b);
      if (updated.length === targetDays) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#c5a059', '#10b981', '#fbbf24', '#ffffff'],
        });
      }
    }
    setCompletedDays(updated);
    localStorage.setItem('noor_khatmah_completed_days', JSON.stringify(updated));
  };

  const handleConfirmReset = () => {
    setCompletedDays([]);
    localStorage.setItem('noor_khatmah_completed_days', '[]');
    setConfirmReset(false);
  };

  const changeTargetDays = (days: number) => {
    setTargetDays(days);
    localStorage.setItem('noor_khatmah_target_days', days.toString());
  };

  const handleToggleDailyReminder = async () => {
    const nextEnabled = !readingStats.reminderEnabled;
    if (nextEnabled) {
      const granted = await requestSmartNotificationPermission();
      const updated = updateReadingReminderSettings(true, readingStats.reminderTime, readingStats.dailyGoalPages);
      setReadingStats({ ...updated });
      if (granted) {
        sendLocalNotification(
          'تذكير الورد اليومي - نور القرآن',
          `تم تفعيل التذكير اليومي لقراءة ${updated.dailyGoalPages} صفحات يومياً الساعة ${updated.reminderTime}.`
        );
        setReminderNotice(`تم تفعيل التذكير اليومي بنجاح الساعة ${updated.reminderTime}`);
      } else {
        setReminderNotice(`تم حفظ التذكير اليومي الساعة ${updated.reminderTime} (يرجى تفعيل إذن الإشعارات في المتصفح للتنبيه المنبثق).`);
      }
    } else {
      const updated = updateReadingReminderSettings(false, readingStats.reminderTime, readingStats.dailyGoalPages);
      setReadingStats({ ...updated });
      setReminderNotice('تم إيقاف التذكير اليومي بالقراءة.');
    }
  };

  const handleReminderTimeChange = (time: string) => {
    const updated = updateReadingReminderSettings(readingStats.reminderEnabled, time, readingStats.dailyGoalPages);
    setReadingStats({ ...updated });
  };

  const handleDailyGoalChange = (goal: number) => {
    const updated = updateReadingReminderSettings(readingStats.reminderEnabled, readingStats.reminderTime, goal);
    setReadingStats({ ...updated });
  };

  const progressPercent = Math.min(100, Math.round((completedDays.length / targetDays) * 100));
  const pagesRead = Math.min(totalPages, completedDays.length * pagesPerDay);
  const dailyGoalPct = Math.min(
    100,
    Math.round((readingStats.pagesToday.length / Math.max(1, readingStats.dailyGoalPages)) * 100)
  );

  // Islamic Events list
  const ISLAMIC_EVENTS = [
    { title: 'شهر رمضان المبارك', hijriMonth: 'رمضان', note: 'شهر الصيام ونزول القرآن' },
    { title: 'عيد الفطر السعيد', hijriMonth: 'شوّال', note: '١-٣ شوال' },
    { title: 'يوم عرفة', hijriMonth: 'ذو الحجة', note: '٩ ذو الحجة - أعظم أيام العام' },
    { title: 'عيد الأضحى المبارك', hijriMonth: 'ذو الحجة', note: '١٠-١٣ ذو الحجة' },
    { title: 'رأس السنة الهجرية', hijriMonth: 'المحرّم', note: '١ محرم' },
    { title: 'يوم عاشوراء', hijriMonth: 'المحرّم', note: '١٠ محرم' },
    { title: 'ذكرى الإسراء والمعراج', hijriMonth: 'رجب', note: '٢٧ رجب' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto pb-28 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#c5a059]" />
            <span>خطة الختمة وإحصائيات القراءة</span>
          </h2>
          <p className="text-xs text-emerald-300/70 mt-1">
            تابع وردك القرآني اليومي وإحصائيات الصفحات المقروءة والتذكير اليومي
          </p>
        </div>

        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs px-3 py-1.5 rounded-xl text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            بدء ختمة جديدة
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleConfirmReset}
              className="text-xs px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold cursor-pointer"
            >
              تأكيد التصفير
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-xs px-3 py-1.5 rounded-xl bg-black/40 border border-emerald-700/40 text-emerald-200 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      {/* Daily Reading Stats & Daily Reminder Panel */}
      <div className="p-5 rounded-3xl bg-[#06241b]/90 border border-amber-500/30 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300">إحصائيات القراءة اليومية والتذكير</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={readingStats.reminderTime}
              onChange={(e) => handleReminderTimeChange(e.target.value)}
              className="bg-black/40 border border-emerald-700/40 rounded-xl px-2.5 py-1 text-xs text-amber-200 focus:outline-none"
              aria-label="وقت التذكير اليومي"
            />
            <button
              onClick={handleToggleDailyReminder}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                readingStats.reminderEnabled
                  ? 'bg-amber-400 text-black'
                  : 'bg-emerald-950 border border-amber-500/40 text-amber-300 hover:bg-emerald-900'
              }`}
            >
              {readingStats.reminderEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              <span>{readingStats.reminderEnabled ? 'التذكير اليومي مفعل' : 'تفعيل تذكير يومي'}</span>
            </button>
          </div>
        </div>

        {reminderNotice && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-xs text-amber-200 flex items-center justify-between">
            <span>{reminderNotice}</span>
            <button onClick={() => setReminderNotice(null)} className="text-amber-300 hover:text-white px-1 cursor-pointer">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-800/30">
            <span className="text-[11px] text-emerald-300/70 block mb-1">صفحات اليوم</span>
            <div className="text-xl font-extrabold text-white tabular-nums">
              {readingStats.pagesToday.length} <span className="text-xs font-normal text-amber-300">/ {readingStats.dailyGoalPages} صفحات</span>
            </div>
            <div className="w-full h-1.5 bg-emerald-950 rounded-full mt-2 overflow-hidden">
              <div style={{ width: `${dailyGoalPct}%` }} className="h-full bg-amber-400 transition-all" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-800/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-300/70 block mb-1">سلسلة المواظبة</span>
              <div className="text-xl font-extrabold text-amber-300 tabular-nums">
                {readingStats.streakDays} يوم
              </div>
            </div>
            <Flame className="w-6 h-6 text-amber-400" />
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-800/30">
            <span className="text-[11px] text-emerald-300/70 block mb-1">إجمالي الصفحات المقروءة</span>
            <div className="text-xl font-extrabold text-emerald-300 tabular-nums">
              {readingStats.totalPagesAllTime} صفحة
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-emerald-200/80">الهدف اليومي:</span>
          {[2, 4, 10, 20].map((goal) => (
            <button
              key={goal}
              onClick={() => handleDailyGoalChange(goal)}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                readingStats.dailyGoalPages === goal
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-black/30 border-emerald-800/40 text-emerald-200/70 hover:text-white'
              }`}
            >
              {goal} صفحات
            </button>
          ))}
        </div>
      </div>

      {/* Target Days Selector */}
      <div className="p-5 rounded-3xl bg-[#082a1f]/70 border border-emerald-700/30 mb-6">
        <label className="text-xs text-emerald-200/80 block mb-2 font-semibold">
          اختر مدة الختمة:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[10, 15, 30, 60].map((days) => (
            <button
              key={days}
              onClick={() => changeTargetDays(days)}
              className={`p-3 rounded-2xl text-center border transition-all ${
                targetDays === days
                  ? 'bg-[#c5a059] text-black font-bold border-[#c5a059] shadow-md shadow-amber-900/30'
                  : 'bg-black/30 border-emerald-800/40 text-emerald-200 hover:bg-black/50'
              }`}
            >
              <div className="text-base font-bold tabular-nums">{days} يوماً</div>
              <div className="text-[11px] opacity-80">
                {Math.ceil(604 / days)} صفحة / يوم
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#04241b] via-[#073628] to-[#04241b] border border-amber-500/30 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-right">
            <span className="text-xs text-amber-300 font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 inline-block mb-2">
              التقدم الحالي
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
              أنجزت {completedDays.length} من أصل {targetDays} يوماً
            </h3>
            <p className="text-xs text-emerald-200/80">
              قرأت ما يقارب {pagesRead} صفحة من أصل {totalPages} صفحة ({progressPercent}%)
            </p>
          </div>

          {/* Percentage Circular Badge */}
          <div className="w-24 h-24 rounded-full border-4 border-amber-400/80 flex flex-col items-center justify-center bg-black/40 shadow-xl shadow-amber-500/20">
            <span className="text-2xl font-extrabold text-amber-300 tabular-nums">
              {progressPercent}%
            </span>
            <span className="text-[10px] text-emerald-300/70">مكتمل</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/50 h-2.5 rounded-full mt-6 overflow-hidden border border-emerald-800/40">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-300 transition-all duration-500"
          />
        </div>
      </div>

      {/* Days Checklist Grid */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-amber-300 mb-3 flex items-center justify-between">
          <span>جدول أيام الختمة ({targetDays} يوماً)</span>
          <span className="text-xs text-emerald-300/60 font-normal">اضغط على اليوم لتأكيد القراءة</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Array.from({ length: targetDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const isDone = completedDays.includes(dayNum);
            const startPage = Math.min(604, (dayNum - 1) * pagesPerDay + 1);
            const endPage = Math.min(604, dayNum * pagesPerDay);

            return (
              <button
                key={dayNum}
                onClick={() => toggleDay(dayNum)}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  isDone
                    ? 'bg-emerald-900/40 border-emerald-500/60 text-white shadow-sm'
                    : 'bg-[#082a1f]/60 border-emerald-800/40 text-emerald-200 hover:bg-[#0c392c]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300">اليوم {dayNum}</span>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>

                <div className="text-[11px] text-emerald-300/70">
                  صـ {startPage} إلى {endPage}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Islamic Calendar & Annual Events */}
      <div className="p-6 rounded-3xl bg-[#06241b]/80 border border-emerald-700/30">
        <h3 className="text-base font-bold text-amber-300 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span>المناسبات والأعياد الإسلامية الكبرى</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ISLAMIC_EVENTS.map((ev) => (
            <div
              key={ev.title}
              className="p-3.5 rounded-2xl bg-black/30 border border-emerald-800/30 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-white">{ev.title}</h4>
                <p className="text-[11px] text-emerald-300/70">{ev.note}</p>
              </div>
              <span className="text-[10px] text-amber-300 font-semibold px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                {ev.hijriMonth}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
