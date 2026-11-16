import React from 'react';
import { Clock, Play, Pause, RotateCcw, X } from 'lucide-react';

interface CountdownTimerProps {
  isOpen: boolean;
  secondsLeft: number;
  isRunning: boolean;
  readOnly?: boolean;
  onClose?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  isOpen,
  secondsLeft,
  isRunning,
  readOnly = false,
  onClose,
  onStart,
  onPause,
  onReset,
}) => {
  if (!isOpen) return null;

  const isCritical = secondsLeft <= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center">
        {!readOnly && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center justify-center gap-2 mb-2 text-amber-400 font-bold uppercase tracking-wider text-sm">
          <Clock className="w-4 h-4 animate-spin text-amber-400" />
          <span>Tantangan Kilat Guru (10 Detik)</span>
        </div>

        <p className="text-slate-300 text-sm mb-6">
          Waktu berjalan cepat! Berikan jawaban terbaik sebelum bel berbunyi!
        </p>

        {/* Big Circular Counter */}
        <div className="relative mx-auto my-4 flex h-48 w-48 items-center justify-center rounded-full bg-slate-950 border-8 border-slate-800 shadow-2xl">
          <div
            className={`font-condensed font-black text-8xl tracking-tight tabular-nums transition-all ${
              secondsLeft === 0
                ? 'text-red-500 animate-pulse scale-110'
                : isCritical
                ? 'text-rose-500 animate-strike-shake'
                : 'text-amber-400'
            }`}
          >
            {secondsLeft}
          </div>
          <span className="absolute bottom-6 text-xs uppercase tracking-widest text-slate-500 font-bold">
            {secondsLeft === 0 ? 'WAKTU HABIS!' : 'DETIK'}
          </span>
        </div>

        {/* Controls (only shown if not readOnly) */}
        {!readOnly && (
          <div className="flex items-center justify-center gap-3 mt-6">
            {onReset && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset 10s</span>
              </button>
            )}

            <button
              onClick={isRunning ? onPause : onStart}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold shadow-md transition-colors"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
              <span>{isRunning ? 'Jeda' : 'Mulai'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
