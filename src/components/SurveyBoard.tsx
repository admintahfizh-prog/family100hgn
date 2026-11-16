import React from 'react';
import type { SurveyAnswer } from '../types/game.ts';

interface SurveyBoardProps {
  answers: SurveyAnswer[];
  revealedAnswerIds: number[];
  roundMultiplier: number;
  readOnly?: boolean;
  hideHints?: boolean;
  onSlotClick?: (answer: SurveyAnswer) => void;
}

export const SurveyBoard: React.FC<SurveyBoardProps> = ({
  answers,
  revealedAnswerIds,
  roundMultiplier,
  readOnly = false,
  hideHints = false,
  onSlotClick,
}) => {
  const isInteractive = !readOnly && Boolean(onSlotClick);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3.5">
      {answers.map((answer) => {
        const isRevealed = revealedAnswerIds.includes(answer.id);
        const displayPoints = answer.points * roundMultiplier;

        return (
          <div
            key={answer.id}
            onClick={() => isInteractive && onSlotClick && onSlotClick(answer)}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={(e) => {
              if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                if (onSlotClick) onSlotClick(answer);
              }
            }}
            className={`perspective-1000 h-16 sm:h-20 w-full rounded-xl select-none ${
              isInteractive
                ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-[0.99] transition-transform'
                : 'cursor-default'
            }`}
            title={
              !isInteractive
                ? undefined
                : isRevealed
                ? answer.text
                : `Ketuk untuk membuka jawaban #${answer.rank}`
            }
          >
            <div
              className={`relative h-full w-full rounded-xl transition-transform duration-700 preserve-3d shadow-xl ${
                isRevealed ? 'rotate-y-180' : ''
              }`}
            >
              {/* BACK FACE (Unrevealed / Shutter State) */}
              <div
                className={`absolute inset-0 backface-hidden rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-2 border-blue-500/40 p-2 sm:p-3 flex items-center justify-between shadow-inner ${
                  isInteractive ? 'hover:border-amber-400/80 transition-colors' : ''
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 pl-2">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-condensed text-2xl sm:text-3xl font-black shadow-md border border-amber-200">
                    {answer.rank}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-bold tracking-wider text-blue-200/90 uppercase">
                      Survei #{answer.rank}
                    </span>
                    {!hideHints && isInteractive && (
                      <span className="text-slate-400 text-xs hidden sm:inline">
                        Ketuk untuk membuka jawaban
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center pr-2">
                  <div className="px-3 py-1.5 rounded-lg bg-blue-900/60 border border-blue-400/30 text-blue-200 font-condensed font-bold text-sm sm:text-base tracking-widest uppercase">
                    TERTUTUP
                  </div>
                </div>
              </div>

              {/* FRONT FACE (Revealed State - Rotated 180deg) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 border-2 border-amber-200 p-2 sm:p-3 flex items-center justify-between text-slate-950 shadow-2xl">
                <div className="flex items-center gap-3 sm:gap-4 pl-2 overflow-hidden">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-amber-400 font-condensed text-2xl sm:text-3xl font-black shadow border border-amber-400/40">
                    {answer.rank}
                  </div>
                  <span className="text-base sm:text-xl md:text-2xl font-extrabold tracking-tight text-slate-950 truncate drop-shadow-sm">
                    {answer.text}
                  </span>
                </div>

                <div className="flex items-center pr-2 shrink-0 pl-3">
                  <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-slate-950 text-amber-300 border border-amber-400 font-condensed font-black text-xl sm:text-3xl tracking-tight shadow-md">
                    <span className="tabular-nums">{displayPoints}</span>
                    <span className="text-xs sm:text-sm font-sans font-semibold text-amber-200 uppercase tracking-normal">
                      Poin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
