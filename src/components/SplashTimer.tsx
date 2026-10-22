import React, { useEffect, useRef, useState } from 'react';
import { Timer, RotateCcw, Flame } from 'lucide-react';

interface SplashTimerProps {
  tofS: number | null; // shell time of flight in seconds
  lang: 'en' | 'ar';
  onFired?: () => void; // called once when the FIRE button is pressed (e.g. to log the mission)
}

/**
 * Splash countdown: press FIRE the moment the shell leaves the tube; the timer counts down
 * the time of flight, beeps every second during the last 5 s, and flashes SPLASH at impact.
 * Timing is based on performance.now() so it stays accurate even if the tab is busy.
 */
export const SplashTimer: React.FC<SplashTimerProps> = ({ tofS, lang, onFired }) => {
  const isAr = lang === 'ar';
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [splashed, setSplashed] = useState(false);
  const endAtRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastBeepSecRef = useRef(-1);

  const beep = (freq: number, durationS: number, atSec = 0, gain = 0.15) => {
    try {
      if (!audioRef.current) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        audioRef.current = new Ctx();
      }
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') void ctx.resume();
      const t0 = ctx.currentTime + atSec;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + durationS);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + durationS + 0.02);
    } catch {
      // audio is best-effort only
    }
  };

  const stop = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  const reset = () => {
    stop();
    setSplashed(false);
    setRemainingMs(0);
    lastBeepSecRef.current = -1;
  };

  const fire = () => {
    if (!tofS || tofS <= 0) return;
    onFired?.();
    endAtRef.current = performance.now() + tofS * 1000;
    setSplashed(false);
    setRemainingMs(tofS * 1000);
    lastBeepSecRef.current = -1;
    beep(880, 0.12); // launch confirmation
    stop();
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      const left = endAtRef.current - performance.now();
      if (left <= 0) {
        setRemainingMs(0);
        setSplashed(true);
        stop();
        beep(660, 0.35, 0, 0.2);
        beep(660, 0.35, 0.45, 0.2);
        return;
      }
      setRemainingMs(left);
      const secLeft = Math.ceil(left / 1000);
      if (secLeft <= 5 && secLeft !== lastBeepSecRef.current) {
        lastBeepSecRef.current = secLeft;
        beep(1200, 0.08);
      }
    }, 50);
  };

  useEffect(() => () => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    audioRef.current?.close().catch(() => undefined);
  }, []);

  const disabled = !tofS || tofS <= 0;
  const secs = remainingMs / 1000;
  const pct = running && tofS ? Math.max(0, Math.min(100, (remainingMs / (tofS * 1000)) * 100)) : 0;
  const urgent = running && secs <= 5.05;

  return (
    <div className="rounded-lg border border-amber-600/50 bg-amber-950/20 p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider inline-flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          {isAr ? 'مؤقّت سقوط القذيفة' : 'Splash Timer'}
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {isAr ? 'زمن التحليق' : 'TOF'}: {tofS ? `${tofS}s` : '---'}
        </span>
      </div>

      {/* Countdown display */}
      <div
        className={`text-center font-mono font-bold rounded-lg border py-1.5 mb-2 transition-colors ${
          splashed
            ? 'text-red-300 border-red-500 bg-red-950/60 animate-pulse text-2xl'
            : urgent
            ? 'text-red-300 border-red-700 bg-red-950/30 text-2xl'
            : running
            ? 'text-amber-300 border-amber-700 bg-slate-950/60 text-2xl'
            : 'text-slate-500 border-slate-800 bg-slate-950/40 text-xl'
        }`}
      >
        {splashed ? (isAr ? '💥 سقوط!' : '💥 SPLASH!') : running ? `${secs.toFixed(1)}s` : tofS ? `${tofS.toFixed(1)}s` : '--.-s'}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded bg-slate-800 overflow-hidden mb-2" dir="ltr">
        <div
          className={`h-full transition-[width] duration-75 ${urgent ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={fire}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            disabled
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-red-700 hover:bg-red-600 text-white shadow-md'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{isAr ? 'إطلاق!' : 'FIRE!'}</span>
        </button>
        <button
          onClick={reset}
          disabled={!running && !splashed}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            !running && !splashed
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={isAr ? 'إعادة ضبط' : 'Reset'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[9px] text-slate-500 font-mono mt-1.5">
        {isAr
          ? 'اضغط «إطلاق» لحظة خروج القذيفة — ينبّهك صوتياً قبل السقوط بـ 5 ثوانٍ. تُحفظ المهمة في السجل تلقائياً.'
          : 'Press FIRE as the shell leaves the tube — audio warning 5 s before impact. The mission is saved to the log automatically.'}
      </p>
    </div>
  );
};
