import React, { useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_QUESTIONS } from '../data/questions.ts';
import type { SoundEffectName, SurveyAnswer } from '../types/game.ts';
import { useFirestoreStage } from '../hooks/useFirestoreStage.ts';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext.tsx';
import { getLiveTimerSeconds } from '../services/stageEngine.ts';
import { firebaseConfig } from '../firebase.ts';
import { matchUserAnswer } from '../services/fuzzyMatch.ts';
import { soundFx } from '../services/sound.ts';
import { TeamPodium } from '../components/TeamPodium.tsx';
import {
  KeyRound,
  Send,
  XCircle,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Sparkles,
  Clock,
  Dices,
  Pause,
  Play,
  Sliders,
  CheckCircle2,
  Search,
  Monitor,
  Info,
  LogOut,
  Trophy,
  AlertTriangle,
  Home,
  Cloud,
  Copy,
  Check,
  Settings,
  Trash2,
  Save,
  X,
} from 'lucide-react';

const MC_UNLOCKED_STORAGE_KEY = 'hgn_family100_mc_unlocked_pin';

interface McControlPageProps {
  initialPinFromUrl?: string;
  initialStageFromUrl?: string;
  onNavigateToIfp: () => void;
}

type QuestionFilter = 'ALL' | 'RINGAN' | 'BABAK_1' | 'BABAK_2' | 'BABAK_3';

