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

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(num)));
}

function normalizeTeam(raw: unknown, id: 'teamA' | 'teamB', fallbackName: string, fallbackColor: string) {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id,
    name: clampString(typeof obj.name === 'string' ? obj.name : '', 80, fallbackName),
    color: clampString(typeof obj.color === 'string' ? obj.color : '', 20, fallbackColor).padEnd(4, '0').slice(0, 20),
    score: clampInt(obj.score, 0, 1000000, 0),
    strikes: clampInt(obj.strikes, 0, 3, 0),
    roundWins: clampInt(obj.roundWins, 0, 1000, 0),
  };
}

function normalizeIntArray(raw: unknown, maxLen: number, minVal = 0, maxVal = 10000): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
    .map((v) => Math.max(minVal, Math.min(maxVal, Math.trunc(v))))
    .slice(0, maxLen);
}

export const STAGE_REQUIRED_KEYS = [
  'ownerId',
  'mcPin',
  'allowedEmails',
  'phase',
  'currentQuestionIndex',
  'revealedAnswerIds',
  'activeTeamId',
  'roundMultiplier',
  'teams',
  'isPaused',
  'soundEnabled',
  'questionOrder',
  'completedQuestionIds',
  'roundPots',
  'showTrivia',
  'showWinnerModal',
  'timer',
  'lottery',
  'lastEvent',
  'updatedBy',
  'createdAt',
  'updatedAt',
] as const;

function isFirestoreTimestampLike(val: unknown): boolean {
  return Boolean(
    val &&
      typeof val === 'object' &&
      typeof (val as { toMillis?: unknown }).toMillis === 'function'
  );
}

