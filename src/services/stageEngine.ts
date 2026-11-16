import { INITIAL_QUESTIONS } from '../data/questions.ts';
import type { GameEvent, GameState, SoundEffectName, StageDocument } from '../types/game.ts';

function makeEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 64);
}

export function getMultiplierForQuestionIndex(questionOrder: number[], currentIdx: number): number {
  const qIndex = questionOrder[currentIdx] ?? 0;
  const q = INITIAL_QUESTIONS[qIndex] || INITIAL_QUESTIONS[0];
  if (!q) return 1;
  return q.round === 'BABAK_3' || Boolean(q.isJackpot) ? 2 : 1;
}

function clampString(val: string, maxLen: number, fallback: string): string {
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function sanitizeEvent(event: Omit<GameEvent, 'id'>): GameEvent {
  const clean: GameEvent = {
    id: makeEventId(),
    type: event.type,
  };
  if (event.sound !== undefined) clean.sound = event.sound;
  if (event.teamId !== undefined) clean.teamId = event.teamId;
  if (event.teamName !== undefined) clean.teamName = clampString(event.teamName, 80, 'Tim');
  if (event.amount !== undefined) clean.amount = Math.max(0, Math.min(10000, Math.trunc(event.amount)));
  if (event.strikeCount !== undefined) {
    clean.strikeCount = Math.max(0, Math.min(3, Math.trunc(event.strikeCount)));
  }
  if (event.confetti !== undefined) clean.confetti = Boolean(event.confetti);
  return clean;
}

export function createInitialGameState(): GameState {
  const questionOrder = INITIAL_QUESTIONS.map((_, i) => i);
  return {
    currentQuestionIndex: 0,
    revealedAnswerIds: [],
    activeTeamId: 'teamA',
    roundMultiplier: getMultiplierForQuestionIndex(questionOrder, 0),
    teams: {
      teamA: {
        id: 'teamA',
        name: 'Tim Ki Hajar Dewantara',
        color: '#3B82F6',
        score: 0,
        strikes: 0,
        roundWins: 0,
      },
      teamB: {
        id: 'teamB',
        name: 'Tim R.A. Kartini',
        color: '#EF4444',
        score: 0,
        strikes: 0,
        roundWins: 0,
      },
    },
    phase: 'INTRO',
    isPaused: false,
    soundEnabled: true,
    questionOrder,
    completedQuestionIds: [],
    roundPots: 0,
    showTrivia: false,
    showWinnerModal: false,
    timer: {
      isOpen: false,
      secondsLeft: 10,
      isRunning: false,
      startedAtMs: null,
    },
    lottery: {
      isOpen: false,
      isSpinning: false,
      winner: null,
    },
    lastEvent: null,
  };
}

export function createInitialStageDocument(ownerId: string, defaultPin = '2511'): Omit<StageDocument, 'createdAt' | 'updatedAt'> {
  return {
    ...createInitialGameState(),
    ownerId,
    mcPin: /^\d{4,6}$/.test(defaultPin) ? defaultPin : '2511',
    allowedEmails: [],
    updatedBy: ownerId,
  };
}

function getCurrentQuestion(state: GameState) {
  const qIndex = state.questionOrder[state.currentQuestionIndex] ?? 0;
  return INITIAL_QUESTIONS[qIndex] || INITIAL_QUESTIONS[0];
}

export function getLiveTimerSeconds(timer: GameState['timer']): number {
  if (!timer.isRunning || !timer.startedAtMs) {
    return Math.max(0, Math.min(300, Math.trunc(timer.secondsLeft)));
  }
  const elapsedSec = Math.floor((Date.now() - timer.startedAtMs) / 1000);
  return Math.max(0, Math.trunc(timer.secondsLeft) - Math.max(0, elapsedSec));
}

export function applyGameAction(
  prevState: GameState,
  action: string,
  payload: Record<string, unknown> = {}
): GameState | null {
  const state: GameState = {
    ...prevState,
    teams: {
      teamA: { ...prevState.teams.teamA },
      teamB: { ...prevState.teams.teamB },
    },
    timer: {
      isOpen: prevState.timer.isOpen,
      secondsLeft: prevState.timer.secondsLeft,
      isRunning: prevState.timer.isRunning,
      startedAtMs: prevState.timer.startedAtMs ?? null,
    },
    lottery: { ...prevState.lottery },
    revealedAnswerIds: [...prevState.revealedAnswerIds],
    questionOrder: [...prevState.questionOrder],
    completedQuestionIds: [...prevState.completedQuestionIds],
  };

  const currentQ = getCurrentQuestion(state);

  switch (action) {
    case 'START_GAME': {
      const nameA = typeof payload.teamAName === 'string' ? payload.teamAName : '';
      const nameB = typeof payload.teamBName === 'string' ? payload.teamBName : '';
      if (nameA.trim()) state.teams.teamA.name = clampString(nameA, 80, 'Tim 1');
      if (nameB.trim()) state.teams.teamB.name = clampString(nameB, 80, 'Tim 2');
      state.phase = 'PLAYING';
      state.lastEvent = sanitizeEvent({ type: 'GAME_STARTED', sound: 'correct' });
      return state;
    }

    case 'SET_PHASE': {
      state.phase = payload.phase === 'INTRO' ? 'INTRO' : 'PLAYING';
      state.lastEvent = null;
      return state;
    }

    case 'REVEAL_ANSWER': {
      const answerId = Number(payload.answerId);
      const givePoints = Boolean(payload.givePoints);
      if (state.revealedAnswerIds.includes(answerId)) return null;

      const answer = currentQ.answers.find((a) => a.id === answerId);
      if (!answer) return null;

      state.revealedAnswerIds = [...state.revealedAnswerIds, answerId].slice(0, 10);
      const pts = Math.trunc(answer.points * state.roundMultiplier);
      const activeTeamId = state.activeTeamId;

      if (givePoints) {
        state.teams[activeTeamId].score = Math.min(1000000, state.teams[activeTeamId].score + pts);
        state.roundPots = Math.min(100000, state.roundPots + pts);
      }

      const allOpened = state.revealedAnswerIds.length >= currentQ.answers.length;
      if (allOpened && !state.completedQuestionIds.includes(currentQ.id)) {
        state.completedQuestionIds = [...state.completedQuestionIds, currentQ.id].slice(0, 200);
      }

      state.lastEvent = sanitizeEvent({
        type: 'ANSWER_REVEALED',
        sound: allOpened ? 'fanfare' : givePoints ? 'points' : 'reveal',
        teamId: givePoints ? activeTeamId : undefined,
        amount: givePoints ? pts : undefined,
        confetti: allOpened,
      });
      return state;
    }

    case 'ADD_STRIKE': {
      const team = state.teams[state.activeTeamId];
      const nextStrikes = Math.min(3, team.strikes + 1);
      team.strikes = nextStrikes;
      state.lastEvent = sanitizeEvent({
        type: 'STRIKE_ADDED',
        sound: 'wrong',
        teamId: state.activeTeamId,
        teamName: team.name,
        strikeCount: nextStrikes,
      });
      return state;
    }

    case 'RESET_STRIKES': {
      state.teams.teamA.strikes = 0;
      state.teams.teamB.strikes = 0;
      state.lastEvent = null;
      return state;
    }

    case 'SWITCH_TEAM': {
      state.activeTeamId = state.activeTeamId === 'teamA' ? 'teamB' : 'teamA';
      state.lastEvent = sanitizeEvent({ type: 'SOUNDBOARD', sound: 'reveal' });
      return state;
    }

    case 'SET_ACTIVE_TEAM': {
      state.activeTeamId = payload.teamId === 'teamB' ? 'teamB' : 'teamA';
      state.lastEvent = null;
      return state;
    }

    case 'UPDATE_TEAM_NAME': {
      const teamId = payload.teamId === 'teamB' ? 'teamB' : 'teamA';
      const name = typeof payload.name === 'string' ? payload.name : '';
      if (!name.trim()) return null;
      state.teams[teamId].name = clampString(name, 80, teamId === 'teamA' ? 'Tim 1' : 'Tim 2');
      state.lastEvent = null;
      return state;
    }

    case 'ADJUST_SCORE': {
      const teamId = payload.teamId === 'teamB' ? 'teamB' : 'teamA';
      const delta = Math.trunc(Number(payload.delta) || 0);
      state.teams[teamId].score = Math.max(0, Math.min(1000000, state.teams[teamId].score + delta));
      state.lastEvent = null;
      return state;
    }

    case 'REVEAL_ALL': {
      state.revealedAnswerIds = currentQ.answers.map((a) => a.id).slice(0, 10);
      state.lastEvent = sanitizeEvent({ type: 'ALL_REVEALED', sound: 'reveal' });
      return state;
    }

    case 'GO_TO_QUESTION': {
      const idx = Math.trunc(Number(payload.index));
      if (Number.isNaN(idx) || idx < 0 || idx >= state.questionOrder.length) return null;
      state.currentQuestionIndex = idx;
      state.revealedAnswerIds = [];
      state.roundPots = 0;
      state.showTrivia = false;
      state.teams.teamA.strikes = 0;
      state.teams.teamB.strikes = 0;
      state.roundMultiplier = getMultiplierForQuestionIndex(state.questionOrder, idx);
      state.lastEvent = sanitizeEvent({ type: 'QUESTION_CHANGED', sound: 'reveal' });
      return state;
    }

    case 'GO_TO_QUESTION_BY_ID': {
      const qId = Number(payload.questionId);
      const origIdx = INITIAL_QUESTIONS.findIndex((q) => q.id === qId);
      if (origIdx === -1) return null;
      let orderIdx = state.questionOrder.indexOf(origIdx);
      if (orderIdx === -1) {
        state.questionOrder = [...state.questionOrder, origIdx].slice(0, 200);
        orderIdx = state.questionOrder.length - 1;
      }
      state.currentQuestionIndex = orderIdx;
      state.revealedAnswerIds = [];
      state.roundPots = 0;
      state.showTrivia = false;
      state.teams.teamA.strikes = 0;
      state.teams.teamB.strikes = 0;
      state.roundMultiplier = getMultiplierForQuestionIndex(state.questionOrder, orderIdx);
      state.lastEvent = sanitizeEvent({ type: 'QUESTION_CHANGED', sound: 'reveal' });
      return state;
    }

    case 'NEXT_QUESTION': {
      if (state.currentQuestionIndex >= state.questionOrder.length - 1) return null;
      return applyGameAction(state, 'GO_TO_QUESTION', { index: state.currentQuestionIndex + 1 });
    }

    case 'PREV_QUESTION': {
      if (state.currentQuestionIndex <= 0) return null;
      return applyGameAction(state, 'GO_TO_QUESTION', { index: state.currentQuestionIndex - 1 });
    }

    case 'SHUFFLE_QUESTIONS': {
      state.questionOrder = [...state.questionOrder].sort(() => Math.random() - 0.5);
      state.currentQuestionIndex = 0;
      state.revealedAnswerIds = [];
      state.roundPots = 0;
      state.showTrivia = false;
      state.teams.teamA.strikes = 0;
      state.teams.teamB.strikes = 0;
      state.roundMultiplier = getMultiplierForQuestionIndex(state.questionOrder, 0);
      state.lastEvent = sanitizeEvent({ type: 'QUESTION_CHANGED', sound: 'drumRoll' });
      return state;
    }

    case 'TOGGLE_PAUSE': {
      state.isPaused = !state.isPaused;
      state.lastEvent = null;
      return state;
    }

    case 'TOGGLE_JACKPOT': {
      state.roundMultiplier = state.roundMultiplier > 1 ? 1 : 2;
      state.lastEvent = null;
      return state;
    }

    case 'TOGGLE_TRIVIA': {
      state.showTrivia = !state.showTrivia;
      state.lastEvent = null;
      return state;
    }

    case 'TOGGLE_SOUND': {
      state.soundEnabled = !state.soundEnabled;
      state.lastEvent = null;
      return state;
    }

    case 'SOUNDBOARD': {
      const sound = payload.sound as SoundEffectName;
      if (!sound) return null;
      state.lastEvent = sanitizeEvent({ type: 'SOUNDBOARD', sound });
      return state;
    }

    case 'TIMER_OPEN': {
      state.timer = {
        isOpen: true,
        secondsLeft: 10,
        isRunning: true,
        startedAtMs: Date.now(),
      };
      state.lastEvent = sanitizeEvent({ type: 'TIMER_TICK', sound: 'tick' });
      return state;
    }

    case 'TIMER_START': {
      const remaining = getLiveTimerSeconds(state.timer);
      const startSeconds = remaining > 0 ? remaining : 10;
      state.timer = {
        isOpen: true,
        secondsLeft: startSeconds,
        isRunning: true,
        startedAtMs: Date.now(),
      };
      state.lastEvent = sanitizeEvent({ type: 'TIMER_TICK', sound: 'tick' });
      return state;
    }

    case 'TIMER_PAUSE': {
      const remaining = getLiveTimerSeconds(state.timer);
      state.timer = {
        isOpen: state.timer.isOpen,
        secondsLeft: remaining,
        isRunning: false,
        startedAtMs: null,
      };
      state.lastEvent = null;
      return state;
    }

    case 'TIMER_RESET': {
      state.timer = {
        isOpen: true,
        secondsLeft: 10,
        isRunning: true,
        startedAtMs: Date.now(),
      };
      state.lastEvent = sanitizeEvent({ type: 'TIMER_TICK', sound: 'tick' });
      return state;
    }

    case 'TIMER_EXPIRE': {
      state.timer = {
        isOpen: state.timer.isOpen,
        secondsLeft: 0,
        isRunning: false,
        startedAtMs: null,
      };
      state.lastEvent = sanitizeEvent({ type: 'TIMER_END', sound: 'timesUp' });
      return state;
    }

    case 'TIMER_CLOSE': {
      state.timer = {
        isOpen: false,
        secondsLeft: 10,
        isRunning: false,
        startedAtMs: null,
      };
      state.lastEvent = null;
      return state;
    }

    case 'LOTTERY_OPEN': {
      state.lottery = { isOpen: true, isSpinning: false, winner: null };
      state.lastEvent = null;
      return state;
    }

    case 'LOTTERY_CLOSE': {
      state.lottery = { isOpen: false, isSpinning: false, winner: null };
      state.lastEvent = null;
      return state;
    }

    case 'LOTTERY_SPIN': {
      state.lottery = { isOpen: true, isSpinning: true, winner: null };
      state.lastEvent = sanitizeEvent({ type: 'SOUNDBOARD', sound: 'drumRoll' });
      return state;
    }

    case 'LOTTERY_FINISH': {
      const winner: 'teamA' | 'teamB' =
        payload.winner === 'teamB' ? 'teamB' : payload.winner === 'teamA' ? 'teamA' : Math.random() > 0.5 ? 'teamA' : 'teamB';
      state.lottery = { isOpen: true, isSpinning: false, winner };
      state.lastEvent = sanitizeEvent({
        type: 'LOTTERY_WIN',
        sound: 'correct',
        teamId: winner,
        teamName: state.teams[winner].name,
      });
      return state;
    }

    case 'LOTTERY_APPLY': {
      if (state.lottery.winner) {
        state.activeTeamId = state.lottery.winner;
      }
      state.lottery = { isOpen: false, isSpinning: false, winner: null };
      state.lastEvent = null;
      return state;
    }

    case 'WINNER_OPEN': {
      state.showWinnerModal = true;
      state.lastEvent = sanitizeEvent({ type: 'SOUNDBOARD', sound: 'fanfare', confetti: true });
      return state;
    }

    case 'WINNER_CLOSE': {
      state.showWinnerModal = false;
      state.lastEvent = null;
      return state;
    }

    case 'RESET_GAME': {
      const keepNameA = state.teams.teamA.name;
      const keepNameB = state.teams.teamB.name;
      const fresh = createInitialGameState();
      fresh.teams.teamA.name = clampString(keepNameA, 80, 'Tim 1');
      fresh.teams.teamB.name = clampString(keepNameB, 80, 'Tim 2');
      fresh.phase = payload.toIntro ? 'INTRO' : 'PLAYING';
      fresh.lastEvent = sanitizeEvent({ type: 'GAME_RESET', sound: 'correct' });
      return fresh;
    }

    default:
      return null;
  }
}
