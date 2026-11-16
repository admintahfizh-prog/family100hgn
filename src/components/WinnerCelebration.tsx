import React from 'react';
import type { Team } from '../types/game.ts';
import { Trophy, Medal, RotateCcw, X, Sparkles } from 'lucide-react';

interface WinnerCelebrationProps {
  isOpen: boolean;
  teamA: Team;
  teamB: Team;
  readOnly?: boolean;
  onClose?: () => void;
  onRestartGame?: () => void;
}

export const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  isOpen,
  teamA,
  teamB,
  readOnly = false,
  onClose,
  onRestartGame,
}) => {
  if (!isOpen) return null;

  const isTie = teamA.score === teamB.score;
  const winner = teamA.score >= teamB.score ? teamA : teamB;
  const runnerUp = teamA.score >= teamB.score ? teamB : teamA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 sm:p-10 border-2 border-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.5)] text-center my-8">
        {!readOnly && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Emblem & Trophy */}
        <div className="mx-auto flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.7)] animate-bounce mb-4 border-4 border-amber-300">
          <Trophy className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>HASIL AKHIR LOMBA GURU HGN</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
          {isTie ? 'PERTANDINGAN BERAKHIR SERI!' : `SELAMAT UNTUK ${winner.name.toUpperCase()}!`}
        </h2>
        <p className="text-amber-400/90 text-sm sm:text-base font-semibold mb-8">
          &ldquo;Guru Hebat, Indonesia Kuat!&rdquo;
        </p>

        {/* Podium Standings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Champion */}
          <div className="relative rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 p-6 border-2 border-amber-400 text-center shadow-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow">
              {isTie ? 'JUARA BERSAMA' : 'JUARA 1 (Pemenang)'}
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-white truncate">
              {winner.name}
            </div>
            <div className="my-3 font-condensed font-black text-5xl sm:text-6xl text-amber-300 tabular-nums">
              {winner.score}
            </div>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              TOTAL POIN AKHIR
            </span>
          </div>

          {/* Runner-up */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/40 via-slate-900 to-slate-950 p-6 border border-slate-700 text-center shadow-lg">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider shadow flex items-center gap-1">
              <Medal className="w-3.5 h-3.5 text-slate-300" />
              <span>{isTie ? 'JUARA BERSAMA' : 'JUARA 2'}</span>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-slate-300 truncate">
              {runnerUp.name}
            </div>
            <div className="my-3 font-condensed font-black text-5xl sm:text-6xl text-slate-300 tabular-nums">
              {runnerUp.score}
            </div>
            <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              TOTAL POIN AKHIR
            </span>
          </div>
        </div>

        {/* Action Buttons (only shown on MC or interactive mode) */}
        {!readOnly && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {onRestartGame && (
              <button
                onClick={onRestartGame}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-xl transition-transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Mulai Pertandingan Baru</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
              >
                Tutup Papan Skor
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