export function isStageMetadataComplete(raw: Record<string, unknown>): boolean {
  for (const key of STAGE_REQUIRED_KEYS) {
    if (!(key in raw)) return false;
  }
  for (const key of Object.keys(raw)) {
    if (!(STAGE_REQUIRED_KEYS as readonly string[]).includes(key)) return false;
  }
  if (typeof raw.ownerId !== 'string' || raw.ownerId.length < 1 || raw.ownerId.length > 128) return false;
  if (typeof raw.updatedBy !== 'string' || raw.updatedBy.length < 1 || raw.updatedBy.length > 128) return false;
  if (typeof raw.mcPin !== 'string' || !/^\d{4,6}$/.test(raw.mcPin)) return false;
  if (!Array.isArray(raw.allowedEmails) || raw.allowedEmails.length > 10) return false;
  if (raw.allowedEmails.length > 0 && (typeof raw.allowedEmails[0] !== 'string' || raw.allowedEmails[0].length > 120)) {
    return false;
  }
  if (!isFirestoreTimestampLike(raw.createdAt) || !isFirestoreTimestampLike(raw.updatedAt)) return false;
  if (raw.phase !== 'INTRO' && raw.phase !== 'PLAYING' && raw.phase !== 'SUMMARY') return false;
  if (typeof raw.currentQuestionIndex !== 'number' || !Number.isInteger(raw.currentQuestionIndex) || raw.currentQuestionIndex < 0 || raw.currentQuestionIndex > 200) return false;
  if (!Array.isArray(raw.revealedAnswerIds) || raw.revealedAnswerIds.length > 10) return false;
  if (raw.revealedAnswerIds.length > 0 && !Number.isInteger(raw.revealedAnswerIds[0])) return false;
  if (raw.activeTeamId !== 'teamA' && raw.activeTeamId !== 'teamB') return false;
  if (raw.roundMultiplier !== 1 && raw.roundMultiplier !== 2) return false;
  if (typeof raw.isPaused !== 'boolean' || typeof raw.soundEnabled !== 'boolean') return false;
  if (!Array.isArray(raw.questionOrder) || raw.questionOrder.length < 1 || raw.questionOrder.length > 200 || !Number.isInteger(raw.questionOrder[0])) return false;
  if (!Array.isArray(raw.completedQuestionIds) || raw.completedQuestionIds.length > 200) return false;
  if (raw.completedQuestionIds.length > 0 && !Number.isInteger(raw.completedQuestionIds[0])) return false;
  if (typeof raw.roundPots !== 'number' || !Number.isInteger(raw.roundPots) || raw.roundPots < 0 || raw.roundPots > 100000) return false;
  if (typeof raw.showTrivia !== 'boolean' || typeof raw.showWinnerModal !== 'boolean') return false;

  const teams = raw.teams as Record<string, unknown> | undefined;
  if (!teams || typeof teams !== 'object' || Object.keys(teams).length !== 2 || !teams.teamA || !teams.teamB) return false;
  for (const [expectedId, tRaw] of [
    ['teamA', teams.teamA],
    ['teamB', teams.teamB],
  ] as const) {
    const t = tRaw as Record<string, unknown>;
    if (!t || typeof t !== 'object' || Object.keys(t).length !== 6) return false;
    if (t.id !== expectedId) return false;
    if (typeof t.name !== 'string' || t.name.length < 1 || t.name.length > 80) return false;
    if (typeof t.color !== 'string' || t.color.length < 4 || t.color.length > 20) return false;
    if (typeof t.score !== 'number' || !Number.isInteger(t.score) || t.score < 0 || t.score > 1000000) return false;
    if (typeof t.strikes !== 'number' || !Number.isInteger(t.strikes) || t.strikes < 0 || t.strikes > 3) return false;
    if (typeof t.roundWins !== 'number' || !Number.isInteger(t.roundWins) || t.roundWins < 0 || t.roundWins > 1000) return false;
  }

  const timer = raw.timer as Record<string, unknown> | undefined;
  if (!timer || typeof timer !== 'object') return false;
  const timerKeys = Object.keys(timer);
  if (!timerKeys.every((k) => ['isOpen', 'secondsLeft', 'isRunning', 'startedAtMs'].includes(k))) return false;
  if (
    typeof timer.isOpen !== 'boolean' ||
    typeof timer.secondsLeft !== 'number' ||
    !Number.isInteger(timer.secondsLeft) ||
    timer.secondsLeft < 0 ||
    timer.secondsLeft > 300 ||
    typeof timer.isRunning !== 'boolean'
  ) {
    return false;
  }
  if (
    'startedAtMs' in timer &&
    timer.startedAtMs !== null &&
    (typeof timer.startedAtMs !== 'number' || !Number.isInteger(timer.startedAtMs) || timer.startedAtMs < 0)
  ) {
    return false;
  }

  const lottery = raw.lottery as Record<string, unknown> | undefined;
  if (!lottery || typeof lottery !== 'object' || Object.keys(lottery).length !== 3) return false;
  if (typeof lottery.isOpen !== 'boolean' || typeof lottery.isSpinning !== 'boolean') return false;
  if (lottery.winner !== null && lottery.winner !== 'teamA' && lottery.winner !== 'teamB') return false;

  if (raw.lastEvent !== null) {
    const ev = raw.lastEvent as Record<string, unknown>;
    if (!ev || typeof ev !== 'object') return false;
    const evKeys = Object.keys(ev);
    if (
      !evKeys.every((k) =>
        ['id', 'type', 'sound', 'teamId', 'teamName', 'amount', 'strikeCount', 'confetti'].includes(k)
      )
    ) {
      return false;
    }
    if (typeof ev.id !== 'string' || ev.id.length < 1 || ev.id.length > 64) return false;
    if (
      typeof ev.type !== 'string' ||
      ![
        'ANSWER_REVEALED',
        'STRIKE_ADDED',
        'ALL_REVEALED',
        'QUESTION_CHANGED',
        'SOUNDBOARD',
        'TIMER_TICK',
        'TIMER_END',
        'LOTTERY_WIN',
        'GAME_STARTED',
        'GAME_RESET',
      ].includes(ev.type)
    ) {
      return false;
    }
  }

  return true;
}

