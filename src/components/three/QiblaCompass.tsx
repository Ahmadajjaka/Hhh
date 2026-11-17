import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Navigation, Info, RefreshCw } from 'lucide-react';
import { calculateQiblaBearing, calculateDistanceToKaaba, KAABA_COORDS } from '../../utils/prayerCalculator';

interface QiblaCompassProps {
  userCoords: { latitude: number; longitude: number };
  cityName?: string;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ userCoords, cityName = 'موقعك الحالي' }) => {
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  const qiblaBearing = calculateQiblaBearing(userCoords.latitude, userCoords.longitude);
  const distanceKm = calculateDistanceToKaaba(userCoords.latitude, userCoords.longitude);

  // Compass heading difference
  const compassRotation = (qiblaBearing - deviceHeading + 360) % 360;
  const isAligned = Math.abs(compassRotation) < 4 || Math.abs(compassRotation - 360) < 4;

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;
      // WebkitCompassHeading on iOS
      if ('webkitCompassHeading' in e && typeof (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number') {
        heading = (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Android fallback (alpha represents rotation around z axis)
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null) {
        setDeviceHeading(Math.round(heading));
        setHasCompassSensor(true);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const requestCompassPermission = async () => {
    setIsCalibrating(true);
    // iOS 13+ requires explicit permission
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission!();
        if (response === 'granted') {
          setHasCompassSensor(true);
        }
      } catch {
        // Handle permission rejection
      }
    }
    setTimeout(() => setIsCalibrating(false), 1200);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center p-4 pb-28">
      {/* City & Distance Card */}
      <div className="w-full bg-[#082b20]/70 border border-emerald-700/30 rounded-2xl p-4 mb-6 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{cityName}</h4>
            <p className="text-xs text-emerald-300/70">
              {userCoords.latitude.toFixed(2)}°N, {userCoords.longitude.toFixed(2)}°E
            </p>
          </div>
        </div>

        <div className="text-left">
          <span className="text-xs text-amber-200/60 block">المسافة إلى مكة</span>
          <span className="text-sm font-bold text-amber-300 tabular-nums">
            {distanceKm.toLocaleString('ar-SA')} كم
          </span>
        </div>
      </div>

      {/* 3D Circular Compass Dial */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center my-2">
        {/* Outer Golden Compass Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[#c5a059]/40 shadow-2xl shadow-emerald-950/90 bg-gradient-to-b from-[#07241b] to-[#03150f] p-3">
          {/* Degree Ticks */}
          <div className="w-full h-full rounded-full border border-amber-500/20 relative">
            {/* Cardinal Directions */}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-rose-400">ش</span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-300">ج</span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-300">غ</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-300">ق</span>
          </div>
        </div>

        {/* Rotating Compass Needle Dial */}
        <div
          style={{ transform: `rotate(${compassRotation}deg)` }}
          className="relative w-60 h-60 flex items-center justify-center transition-transform duration-300 ease-out pointer-events-none"
        >
          {/* Needle Arrow pointing to Kaaba */}
          <div className="absolute top-4 flex flex-col items-center">
            {/* Kaaba Mini Icon */}
            <div className="w-8 h-8 rounded-lg bg-black border border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-1">
              <span className="text-[11px] font-bold text-amber-300">الكعبة</span>
            </div>
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[20px] border-b-amber-400" />
          </div>

          {/* Compass Center Pivot */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-2 border-black/40 shadow-xl flex items-center justify-center">
            <Compass className="w-8 h-8 text-slate-950" />
          </div>

          {/* Opposite southern pointer */}
          <div className="absolute bottom-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[14px] border-t-emerald-600/60" />
        </div>

        {/* Alignment Badge */}
        {isAligned && (
          <div className="absolute bottom-3 bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
            أنت الآن باتجاه القبلة تماماً!
          </div>
        )}
      </div>

      {/* Angle Readings & Status */}
      <div className="mt-4 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold text-amber-300 tabular-nums">
            {Math.round(qiblaBearing)}°
          </span>
          <span className="text-sm text-emerald-200/80">من اتجاه الشمال الحقيقي</span>
        </div>

        {hasCompassSensor ? (
          <p className="text-xs text-emerald-300/60 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            البوصلة الحية تعمل وتستجيب لحركة جهازك
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2 mt-1">
            <p className="text-xs text-amber-200/70">
              وجّه أعلى هاتفك نحو {Math.round(qiblaBearing)} درجة باتجاه مكة المكرمة
            </p>
            <button
              onClick={requestCompassPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
              <span>معايرة حساس البوصلة</span>
            </button>
          </div>
        )}
      </div>

      {/* Calibration Tips */}
      <div className="mt-6 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/30 text-[11px] text-emerald-300/70 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          للحصول على أدق قراءة: أمسك الجهاز بشكل أفقي موازٍ للأرض، وابتعد عن الأجهزة الإلكترونية والمعادن، وحرك الهاتف على شكل رقم 8 لمعايرة الحساس.
        </span>
      </div>
    </div>
  );
};
