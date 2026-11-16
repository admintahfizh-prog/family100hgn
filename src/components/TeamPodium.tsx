import React, { useState, useEffect } from 'react';
import type { Team } from '../types/game.ts';
import { X, Edit2, Check, Plus, Minus, Crown } from 'lucide-react';

interface TeamPodiumProps {
  team: Team;
  isActive: boolean;
  align: 'left' | 'right';
  readOnly?: boolean;
  hideControls?: boolean;
  onSelectTeam?: () => void;
  onUpdateTeamName?: (name: string) => void;
  onAdjustScore?: (delta: number) => void;
  floatingScore?: number | null;
}

export const TeamPodium: React.FC<TeamPodiumProps> = ({
  team,
  isActive,
  align,
  readOnly = false,
  hideControls = false,
  onSelectTeam,
  onUpdateTeamName,
  onAdjustScore,
  floatingScore,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(team.name);

  useEffect(() => {
    setEditedName(team.name);
  }, [team.name]);

  const handleSaveName = () => {
    if (editedName.trim() && onUpdateTeamName) {
      onUpdateTeamName(editedName.trim());
    }
    setIsEditing(false);
  };

  const isLeft = align === 'left';
  const canSelect = !readOnly && Boolean(onSelectTeam);
  const showEditControls = !readOnly && !hideControls;

  return (
    <div
      className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-b from-blue-900/90 via-slate-900/95 to-slate-950 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35)] scale-[1.02]'
          : 'bg-slate-900/80 border border-slate-800 opacity-90'
      }`}
    >
      {/* Floating score animation when points awarded */}
      {floatingScore !== null && floatingScore !== undefined && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-float-score font-condensed font-black text-3xl sm:text-4xl text-amber-300 drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)]">
          +{floatingScore}
        </div>
      )}

      {/* Active turn badge */}
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-1 whitespace-nowrap">
          <Crown className="w-3 h-3 fill-slate-950" />
          <span>Giliran Bermain</span>
        </div>
      )}

      {/* Team Header & Name */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {canSelect ? (
            <button
              type="button"
              onClick={onSelectTeam}
              className={`px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isLeft ? 'TIM 1' : 'TIM 2'}
            </button>
          ) : (
            <span
              className={`px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase shrink-0 ${
                isActive ? 'bg-amber-400 text-slate-950 shadow' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isLeft ? 'TIM 1' : 'TIM 2'}
            </span>
          )}

          {showEditControls && isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-slate-950 border border-amber-400/80 text-amber-200 text-sm font-bold px-2 py-0.5 rounded outline-none max-w-[140px]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="p-1 rounded bg-amber-400 text-slate-950 hover:bg-amber-300"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group min-w-0">
              <h3
                onClick={() => canSelect && onSelectTeam && onSelectTeam()}
                className={`font-bold text-base sm:text-lg text-slate-100 truncate ${
                  canSelect ? 'cursor-pointer hover:text-amber-300 transition-colors' : ''
                }`}
                title={team.name}
              >
                {team.name}
              </h3>
              {showEditControls && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-400 transition-opacity shrink-0"
                  title="Ubah nama tim"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick manual adjust score buttons (hidden when hideControls is true) */}
        {showEditControls && onAdjustScore && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onAdjustScore(-20)}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
              title="Kurang 20 poin"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onAdjustScore(20)}
              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
              title="Tambah 20 poin"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Big Digital Score Display */}
      <div
        onClick={() => canSelect && onSelectTeam && onSelectTeam()}
        className={`bg-slate-950/90 rounded-xl border border-slate-800 py-3 px-4 text-center my-2 shadow-inner ${
          canSelect ? 'cursor-pointer hover:border-amber-400/50 transition-colors active:scale-[0.99]' : ''
        }`}
      >
        <span className="text-xs uppercase tracking-widest text-slate-400 block mb-1">
          TOTAL SKOR
        </span>
        <div className="font-condensed font-black text-5xl sm:text-6xl text-amber-400 tracking-tight tabular-nums drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
          {team.score}
        </div>
      </div>

      {/* 3 Strikes (❌ ❌ ❌) Indicator */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Kesalahan:
        </span>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((strikeIndex) => {
            const hasStrike = team.strikes >= strikeIndex;
            return (
              <div
                key={strikeIndex}
                className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  hasStrike
                    ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-[0_0_16px_rgba(239,68,68,0.7)] animate-strike-shake border border-red-300 scale-105'
                    : 'bg-slate-950/80 text-slate-700 border border-slate-800'
                }`}
                title={`Strike ${strikeIndex} ${hasStrike ? '(Aktif)' : '(Kosong)'}`}
              >
                <X className={`w-5 h-5 sm:w-6 sm:h-6 ${hasStrike ? 'stroke-[3.5]' : 'stroke-[1.5]'}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
