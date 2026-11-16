import React from 'react';
import { X } from 'lucide-react';

interface StrikeOverlayProps {
  show: boolean;
  strikeCount: number;
  teamName: string;
}

export const StrikeOverlay: React.FC<StrikeOverlayProps> = ({ show, strikeCount, teamName }) => {
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="flex flex-col items-center justify-center animate-strike-shake text-center">
        <div className="flex items-center gap-4 sm:gap-6">
          {Array.from({ length: strikeCount }).map((_, idx) => (
            <div
              key={idx}
              className="flex h-32 w-32 sm:h-44 sm:w-44 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-[0_0_80px_rgba(239,68,68,0.9)] border-4 border-white"
            >
              <X className="h-24 w-24 sm:h-36 sm:w-36 stroke-[3.5] drop-shadow-md" />
            </div>
          ))}
        </div>

        <div className="mt-6 px-6 py-2 rounded-2xl bg-black/80 border-2 border-red-500 text-red-400 font-condensed font-black text-2xl sm:text-4xl uppercase tracking-wider shadow-2xl">
          SALAH! {teamName} ({strikeCount} KESALAHAN)
        </div>
      </div>
    </div>
  );
};
