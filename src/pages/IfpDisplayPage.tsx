import React, { useEffect, useRef, useState } from 'react';
import { INITIAL_QUESTIONS } from '../data/questions.ts';
import type { SoundEffectName, SurveyAnswer } from '../types/game.ts';
import { useFirestoreStage } from '../hooks/useFirestoreStage.ts';
import { getLiveTimerSeconds } from '../services/stageEngine.ts';
import { soundFx } from '../services/sound.ts';
import { SurveyBoard } from '../components/SurveyBoard.tsx';
import { TeamPodium } from '../components/TeamPodium.tsx';
import { StrikeOverlay } from '../components/StrikeOverlay.tsx';
import { CountdownTimer } from '../components/CountdownTimer.tsx';
import { RandomTeamModal } from '../components/RandomTeamModal.tsx';
import { WinnerCelebration } from '../components/WinnerCelebration.tsx';
import { ConfettiCanvas } from '../components/ConfettiCanvas.tsx';
import { IntroScreen } from '../components/IntroScreen.tsx';
import quizBackdropImg from '../assets/images/hgn_quiz_backdrop_1794450301211.jpg';
import stageEmblemImg from '../assets/images/hgn_stage_emblem_1794450299460.jpg';
import {
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Layers,
  Pause,
  Home,
  AlertTriangle,
} from 'lucide-react';

function playSoundByName(name?: SoundEffectName) {
  if (!name) return;
  switch (name) {
    case 'correct':
      soundFx.playCorrect();
      break;
    case 'wrong':
      soundFx.playWrong();
      break;
    case 'reveal':
      soundFx.playReveal();
      break;
    case 'points':
      soundFx.playPoints();
      break;
    case 'bell':
      soundFx.playBell();
      break;
    case 'drumRoll':
      soundFx.playDrumRoll();
      break;
    case 'applause':
      soundFx.playApplause();
      break;
    case 'fanfare':
      soundFx.playFanfare();
      break;
    case 'tick':
      soundFx.playCountdownTick();
      break;
    case 'timesUp':
      soundFx.playTimesUp();
      break;
  }
}

interface IfpDisplayPageProps {
  initialStageFromUrl?: string;
}

