import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';

interface Sebha3DProps {
  onCountChange?: (count: number) => void;
}

export const Sebha3D: React.FC<Sebha3DProps> = ({ onCountChange }) => {
  const [count, setCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('noor_sebha_count') || '0', 10);
  });
  const [targetGoal, setTargetGoal] = useState<number>(33);
  const [selectedDhikr, setSelectedDhikr] = useState<string>('سُبْحَانَ اللَّهِ');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [beadIndex, setBeadIndex] = useState<number>(0);
  const [dailyTotal, setDailyTotal] = useState<number>(() => {
    return parseInt(localStorage.getItem('noor_sebha_daily_total') || '0', 10);
  });

  const DHIKR_PRESETS = [
    { title: 'سُبْحَانَ اللَّهِ', count: 33 },
    { title: 'الْحَمْدُ لِلَّهِ', count: 33 },
    { title: 'اللَّهُ أَكْبَرُ', count: 33 },
    { title: 'لَا إِلَهَ إِلَّا اللَّهُ', count: 100 },
    { title: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', count: 100 },
    { title: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', count: 100 },
    { title: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', count: 100 },
  ];

  // Procedural Web Audio bead click sound generator
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // AudioContext fallback
    }
  };

  const handleBeadClick = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    setBeadIndex((prev) => (prev + 1) % 33);
    const nextDaily = dailyTotal + 1;
    setDailyTotal(nextDaily);

    localStorage.setItem('noor_sebha_count', nextCount.toString());
    localStorage.setItem('noor_sebha_daily_total', nextDaily.toString());

    if (onCountChange) onCountChange(nextCount);

    playClickSound();

    if (vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  const handleReset = () => {
    if (window.confirm('هل تريد تصفير عداد التسبيح الحالي؟')) {
      setCount(0);
      localStorage.setItem('noor_sebha_count', '0');
      if (onCountChange) onCountChange(0);
    }
  };

  const handleSelectPreset = (preset: { title: string; count: number }) => {
    setSelectedDhikr(preset.title);
    setTargetGoal(preset.count);
    setCount(0);
  };

  const progressPercent = targetGoal > 0 ? Math.min(100, Math.round((count / targetGoal) * 100)) : 0;
  const isGoalReached = targetGoal > 0 && count >= targetGoal;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Preset Dhikr Selector */}
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {DHIKR_PRESETS.map((p) => (
          <button
            key={p.title}
            onClick={() => handleSelectPreset(p)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border ${
              selectedDhikr === p.title
                ? 'bg-[#c5a059] text-black font-bold border-[#c5a059] shadow-md shadow-amber-900/20'
                : 'bg-emerald-950/40 text-emerald-200 border-emerald-800/40 hover:bg-emerald-900/60'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Main 3D Bead Interactive Stage */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center my-4">
        {/* Outer Circular Ring representing 33 3D beads */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/20 pointer-events-none" />

        {/* Circular Beads array */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 33 }).map((_, i) => {
            const angle = (i * 360) / 33 - 90;
            const radius = 135; // px
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const isActive = i <= beadIndex;
            return (
              <div
                key={i}
                style={{
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                  left: '50%',
                  top: '50%',
                }}
                className={`absolute w-4 h-4 rounded-full transition-all duration-300 shadow-md ${
                  isActive
                    ? 'bg-gradient-to-tr from-amber-600 via-[#e5c158] to-yellow-200 shadow-amber-500/40 scale-110'
                    : 'bg-gradient-to-tr from-emerald-950 via-emerald-800 to-emerald-700 opacity-60 scale-90'
                }`}
              />
            );
          })}
        </div>

        {/* Center Tap Button & Counter */}
        <button
          onClick={handleBeadClick}
          aria-label="تسبيح"
          className="relative z-10 w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-[#0e4433] via-[#083024] to-[#041a13] border-4 border-[#c5a059]/40 shadow-2xl shadow-emerald-950/80 hover:border-[#c5a059] active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer group"
        >
          {/* Subtle inner metallic ring */}
          <div className="absolute inset-3 rounded-full border border-amber-400/20 pointer-events-none" />

          {/* Selected Dhikr label */}
          <span className="text-amber-200/90 text-sm md:text-base font-semibold px-4 text-center line-clamp-1 mb-1">
            {selectedDhikr}
          </span>

          {/* Large Main Digital Counter */}
          <div className="text-5xl md:text-6xl font-extrabold text-amber-300 tabular-nums tracking-wider drop-shadow-md">
            {count}
          </div>

          {/* Goal Indicator */}
          <div className="mt-2 text-xs text-emerald-300/80 flex items-center gap-1">
            {isGoalReached ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                اكتمل الهدف ({targetGoal})
              </span>
            ) : (
              <span>
                الهدف: {targetGoal > 0 ? targetGoal : 'حر'} ({progressPercent}%)
              </span>
            )}
          </div>

          <span className="mt-2 text-[11px] text-amber-200/50 group-hover:text-amber-200/80 transition-colors">
            اضغط للتسبيح
          </span>
        </button>
      </div>

      {/* Target Goal Selector */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-xs text-emerald-300/70">اختر الهدف:</span>
        {[33, 100, 1000, 0].map((goal) => (
          <button
            key={goal}
            onClick={() => setTargetGoal(goal)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
              targetGoal === goal
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300/70 hover:text-white'
            }`}
          >
            {goal === 0 ? 'حر' : goal}
          </button>
        ))}
      </div>

      {/* Sebha Tools Bar: Reset, Sound, Vibrate, Stats */}
      <div className="flex items-center justify-between w-full max-w-sm mt-6 p-3 rounded-2xl bg-[#082b20]/60 border border-emerald-700/30 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-colors ${
              soundEnabled ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'كتم صوت النقرة' : 'تفعيل صوت النقرة'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setVibrateEnabled(!vibrateEnabled)}
            className={`px-2.5 py-1.5 rounded-xl transition-colors border ${
              vibrateEnabled
                ? 'border-emerald-600/60 text-emerald-300 bg-emerald-900/30'
                : 'border-transparent text-slate-400'
            }`}
          >
            الاهتزاز {vibrateEnabled ? 'مفعل' : 'معطل'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-emerald-300/60">مجموع اليوم</span>
            <span className="text-amber-300 font-bold tabular-nums">{dailyTotal}</span>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-300 hover:bg-rose-950/40 transition-colors"
            title="تصفير العداد"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير</span>
          </button>
        </div>
      </div>
    </div>
  );
};