export const McControlPage: React.FC<McControlPageProps> = ({
  initialPinFromUrl,
  initialStageFromUrl,
  onNavigateToIfp,
}) => {
  const { user, signOutUser } = useFirebaseAuth();
  const [overrideStageId, setOverrideStageId] = useState<string | undefined>(initialStageFromUrl);
  const [stageInput, setStageInput] = useState(initialStageFromUrl || '');
  const [showStageSwitch, setShowStageSwitch] = useState(false);

  const {
    stageId,
    stageDoc,
    gameState,
    matches,
    status,
    errorMessage,
    isOwner,
    sendAction,
    updateStageSettings,
    saveMatchRecord,
    deleteMatchRecord,
  } = useFirestoreStage({
    requestedStageId: overrideStageId,
  });

  const [pinInput, setPinInput] = useState(
    initialPinFromUrl || sessionStorage.getItem(MC_UNLOCKED_STORAGE_KEY) || ''
  );
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // MC local UI state
  const [answerInput, setAnswerInput] = useState('');
  const [feedback, setFeedback] = useState<{
    text: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);
  const [mcPreviewAudio, setMcPreviewAudio] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Firebase / Vercel Settings & Match History modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [coHostEmailInput, setCoHostEmailInput] = useState('');
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [copiedLinkType, setCopiedLinkType] = useState<'mc' | 'ifp' | null>(null);
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // Intro edit names on MC
  const [introTeamA, setIntroTeamA] = useState('Tim Ki Hajar Dewantara');
  const [introTeamB, setIntroTeamB] = useState('Tim R.A. Kartini');
  const [liveSecondsLeft, setLiveSecondsLeft] = useState(10);

  const lotteryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerExpireTriggeredRef = useRef(false);

  // Auto-verify saved or URL PIN once stageDoc arrives
  useEffect(() => {
    if (!stageDoc || unlockedPin) return;
    const candidate = (
      initialPinFromUrl ||
      sessionStorage.getItem(MC_UNLOCKED_STORAGE_KEY) ||
      ''
    ).trim();
    if (candidate && candidate === stageDoc.mcPin) {
      setUnlockedPin(candidate);
      setPinError(null);
    }
  }, [stageDoc, initialPinFromUrl, unlockedPin]);

  // If owner changed PIN remotely, revalidate unlockedPin
  useEffect(() => {
    if (stageDoc && unlockedPin && unlockedPin !== stageDoc.mcPin) {
      setUnlockedPin(null);
      sessionStorage.removeItem(MC_UNLOCKED_STORAGE_KEY);
      setPinError('PIN MC baru saja diperbarui. Silakan masukkan PIN terbaru.');
    }
  }, [stageDoc, unlockedPin]);

  // Sync MC local preview audio mute
  useEffect(() => {
    soundFx.setMuted(!mcPreviewAudio);
  }, [mcPreviewAudio]);

  // Sync intro team names when gameState arrives
  useEffect(() => {
    if (gameState) {
      setIntroTeamA(gameState.teams.teamA.name);
      setIntroTeamB(gameState.teams.teamB.name);
    }
  }, [gameState?.teams.teamA.name, gameState?.teams.teamB.name]);

  // Live timer display & authoritative expiry update to Firestore
  useEffect(() => {
    if (!gameState?.timer) return;

    const tick = () => {
      const nextSec = getLiveTimerSeconds(gameState.timer);
      setLiveSecondsLeft(nextSec);

      if (gameState.timer.isRunning && nextSec === 0 && !timerExpireTriggeredRef.current) {
        timerExpireTriggeredRef.current = true;
        void sendAction('TIMER_EXPIRE');
      }
    };

    if (gameState.timer.isRunning) {
      timerExpireTriggeredRef.current = false;
    }

    tick();
    if (!gameState.timer.isRunning) return;

    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [
    gameState?.timer?.isOpen,
    gameState?.timer?.isRunning,
    gameState?.timer?.secondsLeft,
    gameState?.timer?.startedAtMs,
    sendAction,
  ]);

  // Cleanup lottery spin timer on unmount
  useEffect(() => {
    return () => {
      if (lotteryTimerRef.current) {
        clearTimeout(lotteryTimerRef.current);
      }
    };
  }, []);

  // Filtered question bank for MC selector
  const filteredQuestions = useMemo(() => {
    return INITIAL_QUESTIONS.filter((q) => {
      if (questionFilter === 'RINGAN' && q.category !== 'Soal Ringan') return false;
      if (questionFilter === 'BABAK_1' && q.round !== 'BABAK_1') return false;
      if (questionFilter === 'BABAK_2' && q.round !== 'BABAK_2') return false;
      if (questionFilter === 'BABAK_3' && q.round !== 'BABAK_3') return false;

      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase();
        return (
          q.question.toLowerCase().includes(s) ||
          q.category.toLowerCase().includes(s) ||
          String(q.id).includes(s)
        );
      }
      return true;
    });
  }, [questionFilter, searchQuery]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim();
    if (!/^\d{4,6}$/.test(clean)) {
      setPinError('Masukkan 4 sampai 6 digit angka PIN MC.');
      return;
    }
    if (!stageDoc) {
      setPinError('Menunggu sinkronisasi stage Firestore...');
      return;
    }
    if (clean !== stageDoc.mcPin) {
      setPinError('PIN MC salah. Hanya MC/Pemilik Stage yang mengetahui kode akses.');
      return;
    }
    sessionStorage.setItem(MC_UNLOCKED_STORAGE_KEY, clean);
    setUnlockedPin(clean);
    setPinError(null);
  };

  const handleDisconnectPin = () => {
    sessionStorage.removeItem(MC_UNLOCKED_STORAGE_KEY);
    setUnlockedPin(null);
    setPinInput('');
    setPinError(null);
  };

  const handleSpinLottery = () => {
    if (lotteryTimerRef.current) {
      clearTimeout(lotteryTimerRef.current);
    }
    void sendAction('LOTTERY_SPIN');
    lotteryTimerRef.current = setTimeout(() => {
      const winner: 'teamA' | 'teamB' = Math.random() > 0.5 ? 'teamA' : 'teamB';
      void sendAction('LOTTERY_FINISH', { winner });
    }, 1700);
  };

  const triggerSound = (sound: SoundEffectName) => {
    void sendAction('SOUNDBOARD', { sound });
    if (mcPreviewAudio) {
      switch (sound) {
        case 'applause':
          soundFx.playApplause();
          break;
        case 'drumRoll':
          soundFx.playDrumRoll();
          break;
        case 'bell':
          soundFx.playBell();
          break;
        case 'correct':
          soundFx.playCorrect();
          break;
        case 'wrong':
          soundFx.playWrong();
          break;
        case 'fanfare':
          soundFx.playFanfare();
          break;
      }
    }
  };

  const copyShareUrl = (type: 'mc' | 'ifp') => {
    if (!stageId) return;
    const base = window.location.origin;
    const url =
      type === 'mc'
        ? `${base}/mc?stage=${encodeURIComponent(stageId)}`
        : `${base}/?stage=${encodeURIComponent(stageId)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLinkType(type);
    setTimeout(() => setCopiedLinkType(null), 2000);
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);
    try {
      await updateStageSettings({ mcPin: newPinInput });
      sessionStorage.setItem(MC_UNLOCKED_STORAGE_KEY, newPinInput.trim());
      setUnlockedPin(newPinInput.trim());
      setNewPinInput('');
      setSettingsMsg({ text: 'PIN MC berhasil diperbarui di Firestore.', ok: true });
    } catch (err) {
      setSettingsMsg({
        text: err instanceof Error ? err.message : 'Gagal memperbarui PIN MC.',
        ok: false,
      });
    }
  };

  const handleAddCoHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageDoc) return;
    const cleanEmail = coHostEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSettingsMsg({ text: 'Masukkan alamat email Google yang valid.', ok: false });
      return;
    }
    if (stageDoc.allowedEmails.includes(cleanEmail)) {
      setSettingsMsg({ text: 'Email sudah terdaftar sebagai Co-Host.', ok: false });
      return;
    }
    if (stageDoc.allowedEmails.length >= 10) {
      setSettingsMsg({ text: 'Maksimal 10 email Co-Host per stage.', ok: false });
      return;
    }
    try {
      await updateStageSettings({
        allowedEmails: [...stageDoc.allowedEmails, cleanEmail],
      });
      setCoHostEmailInput('');
      setSettingsMsg({
        text: `${cleanEmail} ditambahkan sebagai Co-Host MC/IFP.`,
        ok: true,
      });
    } catch (err) {
      setSettingsMsg({
        text: err instanceof Error ? err.message : 'Gagal menambahkan Co-Host.',
        ok: false,
      });
    }
  };

  const handleRemoveCoHost = async (email: string) => {
    if (!stageDoc) return;
    try {
      await updateStageSettings({
        allowedEmails: stageDoc.allowedEmails.filter((e) => e !== email),
      });
    } catch (err) {
      setSettingsMsg({
        text: err instanceof Error ? err.message : 'Gagal menghapus Co-Host.',
        ok: false,
      });
    }
  };

  const handleSaveMatch = async () => {
    setIsSavingMatch(true);
    setSettingsMsg(null);
    try {
      await saveMatchRecord();
      setSettingsMsg({
        text: 'Skor pertandingan berhasil disimpan ke Riwayat Juara Firestore.',
        ok: true,
      });
    } catch (err) {
      setSettingsMsg({
        text: err instanceof Error ? err.message : 'Gagal menyimpan riwayat skor.',
        ok: false,
      });
    } finally {
      setIsSavingMatch(false);
    }
  };

  // Waiting for Firestore stage sync
  if (status === 'connecting' || (!stageDoc && status !== 'error')) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3 p-6">
        <div className="h-10 w-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-400">
          Menghubungkan ke Stage Firebase Firestore...
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/60 p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Gagal Mengakses Stage</h2>
          <p className="text-xs text-rose-200">{errorMessage}</p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onNavigateToIfp}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Ke Halaman Awal
            </button>
            <button
              type="button"
              onClick={signOutUser}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Ganti Akun Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 1: PIN ENTRY GATE
  // ========================================================
  if (!unlockedPin || !gameState) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-400/70 shadow-[0_0_60px_rgba(245,158,11,0.2)] p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <KeyRound className="w-7 h-7" />
          </div>

          <h1 className="font-condensed font-black text-3xl text-amber-300 tracking-wide uppercase mb-1">
            Kontrol MC &amp; Operator
          </h1>
          <p className="text-sm text-slate-400 mb-2">
            Masukkan kode PIN MC (default awal: <span className="font-mono text-amber-300 font-bold">2511</span>) untuk membuka panel kendali permainan yang terhubung ke Firebase Firestore.
          </p>
          <p className="text-[11px] text-slate-500 mb-6 truncate">
            Akun aktif: <span className="text-slate-300 font-semibold">{user?.email}</span>
          </p>

          {pinError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Kode PIN Rahasia MC
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-center font-condensed font-black text-4xl tracking-[0.35em] text-amber-300 outline-none placeholder:text-slate-700 placeholder:text-xl placeholder:tracking-normal"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Masuk Ruang Kontrol MC
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => setShowStageSwitch((prev) => !prev)}
              className="text-[11px] font-semibold text-amber-300/90 hover:text-amber-300 underline cursor-pointer"
            >
              {showStageSwitch
                ? 'Sembunyikan pilihan Stage ID'
                : 'Layar IFP pakai akun Google berbeda? Hubungkan via Stage ID'}
            </button>

            {showStageSwitch && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2">
                <label className="block text-[11px] font-bold text-slate-400">
                  Tempel Stage ID atau Link MC dari Layar IFP:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stageInput}
                    onChange={(e) => setStageInput(e.target.value)}
                    placeholder="Contoh: 4XDJI1zYlfa8..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const raw = stageInput.trim();
                      if (!raw) {
                        setOverrideStageId(undefined);
                        return;
                      }
                      const match = raw.match(/[?&]stage=([^&]+)/);
                      setOverrideStageId(match ? decodeURIComponent(match[1]) : raw);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Sambungkan
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={onNavigateToIfp}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Buka Tampilan Layar IFP</span>
              </button>
              <button
                type="button"
                onClick={signOutUser}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQIndex = gameState.questionOrder[gameState.currentQuestionIndex] ?? 0;
  const currentQuestion = INITIAL_QUESTIONS[currentQIndex] || INITIAL_QUESTIONS[0];
  const activeTeam = gameState.teams[gameState.activeTeamId];
  const isStealMode = activeTeam.strikes >= 3;

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    const result = matchUserAnswer(
      answerInput,
      currentQuestion.answers,
      gameState.revealedAnswerIds
    );

    if (result.matchedAnswer) {
      if (result.isAlreadyRevealed) {
        void sendAction('SOUNDBOARD', { sound: 'bell' });
        setFeedback({
          text: `Jawaban "${result.matchedAnswer.text}" SUDAH TERBUKA sebelumnya!`,
          type: 'warning',
        });
      } else {
        void sendAction('REVEAL_ANSWER', {
          answerId: result.matchedAnswer.id,
          givePoints: true,
        });
        setFeedback({
          text: `BENAR! #${result.matchedAnswer.rank}: "${result.matchedAnswer.text}" (+${
            result.matchedAnswer.points * gameState.roundMultiplier
          } poin untuk ${activeTeam.name})`,
          type: 'success',
        });
      }
    } else {
      void sendAction('ADD_STRIKE');
      setFeedback({
        text: `SALAH! "${answerInput}" tidak ada di survei. Tambah ❌ untuk ${activeTeam.name}.`,
        type: 'error',
      });
    }

    setAnswerInput('');
  };

  const handleManualReveal = (ans: SurveyAnswer, givePoints: boolean) => {
    if (gameState.revealedAnswerIds.includes(ans.id)) return;
    void sendAction('REVEAL_ANSWER', { answerId: ans.id, givePoints });
    setFeedback({
      text: `Membuka #${ans.rank}: "${ans.text}" ${
        givePoints ? `(+${ans.points * gameState.roundMultiplier} poin ke ${activeTeam.name})` : '(tanpa poin)'
      }`,
      type: givePoints ? 'success' : 'warning',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* MC Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-condensed font-black text-xl text-amber-300 tracking-wide uppercase">
                  Kontrol MC Family 100 HGN
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/40 text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span>Firebase Sync</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{user?.email}</span>
                <span>·</span>
                <span className={status === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {status === 'connected' ? 'Firestore Real-time OK' : 'Menghubungkan...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void sendAction('TOGGLE_SOUND')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                gameState.soundEnabled
                  ? 'bg-blue-950/60 text-blue-300 border-blue-700'
                  : 'bg-rose-950/60 text-rose-300 border-rose-700'
              }`}
              title="Sinkron dua arah dengan tombol suara di Layar IFP"
            >
              {gameState.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Suara IFP: {gameState.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMcPreviewAudio(!mcPreviewAudio)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mcPreviewAudio
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Aktifkan jika ingin suara terdengar juga di laptop MC (default suara keluar di Layar IFP)"
            >
              {mcPreviewAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Audio MC: {mcPreviewAudio ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsMsg(null);
                setShowSettingsModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Firebase, PIN &amp; Riwayat</span>
            </button>

            <button
              type="button"
              onClick={handleDisconnectPin}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Kunci PIN</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToIfp}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Kembali ke halaman awal / tampilan IFP"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Halaman Awal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Live Mirror Status Strip: Shows exact active state on IFP */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <Monitor className="w-3.5 h-3.5" />
              <span>Layar IFP Live:</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold">
              {gameState.phase === 'INTRO' ? 'Halaman Pembuka' : 'Arena Kuis'}
            </span>
            {gameState.phase !== 'INTRO' && (
              <>
                <span className="px-2 py-0.5 rounded bg-blue-950/70 border border-blue-700/40 text-blue-200 font-semibold">
                  Terbuka: {gameState.revealedAnswerIds.length}/{currentQuestion.answers.length}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 font-semibold">
                  Giliran: {activeTeam.name}
                </span>
              </>
            )}
            {gameState.isPaused && (
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                DIJEDA
              </span>
            )}
            {gameState.timer.isOpen && (
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                Timer: {liveSecondsLeft}d
              </span>
            )}
            {gameState.lottery.isOpen && (
              <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 font-bold">
                Undian Aktif
              </span>
            )}
            {gameState.showWinnerModal && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-bold">
                Papan Juara Tampil
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Sinkronisasi 2 arah MC ↔ IFP aktif
          </span>
        </div>

        {/* If IFP is still on INTRO screen, MC can setup teams and start remotely */}
        {gameState.phase === 'INTRO' ? (
          <div className="max-w-2xl mx-auto rounded-2xl bg-slate-900 border border-amber-400/50 p-6 space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">Layar IFP Masih di Halaman Pembuka</h2>
              <p className="text-sm text-slate-400">
                Atur nama tim dan mulai perlombaan langsung dari panel MC ini (otomatis tampil di Layar IFP).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-400 uppercase mb-1.5">
                  Nama Tim 1
                </label>
                <input
                  type="text"
                  value={introTeamA}
                  onChange={(e) => setIntroTeamA(e.target.value)}
                  onBlur={() => {
                    if (introTeamA.trim() && introTeamA.trim() !== gameState.teams.teamA.name) {
                      void sendAction('UPDATE_TEAM_NAME', {
                        teamId: 'teamA',
                        name: introTeamA.trim(),
                      });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-400 uppercase mb-1.5">
                  Nama Tim 2
                </label>
                <input
                  type="text"
                  value={introTeamB}
                  onChange={(e) => setIntroTeamB(e.target.value)}
                  onBlur={() => {
                    if (introTeamB.trim() && introTeamB.trim() !== gameState.teams.teamB.name) {
                      void sendAction('UPDATE_TEAM_NAME', {
                        teamId: 'teamB',
                        name: introTeamB.trim(),
                      });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void sendAction('START_GAME', { teamAName: introTeamA, teamBName: introTeamB })
              }
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-condensed font-black text-xl uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Mulai Lomba di Layar IFP</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: TEAM PODIUMS & TURN CONTROLS (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Kendali Tim &amp; Skor
                  </h2>
                  <button
                    type="button"
                    onClick={() => void sendAction('SWITCH_TEAM')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Ganti Giliran</span>
                  </button>
                </div>

                {isStealMode && (
                  <div className="p-3 rounded-xl bg-red-600/20 border border-red-500/50 text-red-300 text-xs font-bold flex items-center justify-between gap-2">
                    <span>⚠️ 3x SALAH! Kesempatan Rebutan Tim Lawan!</span>
                    <button
                      type="button"
                      onClick={() => void sendAction('SWITCH_TEAM')}
                      className="px-2.5 py-1 rounded bg-red-600 text-white hover:bg-red-500 shrink-0 cursor-pointer"
                    >
                      Oper Tim
                    </button>
                  </div>
                )}

                <TeamPodium
                  team={gameState.teams.teamA}
                  isActive={gameState.activeTeamId === 'teamA'}
                  align="left"
                  onSelectTeam={() => void sendAction('SET_ACTIVE_TEAM', { teamId: 'teamA' })}
                  onUpdateTeamName={(name) =>
                    void sendAction('UPDATE_TEAM_NAME', { teamId: 'teamA', name })
                  }
                  onAdjustScore={(delta) =>
                    void sendAction('ADJUST_SCORE', { teamId: 'teamA', delta })
                  }
                />

                <TeamPodium
                  team={gameState.teams.teamB}
                  isActive={gameState.activeTeamId === 'teamB'}
                  align="right"
                  onSelectTeam={() => void sendAction('SET_ACTIVE_TEAM', { teamId: 'teamB' })}
                  onUpdateTeamName={(name) =>
                    void sendAction('UPDATE_TEAM_NAME', { teamId: 'teamB', name })
                  }
                  onAdjustScore={(delta) =>
                    void sendAction('ADJUST_SCORE', { teamId: 'teamB', delta })
                  }
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void sendAction('ADD_STRIKE')}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>SALAH (❌)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendAction('RESET_STRIKES')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer"
                  >
                    Reset Semua ❌
                  </button>
                </div>
              </div>

              {/* Soundboard MC */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Soundboard Efek Suara (Bunyi di IFP)
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerSound('applause')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 text-left cursor-pointer"
                  >
                    👏 Tepuk Tangan
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSound('drumRoll')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 text-left cursor-pointer"
                  >
                    🥁 Drum Roll
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSound('bell')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 text-left cursor-pointer"
                  >
                    🔔 Bel / Dering
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSound('correct')}
                    className="px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/40 text-xs font-semibold text-emerald-300 text-left cursor-pointer"
                  >
                    ✅ Suara Benar
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSound('wrong')}
                    className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/40 text-xs font-semibold text-rose-300 text-left cursor-pointer"
                  >
                    ❌ Suara Salah
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSound('fanfare')}
                    className="px-3 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-700/40 text-xs font-semibold text-amber-300 text-left cursor-pointer"
                  >
                    🎺 Fanfare Juara
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: ACTIVE QUESTION, FUZZY INPUT & ANSWER KEY (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Active Question Card */}
              <div className="rounded-2xl bg-slate-900 border border-amber-400/50 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-amber-300">
                    Soal {gameState.currentQuestionIndex + 1} / {gameState.questionOrder.length} ·{' '}
                    <span className="text-slate-300">{currentQuestion.category}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void sendAction('PREV_QUESTION')}
                      disabled={gameState.currentQuestionIndex <= 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                      title="Soal Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendAction('NEXT_QUESTION')}
                      disabled={gameState.currentQuestionIndex >= gameState.questionOrder.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                      title="Soal Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                  &ldquo;{currentQuestion.question}&rdquo;
                </h2>

                {currentQuestion.trivia && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <span className="line-clamp-2">{currentQuestion.trivia}</span>
                    <button
                      type="button"
                      onClick={() => void sendAction('TOGGLE_TRIVIA')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 flex items-center gap-1 cursor-pointer ${
                        gameState.showTrivia
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>{gameState.showTrivia ? 'Tampil di IFP' : 'Tampilkan di IFP'}</span>
                    </button>
                  </div>
                )}

                {/* Answer Input Form */}
                <form onSubmit={handleCheckAnswer} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder={`Ketik jawaban ${activeTeam.name}...`}
                    className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Cek</span>
                  </button>
                </form>

                {feedback && (
                  <div
                    className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-between ${
                      feedback.type === 'success'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        : feedback.type === 'warning'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <span>{feedback.text}</span>
                    <button
                      type="button"
                      onClick={() => setFeedback(null)}
                      className="ml-2 opacity-70 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* MC EYES ONLY: Full 5-Answer Key */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Kunci Jawaban Survei (Khusus Layar MC)
                    </span>
                    <button
                      type="button"
                      onClick={() => void sendAction('REVEAL_ALL')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Semua (0 Poin)</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentQuestion.answers.map((ans) => {
                      const isRevealed = gameState.revealedAnswerIds.includes(ans.id);
                      const pts = ans.points * gameState.roundMultiplier;

                      return (
                        <div
                          key={ans.id}
                          className={`rounded-xl p-3 border flex items-center justify-between gap-3 ${
                            isRevealed
                              ? 'bg-emerald-950/30 border-emerald-600/40 opacity-75'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-condensed font-black text-sm">
                                #{ans.rank}
                              </span>
                              <span className="font-bold text-sm text-white truncate">
                                {ans.text}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 truncate">
                              Kata kunci: {ans.keywords.slice(0, 4).join(', ')}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isRevealed ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 px-1.5">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Terbuka
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void sendAction('HIDE_ANSWER', {
                                      answerId: ans.id,
                                      deductPoints: false,
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-[11px] font-semibold cursor-pointer"
                                  title="Tutup kembali jawaban ini di Layar IFP (tanpa mengubah skor)"
                                >
                                  Tutup
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleManualReveal(ans, true)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
                                  title={`Buka di IFP & beri +${pts} poin ke ${activeTeam.name}`}
                                >
                                  Buka +{pts}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleManualReveal(ans, false)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                                  title="Buka di IFP tanpa menambah poin"
                                >
                                  0p
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STAGE CONTROLS, TIMER, LOTTERY & QUESTION BROWSER (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Stage Overlays & Specials */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fitur Spesial &amp; Layar IFP
                </h2>

                {/* 10s Timer Remote */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tantangan Kilat 10s</span>
                    </span>
                    <span className="font-condensed text-lg text-white tabular-nums">
                      {liveSecondsLeft}d
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {!gameState.timer.isOpen ? (
                      <button
                        type="button"
                        onClick={() => void sendAction('TIMER_OPEN')}
                        className="col-span-2 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Buka &amp; Mulai 10s di IFP
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void sendAction(
                              gameState.timer.isRunning ? 'TIMER_PAUSE' : 'TIMER_START'
                            )
                          }
                          className="py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          {gameState.timer.isRunning ? 'Jeda' : 'Lanjut'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void sendAction('TIMER_RESET')}
                          className="py-1.5 rounded-lg bg-slate-800 text-slate-200 font-semibold text-xs cursor-pointer"
                        >
                          Reset 10s
                        </button>
                        <button
                          type="button"
                          onClick={() => void sendAction('TIMER_CLOSE')}
                          className="col-span-2 py-1.5 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-700/50 font-semibold text-xs cursor-pointer"
                        >
                          Tutup Timer di IFP
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Lottery Remote */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Dices className="w-3.5 h-3.5" />
                      <span>Undian Tim Pertama</span>
                    </span>
                  </div>
                  {!gameState.lottery.isOpen ? (
                    <button
                      type="button"
                      onClick={() => void sendAction('LOTTERY_OPEN')}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Tampilkan Undian di IFP
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleSpinLottery}
                        disabled={gameState.lottery.isSpinning}
                        className="w-full py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50 cursor-pointer"
                      >
                        {gameState.lottery.isSpinning ? 'Sedang Mengundi...' : 'Putar Undian!'}
                      </button>
                      {gameState.lottery.winner && !gameState.lottery.isSpinning && (
                        <button
                          type="button"
                          onClick={() => void sendAction('LOTTERY_APPLY')}
                          className="w-full py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          Terapkan ({gameState.teams[gameState.lottery.winner].name})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void sendAction('LOTTERY_CLOSE')}
                        className="w-full py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Tutup Undian
                      </button>
                    </div>
                  )}
                </div>

                {/* Mode Toggles */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => void sendAction('TOGGLE_JACKPOT')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                      gameState.roundMultiplier > 1
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Poin Jackpot 2X</span>
                    </span>
                    <span>{gameState.roundMultiplier > 1 ? 'AKTIF' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void sendAction('TOGGLE_PAUSE')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                      gameState.isPaused
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {gameState.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{gameState.isPaused ? 'Lanjutkan Game' : 'Jeda Layar IFP'}</span>
                    </span>
                    <span>{gameState.isPaused ? 'PAUSED' : 'LIVE'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void sendAction(gameState.showWinnerModal ? 'WINNER_CLOSE' : 'WINNER_OPEN')
                    }
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                      gameState.showWinnerModal
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>
                        {gameState.showWinnerModal
                          ? 'Tutup Papan Pemenang'
                          : 'Papan Skor Akhir & Juara'}
                      </span>
                    </span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void sendAction('SET_PHASE', { phase: 'INTRO' })}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                    <span>Layar IFP ke Halaman Awal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Game</span>
                  </button>
                </div>
              </div>

              {/* Question Selector & Soal Ringan Filter */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pilih Soal ({INITIAL_QUESTIONS.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => void sendAction('SHUFFLE_QUESTIONS')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 flex items-center gap-1 cursor-pointer"
                    title="Acak urutan semua soal"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Acak</span>
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'RINGAN', label: 'Soal Ringan (10)' },
                    { id: 'BABAK_1', label: 'Babak 1' },
                    { id: 'BABAK_2', label: 'Babak 2' },
                    { id: 'BABAK_3', label: 'Babak 3 (2X)' },
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setQuestionFilter(tab.id as QuestionFilter)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        questionFilter === tab.id
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari soal..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                {/* Question List */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {filteredQuestions.map((q) => {
                    const isCurrent = q.id === currentQuestion.id;
                    return (
                      <button
                        type="button"
                        key={q.id}
                        onClick={() => void sendAction('GO_TO_QUESTION_BY_ID', { questionId: q.id })}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                          <span>
                            #{q.id} · {q.category}
                          </span>
                          {q.round === 'BABAK_3' && <span className="text-amber-400">2X</span>}
                        </div>
                        <div className="line-clamp-2 font-medium">{q.question}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Firebase, PIN, Vercel Share & Match History Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-amber-400/70 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">
                  Koneksi Firebase, PIN MC &amp; Riwayat Skor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {settingsMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  settingsMsg.ok
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                }`}
              >
                {settingsMsg.text}
              </div>
            )}

            {/* Status Firebase & Vercel */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-amber-300 uppercase tracking-wider">
                  Status Integrasi Firebase &amp; Vercel
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Project: {firebaseConfig.projectId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyShareUrl('mc')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span>Salin Link Kontrol MC (/mc)</span>
                  {copiedLinkType === 'mc' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-amber-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => copyShareUrl('ifp')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span>Salin Link Layar IFP (/)</span>
                  {copiedLinkType === 'ifp' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-blue-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Owner-only PIN & Co-Host management */}
            {isOwner && stageDoc && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <form
                  onSubmit={handleUpdatePin}
                  className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2.5"
                >
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Ubah PIN MC (Saat ini: <span className="font-mono text-amber-300">{stageDoc.mcPin}</span>)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="PIN baru 4-6 digit"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={handleAddCoHost}
                  className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2.5"
                >
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Co-Host Email Google ({stageDoc.allowedEmails.length}/10)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={coHostEmailInput}
                      onChange={(e) => setCoHostEmailInput(e.target.value)}
                      placeholder="panitia@sekolah.sch.id"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                    >
                      Tambah
                    </button>
                  </div>
                  {stageDoc.allowedEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {stageDoc.allowedEmails.map((em) => (
                        <span
                          key={em}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300"
                        >
                          <span>{em}</span>
                          <button
                            type="button"
                            onClick={() => void handleRemoveCoHost(em)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Match History (Firestore subcollection) */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Riwayat Skor Pertandingan (Firestore)
                </h4>
                <button
                  type="button"
                  onClick={() => void handleSaveMatch()}
                  disabled={isSavingMatch}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingMatch ? 'Menyimpan...' : 'Simpan Skor Saat Ini'}</span>
                </button>
              </div>

              {matches.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Belum ada riwayat pertandingan yang disimpan.
                </p>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {m.teamAName} ({m.teamAScore}) vs {m.teamBName} ({m.teamBScore})
                        </div>
                        <div className="text-[11px] text-amber-300">
                          Pemenang: {m.winnerName} · {m.totalQuestionsPlayed} soal selesai
                        </div>
                      </div>
                      {isOwner && m.id && (
                        <button
                          type="button"
                          onClick={() => m.id && void deleteMatchRecord(m.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 cursor-pointer"
                          title="Hapus riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={signOutUser}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Keluar Akun Google
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border-2 border-rose-500/80 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 mb-4 border border-rose-500/40">
              <RotateCcw className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Reset Permainan?</h3>
            <p className="text-slate-300 text-sm mb-6">
              Apakah Bapak/Ibu MC yakin ingin mereset skor kedua tim dan mengulang soal dari awal di Layar IFP?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  void sendAction('RESET_GAME', { toIntro: false });
                  setShowResetConfirm(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold cursor-pointer"
              >
                Ya, Reset Skor &amp; Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
