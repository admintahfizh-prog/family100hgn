import React, { useEffect, useState } from 'react';
import { Sparkles, Dices, X, CheckCircle2 } from 'lucide-react';

interface RandomTeamModalProps {
  isOpen: boolean;
  isSpinning: boolean;
  winner: 'teamA' | 'teamB' | null;
  teamAName: string;
  teamBName: string;
  readOnly?: boolean;
  onClose?: () => void;
  onSpin?: () => void;
  onApplyWinner?: () => void;
}

export const RandomTeamModal: React.FC<RandomTeamModalProps> = ({
  isOpen,
  isSpinning,
  winner,
  teamAName,
  teamBName,
  readOnly = false,
  onClose,
  onSpin,
  onApplyWinner,
}) => {
  const [currentDisplay, setCurrentDisplay] = useState<'teamA' | 'teamB'>('teamA');

  useEffect(() => {
    if (!isSpinning) {
      if (winner) setCurrentDisplay(winner);
      return;
    }

    const interval = setInterval(() => {
      setCurrentDisplay((prev) => (prev === 'teamA' ? 'teamB' : 'teamA'));
    }, 80);

    return () => clearInterval(interval);
  }, [isSpinning, winner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 sm:p-8 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center">
        {!readOnly && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Dices className="w-4 h-4" />
          <span>Undian Giliran Pertama</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Siapakah yang Main Duluan?
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Kocok undian untuk menentukan tim yang berhak membuka jawaban survei pertama!
        </p>

        {/* Display Podium */}
        <div className="my-6 p-6 rounded-2xl bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center min-h-[160px]">
          <div
            className={`transition-all duration-150 transform ${
              isSpinning ? 'scale-110' : 'scale-100'
            }`}
          >
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">
              {currentDisplay === 'teamA' ? 'TIM 1' : 'TIM 2'}
            </div>
            <div className="font-condensed font-black text-3xl sm:text-4xl text-amber-400 tracking-wide">
              {currentDisplay === 'teamA' ? teamAName : teamBName}
            </div>
          </div>

          {!isSpinning && winner && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>TERPILIH MAIN PERTAMA!</span>
            </div>
          )}
        </div>

        {/* Buttons (MC only) */}
        {!readOnly && (
          <div className="flex items-center justify-center gap-3">
            {onSpin && (
              <button
                onClick={onSpin}
                disabled={isSpinning}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSpinning ? 'Mengundi...' : 'Mulai Undian!'}</span>
              </button>
            )}

            {!isSpinning && winner && onApplyWinner && (
              <button
                onClick={onApplyWinner}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg transition-transform active:scale-95"
              >
                Terapkan Giliran
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
