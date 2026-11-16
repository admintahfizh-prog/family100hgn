import React, { useState, useEffect } from 'react';
import { INITIAL_QUESTIONS } from '../data/questions.ts';
import quizBackdropImg from '../assets/images/hgn_quiz_backdrop_1794450301211.jpg';
import stageEmblemImg from '../assets/images/hgn_stage_emblem_1794450299460.jpg';
import {
  Trophy,
  Sparkles,
  Users,
  Award,
  BookOpen,
  Monitor,
} from 'lucide-react';

interface IntroScreenProps {
  isReady: boolean;
  defaultTeamA: string;
  defaultTeamB: string;
  onStartGame: (teamAName: string, teamBName: string) => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  isReady,
  defaultTeamA,
  defaultTeamB,
  onStartGame,
}) => {
  const [teamAName, setTeamAName] = useState(defaultTeamA || 'Tim Ki Hajar Dewantara');
  const [teamBName, setTeamBName] = useState(defaultTeamB || 'Tim R.A. Kartini');

  useEffect(() => {
    if (defaultTeamA) setTeamAName(defaultTeamA);
  }, [defaultTeamA]);

  useEffect(() => {
    if (defaultTeamB) setTeamBName(defaultTeamB);
  }, [defaultTeamB]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame(teamAName.trim() || 'Tim 1', teamBName.trim() || 'Tim 2');
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      {/* Background Studio Visuals */}
      <div className="absolute inset-0 z-0 opacity-40">
        <img
          src={quizBackdropImg}
          alt="TV Studio Quiz Arena"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-blue-950/60" />
      </div>

      {/* Decorative Stage Spotlights */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl bg-slate-900/90 border-2 border-amber-400/80 shadow-[0_0_80px_rgba(245,158,11,0.25)] p-6 sm:p-10 backdrop-blur-md text-center">
        {/* HGN Logo Emblem */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full p-1 bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_40px_rgba(245,158,11,0.6)]">
            <img
              src={stageEmblemImg}
              alt="Logo Hari Guru Nasional"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Header Titles */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-widest mb-2">
          <Award className="w-3.5 h-3.5 text-red-400" />
          <span>LOMBA GURU – SPECIAL HARI GURU NASIONAL</span>
        </div>

        <h1 className="font-condensed font-black text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 tracking-tight uppercase drop-shadow-md">
          FAMILY 100
        </h1>

        <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto mt-1 mb-1">
          &ldquo;Semangat Menginspirasi, Mendidik, dan Mengabdi&rdquo;
        </p>

        <div className="text-xs sm:text-sm text-amber-400 font-bold uppercase tracking-wider mb-7">
          &mdash; Guru Hebat, Indonesia Kuat! &mdash;
        </div>

        {/* Team Setup Form */}
        <form onSubmit={handleStart} className="space-y-5 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="rounded-2xl bg-slate-950/80 border border-blue-500/40 p-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>NAMA TIM 1</span>
              </label>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                placeholder="Nama Tim 1..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-white text-sm outline-none font-semibold"
                required
              />
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-rose-500/40 p-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>NAMA TIM 2</span>
              </label>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                placeholder="Nama Tim 2..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-white text-sm outline-none font-semibold"
                required
              />
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isReady}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-condensed font-black text-2xl tracking-wider uppercase shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Monitor className="w-6 h-6" />
              <span>TAMPILKAN LAYAR IFP</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-7 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {INITIAL_QUESTIONS.length} Soal Pilihan (Termasuk 10 Soal Ringan)
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            3 Babak Pertandingan
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Special Hari Guru Nasional
          </span>
        </div>
      </div>
    </div>
  );
};