export const IfpDisplayPage: React.FC<IfpDisplayPageProps> = ({ initialStageFromUrl }) => {
  const { gameState, status, errorMessage, sendAction } = useFirestoreStage({
    requestedStageId: initialStageFromUrl,
  });

  const [localSoundEnabled, setLocalSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveSecondsLeft, setLiveSecondsLeft] = useState(10);

  // Transient FX states on IFP
  const [strikeOverlay, setStrikeOverlay] = useState<{
    show: boolean;
    count: number;
    teamName: string;
  }>({ show: false, count: 0, teamName: '' });
  const [floatingScore, setFloatingScore] = useState<{
    teamId: 'teamA' | 'teamB';
    amount: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const lastHandledEventIdRef = useRef<string | null>(null);
  const hasInitialSyncRef = useRef(false);
  const lastTickSecondRef = useRef<number | null>(null);

  // Sync mute state
  useEffect(() => {
    const enabled = localSoundEnabled && (gameState?.soundEnabled ?? true);
    soundFx.setMuted(!enabled);
  }, [localSoundEnabled, gameState?.soundEnabled]);

  // Smooth client-side countdown timer driven by Firestore startedAtMs
  useEffect(() => {
    if (!gameState?.timer) return;

    const updateTimer = () => {
      const nextSec = getLiveTimerSeconds(gameState.timer);
      setLiveSecondsLeft(nextSec);

      if (gameState.timer.isOpen && gameState.timer.isRunning) {
        if (lastTickSecondRef.current !== nextSec) {
          lastTickSecondRef.current = nextSec;
          if (nextSec === 0) {
            soundFx.playTimesUp();
          } else {
            soundFx.playCountdownTick();
          }
        }
      } else {
        lastTickSecondRef.current = null;
      }
    };

    updateTimer();
    if (!gameState.timer.isRunning) return;

    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [
    gameState?.timer?.isOpen,
    gameState?.timer?.isRunning,
    gameState?.timer?.secondsLeft,
    gameState?.timer?.startedAtMs,
  ]);

  // Listen to incoming events from Firestore for sound & visual FX
  useEffect(() => {
    if (!gameState) return;
    const ev = gameState.lastEvent;

    if (!hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
      lastHandledEventIdRef.current = ev?.id ?? null;
      return;
    }

    if (!ev || ev.id === lastHandledEventIdRef.current) return;
    lastHandledEventIdRef.current = ev.id;

    if (ev.type !== 'TIMER_TICK') {
      playSoundByName(ev.sound);
    }

    if (ev.type === 'STRIKE_ADDED') {
      setStrikeOverlay({
        show: true,
        count: ev.strikeCount || 1,
        teamName: ev.teamName || '',
      });
      setTimeout(() => {
        setStrikeOverlay((prev) => ({ ...prev, show: false }));
      }, 1400);
    }

    if (ev.type === 'ANSWER_REVEALED' && ev.teamId && ev.amount) {
      setFloatingScore({ teamId: ev.teamId, amount: ev.amount });
      setTimeout(() => setFloatingScore(null), 1500);
    }

    if (ev.confetti) {
      setShowConfetti(true);
    }
  }, [gameState]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4 p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 max-w-md space-y-2">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Gagal Terhubung ke Stage Firestore</h2>
          <p className="text-xs text-rose-200">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3 p-6">
        <div className="h-10 w-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-400">Menyiapkan Layar IFP Family 100 HGN...</p>
      </div>
    );
  }

  // Intro screen on IFP
  if (gameState.phase === 'INTRO') {
    return (
      <IntroScreen
        isReady={status === 'connected'}
        defaultTeamA={gameState.teams.teamA.name}
        defaultTeamB={gameState.teams.teamB.name}
        onStartGame={(nameA, nameB) => {
          soundFx.playCorrect();
          sendAction('START_GAME', { teamAName: nameA, teamBName: nameB });
        }}
      />
    );
  }

  const currentQIndex = gameState.questionOrder[gameState.currentQuestionIndex] ?? 0;
  const currentQuestion = INITIAL_QUESTIONS[currentQIndex] || INITIAL_QUESTIONS[0];

  const roundBadgeText =
    currentQuestion.round === 'BABAK_1'
      ? 'BABAK 1 – FAMILY 100'
      : currentQuestion.round === 'BABAK_2'
      ? 'BABAK 2 – GURU CERDAS'
      : 'BABAK 3 – SUPER BONUS HGN';

  const handleTouchSurveySlot = (ans: SurveyAnswer) => {
    if (gameState.revealedAnswerIds.includes(ans.id)) return;
    sendAction('REVEAL_ANSWER', { answerId: ans.id, givePoints: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Studio Set Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-25">
        <img
          src={quizBackdropImg}
          alt="Backdrop Arena"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-blue-950/50" />
      </div>

      {/* Stage Spotlights */}
      <div className="fixed -top-40 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -top-40 right-1/3 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Confetti & Overlays */}
      <ConfettiCanvas active={showConfetti} onFinish={() => setShowConfetti(false)} />
      <StrikeOverlay
        show={strikeOverlay.show}
        strikeCount={strikeOverlay.count}
        teamName={strikeOverlay.teamName}
      />

      {/* Pure IFP Header Bar (No MC PIN or MC link) */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & HGN Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0.5 bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shrink-0">
              <img
                src={stageEmblemImg}
                alt="Emblem HGN"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-condensed font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 tracking-tight">
                  FAMILY 100
                </span>
                <span className="hidden md:inline text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
                  SPECIAL HGN
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate hidden sm:block">
                Lomba Guru &mdash; &ldquo;Guru Hebat, Indonesia Kuat!&rdquo;
              </p>
            </div>
          </div>

          {/* Center Round Indicator */}
          <div className="flex items-center gap-2">
            <div className="px-3 sm:px-4 py-1 rounded-full bg-blue-900/40 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{roundBadgeText}</span>
            </div>

            {gameState.roundMultiplier > 1 && (
              <div className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 animate-pulse shadow-md">
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>POIN 2X</span>
              </div>
            )}
          </div>

          {/* Projector Utilities Only */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => sendAction('SET_PHASE', { phase: 'INTRO' })}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title="Kembali ke Layar Pembuka"
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setLocalSoundEnabled((prev) => !prev)}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title={localSoundEnabled ? 'Matikan Suara IFP' : 'Nyalakan Suara IFP'}
            >
              {localSoundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-400" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title="Layar Penuh IFP"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main TV Game Stage Content (Soal, Hasil Survey, dan Kelompok) */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {/* Question Header Card */}
        <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3 text-xs sm:text-sm font-semibold text-slate-400">
            <span className="text-amber-300 font-bold">
              Soal {gameState.currentQuestionIndex + 1} dari {gameState.questionOrder.length}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-200 font-bold">{currentQuestion.category}</span>
          </div>

          <div className="relative rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900/95 to-blue-950/80 p-5 sm:p-7 border-2 border-amber-400/50 shadow-[0_0_40px_rgba(30,58,138,0.4)]">
            <h2 className="font-sans font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-snug drop-shadow-md">
              &ldquo;{currentQuestion.question}&rdquo;
            </h2>

            {gameState.showTrivia && currentQuestion.trivia && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs sm:text-sm italic font-medium max-w-2xl mx-auto">
                <span className="font-bold not-italic">Tahukah Bapak/Ibu Guru? </span>
                {currentQuestion.trivia}
              </div>
            )}
          </div>
        </div>

        {/* TV Quiz Arena Grid: Team 1 Podium | 5-Slot Survey Board | Team 2 Podium */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
          {/* Left: TIM 1 Podium (Touchable on IFP to switch active turn, no clutter controls) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <TeamPodium
              team={gameState.teams.teamA}
              isActive={gameState.activeTeamId === 'teamA'}
              align="left"
              hideControls
              onSelectTeam={() => sendAction('SET_ACTIVE_TEAM', { teamId: 'teamA' })}
              floatingScore={
                floatingScore?.teamId === 'teamA' ? floatingScore.amount : null
              }
            />
          </div>

          {/* Center: 5 Survey Answers Board (Touchable on IFP to flip card & award points) */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <SurveyBoard
              answers={currentQuestion.answers}
              revealedAnswerIds={gameState.revealedAnswerIds}
              roundMultiplier={gameState.roundMultiplier}
              hideHints
              onSlotClick={handleTouchSurveySlot}
            />
          </div>

          {/* Right: TIM 2 Podium (Touchable on IFP to switch active turn, no clutter controls) */}
          <div className="lg:col-span-3 order-3">
            <TeamPodium
              team={gameState.teams.teamB}
              isActive={gameState.activeTeamId === 'teamB'}
              align="right"
              hideControls
              onSelectTeam={() => sendAction('SET_ACTIVE_TEAM', { teamId: 'teamB' })}
              floatingScore={
                floatingScore?.teamId === 'teamB' ? floatingScore.amount : null
              }
            />
          </div>
        </div>
      </main>

      {/* Pause Overlay triggered by MC */}
      {gameState.isPaused && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="rounded-3xl bg-slate-900 border-2 border-amber-400 p-8 text-center max-w-md shadow-2xl">
            <Pause className="w-14 h-14 text-amber-400 mx-auto mb-3" />
            <h3 className="font-condensed font-black text-4xl text-white uppercase tracking-wide mb-2">
              Permainan Dijeda
            </h3>
            <p className="text-slate-300 text-sm">
              Menunggu MC melanjutkan jalannya perlombaan...
            </p>
          </div>
        </div>
      )}

      {/* Synced 10-Second Rapid Challenge Modal */}
      <CountdownTimer
        isOpen={gameState.timer.isOpen}
        secondsLeft={liveSecondsLeft}
        isRunning={gameState.timer.isRunning}
        readOnly
      />

      {/* Synced Random Team Lottery Modal */}
      <RandomTeamModal
        isOpen={gameState.lottery.isOpen}
        isSpinning={gameState.lottery.isSpinning}
        winner={gameState.lottery.winner}
        teamAName={gameState.teams.teamA.name}
        teamBName={gameState.teams.teamB.name}
        readOnly
      />

      {/* Synced Final Winner Celebration Modal */}
      <WinnerCelebration
        isOpen={gameState.showWinnerModal}
        teamA={gameState.teams.teamA}
        teamB={gameState.teams.teamB}
        readOnly
      />
    </div>
  );
};
