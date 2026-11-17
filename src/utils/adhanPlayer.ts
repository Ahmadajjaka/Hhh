import { ADHAN_RECORDINGS } from '../data/quranMeta';
import { cacheAudioForOffline, getPlayableAudioSrc } from './quranAudioAndTafsir';

export interface AdhanRecording {
  id: string;
  titleArabic: string;
  titleEnglish: string;
  audioUrl: string;
  fallbackAudioUrl?: string;
}

export interface AdhanPlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'error';
  recordingId: string | null;
  recordingTitle: string | null;
  prayerLabel: string | null;
  errorMessage: string | null;
}

type StateListener = (state: AdhanPlaybackState) => void;

const listeners = new Set<StateListener>();
let sharedAudio: HTMLAudioElement | null = null;
let activePlayToken = 0;
let triggeredEventsMemory: Record<string, boolean> = {};

let currentState: AdhanPlaybackState = {
  status: 'idle',
  recordingId: null,
  recordingTitle: null,
  prayerLabel: null,
  errorMessage: null,
};

function notify() {
  for (const listener of listeners) {
    listener({ ...currentState });
  }
}

function setState(partial: Partial<AdhanPlaybackState>) {
  currentState = { ...currentState, ...partial };
  notify();
}

export function subscribeAdhanState(listener: StateListener): () => void {
  listeners.add(listener);
  listener({ ...currentState });
  return () => {
    listeners.delete(listener);
  };
}

export function getAdhanState(): AdhanPlaybackState {
  return { ...currentState };
}

export function getAdhanRecordingById(id?: string | null): AdhanRecording {
  return ADHAN_RECORDINGS.find((r) => r.id === id) || ADHAN_RECORDINGS[0];
}

export function buildAdhanCandidateUrls(recording: AdhanRecording): string[] {
  const candidates = [recording.audioUrl, recording.fallbackAudioUrl].filter(
    (u): u is string => typeof u === 'string' && u.trim().length > 0
  );
  return Array.from(new Set(candidates));
}

export function setLiveAdhanVolume(volume: number): void {
  const safeVol = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0.85));
  if (sharedAudio) {
    sharedAudio.volume = safeVol;
  }
}

export function stopAdhanAudio(): void {
  activePlayToken += 1;
  if (sharedAudio) {
    try {
      sharedAudio.pause();
      sharedAudio.currentTime = 0;
    } catch {}
  }
  setState({
    status: 'idle',
    recordingId: null,
    recordingTitle: null,
    prayerLabel: null,
    errorMessage: null,
  });
}

async function tryPlaySource(
  src: string,
  volume: number,
  token: number
): Promise<void> {
  if (typeof Audio === 'undefined') {
    throw new Error('Audio API not supported');
  }

  if (!sharedAudio) {
    sharedAudio = new Audio();
  }

  const audio = sharedAudio;
  audio.pause();
  audio.preload = 'auto';
  audio.volume = Math.max(0, Math.min(1, volume));

  const playable = await getPlayableAudioSrc(src);
  if (token !== activePlayToken) {
    throw new Error('Cancelled');
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
    };

    const onPlaying = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Audio element failed to load source'));
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);
    audio.onended = () => {
      if (token === activePlayToken) {
        setState({
          status: 'idle',
          recordingId: null,
          recordingTitle: null,
          prayerLabel: null,
          errorMessage: null,
        });
      }
    };

    audio.src = playable;
    audio.load();

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          if (!settled) {
            settled = true;
            cleanup();
            resolve();
          }
        })
        .catch((err) => {
          if (!settled) {
            settled = true;
            cleanup();
            reject(err);
          }
        });
    }
  });
}

export async function playAdhanAudio(options?: {
  recordingId?: string | null;
  volume?: number;
  prayerLabel?: string | null;
}): Promise<{ ok: boolean; reason?: 'autoplay_blocked' | 'muted' | 'network_error' | 'cancelled'; message?: string }> {
  const volume = Math.max(
    0,
    Math.min(
      1,
      typeof options?.volume === 'number' && Number.isFinite(options.volume)
        ? options.volume
        : (() => {
            try {
              const v = parseFloat(localStorage.getItem('noor_adhan_volume') || '0.85');
              return Number.isFinite(v) ? v : 0.85;
            } catch {
              return 0.85;
            }
          })()
    )
  );

  if (volume <= 0.01) {
    const msg = 'مستوى صوت الأذان مضبوط على 0% — ارفع شريط الصوت لسماع الأذان.';
    setState({
      status: 'error',
      recordingId: null,
      recordingTitle: null,
      prayerLabel: options?.prayerLabel || null,
      errorMessage: msg,
    });
    return { ok: false, reason: 'muted', message: msg };
  }

  const recording = getAdhanRecordingById(
    options?.recordingId ||
      (() => {
        try {
          return localStorage.getItem('noor_selected_adhan_id');
        } catch {
          return null;
        }
      })()
  );

  const token = ++activePlayToken;
  setState({
    status: 'loading',
    recordingId: recording.id,
    recordingTitle: recording.titleArabic,
    prayerLabel: options?.prayerLabel || null,
    errorMessage: null,
  });

  const candidates = buildAdhanCandidateUrls(recording);

  let lastError: unknown = null;
  for (const url of candidates) {
    if (token !== activePlayToken) {
      return { ok: false, reason: 'cancelled' };
    }
    try {
      await tryPlaySource(url, volume, token);
      if (token !== activePlayToken) {
        return { ok: false, reason: 'cancelled' };
      }
      setState({
        status: 'playing',
        recordingId: recording.id,
        recordingTitle: recording.titleArabic,
        prayerLabel: options?.prayerLabel || null,
        errorMessage: null,
      });
      // Cache successfully played track under primary + resolved URLs for permanent offline playback
      cacheAudioForOffline(recording.audioUrl, url !== recording.audioUrl ? url : recording.fallbackAudioUrl).catch(() => {});
      return { ok: true };
    } catch (err) {
      lastError = err;
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError') {
        const msg =
          'قام المتصفح بمنع التشغيل التلقائي للصوت — اضغط على زر «تشغيل الأذان» أو أيقونة الاستماع.';
        setState({
          status: 'error',
          recordingId: recording.id,
          recordingTitle: recording.titleArabic,
          prayerLabel: options?.prayerLabel || null,
          errorMessage: msg,
        });
        return { ok: false, reason: 'autoplay_blocked', message: msg };
      }
    }
  }

  const fallbackErrMsg =
    lastError instanceof Error && lastError.message === 'Cancelled'
      ? undefined
      : 'تعذر تحميل ملف صوت الأذان حالياً. يرجى التأكد من اتصال الإنترنت أو تجربة مؤذن آخر.';
  if (!fallbackErrMsg) {
    return { ok: false, reason: 'cancelled' };
  }

  setState({
    status: 'error',
    recordingId: recording.id,
    recordingTitle: recording.titleArabic,
    prayerLabel: options?.prayerLabel || null,
    errorMessage: fallbackErrMsg,
  });
  return { ok: false, reason: 'network_error', message: fallbackErrMsg };
}

export function markAdhanEventTriggered(eventId: string): boolean {
  if (triggeredEventsMemory[eventId]) return false;
  try {
    const key = `noor_triggered_event_${eventId}`;
    if (sessionStorage.getItem(key) === '1') {
      triggeredEventsMemory[eventId] = true;
      return false;
    }
    sessionStorage.setItem(key, '1');
  } catch {}
  triggeredEventsMemory[eventId] = true;
  return true;
}