export function normalizeGameState(prevState: Partial<GameState> | Record<string, unknown>): GameState {
  const raw = prevState as Record<string, unknown>;
  const defaultOrder = INITIAL_QUESTIONS.map((_, i) => i);
  const parsedOrder = normalizeIntArray(raw.questionOrder, 200, 0, INITIAL_QUESTIONS.length - 1);
  const questionOrder = parsedOrder.length > 0 ? parsedOrder : defaultOrder;

  const rawTeams = (raw.teams && typeof raw.teams === 'object' ? raw.teams : {}) as Record<string, unknown>;
  const rawTimer = (raw.timer && typeof raw.timer === 'object' ? raw.timer : {}) as Record<string, unknown>;
  const rawLottery = (raw.lottery && typeof raw.lottery === 'object' ? raw.lottery : {}) as Record<string, unknown>;

  const startedAtRaw = rawTimer.startedAtMs;
  const startedAtMs =
    startedAtRaw === null || startedAtRaw === undefined || !Number.isFinite(Number(startedAtRaw))
      ? null
      : Math.max(0, Math.trunc(Number(startedAtRaw)));

  const rawLastEvent = raw.lastEvent as GameEvent | null | undefined;
  let lastEvent: GameEvent | null = null;
  if (rawLastEvent && typeof rawLastEvent === 'object' && typeof rawLastEvent.id === 'string' && typeof rawLastEvent.type === 'string') {
    lastEvent = {
      id: rawLastEvent.id.slice(0, 64) || makeEventId(),
      type: rawLastEvent.type,
      ...(rawLastEvent.sound !== undefined ? { sound: rawLastEvent.sound } : {}),
      ...(rawLastEvent.teamId !== undefined ? { teamId: rawLastEvent.teamId } : {}),
      ...(rawLastEvent.teamName !== undefined ? { teamName: clampString(String(rawLastEvent.teamName), 80, 'Tim') } : {}),
      ...(rawLastEvent.amount !== undefined ? { amount: clampInt(rawLastEvent.amount, 0, 10000, 0) } : {}),
      ...(rawLastEvent.strikeCount !== undefined ? { strikeCount: clampInt(rawLastEvent.strikeCount, 0, 3, 0) } : {}),
      ...(rawLastEvent.confetti !== undefined ? { confetti: Boolean(rawLastEvent.confetti) } : {}),
    };
  }

  return {
    phase: raw.phase === 'PLAYING' || raw.phase === 'SUMMARY' ? raw.phase : 'INTRO',
    currentQuestionIndex: clampInt(raw.currentQuestionIndex, 0, Math.max(0, questionOrder.length - 1), 0),
    revealedAnswerIds: normalizeIntArray(raw.revealedAnswerIds, 10, 0, 10000),
    activeTeamId: raw.activeTeamId === 'teamB' ? 'teamB' : 'teamA',
    roundMultiplier: Number(raw.roundMultiplier) === 2 ? 2 : 1,
    teams: {
      teamA: normalizeTeam(rawTeams.teamA, 'teamA', 'Tim Ki Hajar Dewantara', '#3B82F6'),
      teamB: normalizeTeam(rawTeams.teamB, 'teamB', 'Tim R.A. Kartini', '#EF4444'),
    },
    isPaused: Boolean(raw.isPaused),
    soundEnabled: raw.soundEnabled === undefined ? true : Boolean(raw.soundEnabled),
    questionOrder,
    completedQuestionIds: normalizeIntArray(raw.completedQuestionIds, 200, 0, 10000),
    roundPots: clampInt(raw.roundPots, 0, 100000, 0),
    showTrivia: Boolean(raw.showTrivia),
    showWinnerModal: Boolean(raw.showWinnerModal),
    timer: {
      isOpen: Boolean(rawTimer.isOpen),
      secondsLeft: clampInt(rawTimer.secondsLeft, 0, 300, 10),
      isRunning: Boolean(rawTimer.isRunning),
      startedAtMs,
    },
    lottery: {
      isOpen: Boolean(rawLottery.isOpen),
      isSpinning: Boolean(rawLottery.isSpinning),
      winner: rawLottery.winner === 'teamA' || rawLottery.winner === 'teamB' ? rawLottery.winner : null,
    },
    lastEvent,
  };
}

export function applyGameAction(
  prevState: GameState,
  action: string,
  payload: Record<string, unknown> = {}
): GameState | null {
  const state = normalizeGameState(prevState);

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

    case 'HIDE_ANSWER': {
      const answerId = Number(payload.answerId);
      if (!state.revealedAnswerIds.includes(answerId)) return null;

      state.revealedAnswerIds = state.revealedAnswerIds.filter((id) => id !== answerId);
      const deductPoints = Boolean(payload.deductPoints);
      const answer = currentQ.answers.find((a) => a.id === answerId);
      if (deductPoints && answer) {
        const pts = Math.trunc(answer.points * state.roundMultiplier);
        state.teams[state.activeTeamId].score = Math.max(
          0,
          state.teams[state.activeTeamId].score - pts
        );
        state.roundPots = Math.max(0, state.roundPots - pts);
      }

      state.lastEvent = sanitizeEvent({ type: 'QUESTION_CHANGED', sound: 'reveal' });
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
