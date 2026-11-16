export type RoundType = 'BABAK_1' | 'BABAK_2' | 'BABAK_3';

export interface SurveyAnswer {
  id: number;
  rank: number; // 1 to 5
  text: string;
  points: number; // 100, 80, 60, 40, 20
  keywords: string[];
}

export interface Question {
  id: number;
  round: RoundType;
  category: string;
  categoryIcon?: string;
  question: string;
  answers: SurveyAnswer[];
  isJackpot?: boolean;
  trivia?: string;
}

export interface Team {
  id: 'teamA' | 'teamB';
  name: string;
  color: string;
  score: number;
  strikes: number; // 0..3
  roundWins: number;
}

export type GamePhase = 'INTRO' | 'PLAYING' | 'SUMMARY';

export type SoundEffectName =
  | 'correct'
  | 'wrong'
  | 'reveal'
  | 'points'
  | 'bell'
  | 'drumRoll'
  | 'applause'
  | 'fanfare'
  | 'tick'
  | 'timesUp';

export interface GameEvent {
  id: string;
  type:
    | 'ANSWER_REVEALED'
    | 'STRIKE_ADDED'
    | 'ALL_REVEALED'
    | 'QUESTION_CHANGED'
    | 'SOUNDBOARD'
    | 'TIMER_TICK'
    | 'TIMER_END'
    | 'LOTTERY_WIN'
    | 'GAME_STARTED'
    | 'GAME_RESET';
  sound?: SoundEffectName;
  teamId?: 'teamA' | 'teamB';
  teamName?: string;
  amount?: number;
  strikeCount?: number;
  confetti?: boolean;
}

export interface TimerState {
  isOpen: boolean;
  secondsLeft: number;
  isRunning: boolean;
  startedAtMs?: number | null;
}

export interface LotteryState {
  isOpen: boolean;
  isSpinning: boolean;
  winner: 'teamA' | 'teamB' | null;
}

export interface GameState {
  currentQuestionIndex: number;
  revealedAnswerIds: number[];
  activeTeamId: 'teamA' | 'teamB';
  roundMultiplier: number;
  teams: {
    teamA: Team;
    teamB: Team;
  };
  phase: GamePhase;
  isPaused: boolean;
  soundEnabled: boolean;
  questionOrder: number[];
  completedQuestionIds: number[];
  roundPots: number;
  showTrivia: boolean;
  showWinnerModal: boolean;
  timer: TimerState;
  lottery: LotteryState;
  lastEvent: GameEvent | null;
}

export interface StageDocument extends GameState {
  ownerId: string;
  mcPin: string;
  allowedEmails: string[];
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MatchRecord {
  id?: string;
  ownerId: string;
  stageId: string;
  teamAName: string;
  teamAScore: number;
  teamBName: string;
  teamBScore: number;
  winnerName: string;
  totalQuestionsPlayed: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoomPresence {
  ifpCount: number;
  mcCount: number;
}
