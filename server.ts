import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { INITIAL_QUESTIONS } from './src/data/questions.ts';
import type { GameState, GameEvent, SoundEffectName } from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ClientMeta {
  ws: WebSocket;
  role: 'ifp' | 'mc';
}

interface Room {
  id: string;
  state: GameState;
  clients: Set<ClientMeta>;
  timerInterval: ReturnType<typeof setInterval> | null;
  lotteryTimeout: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

const STAGE_ROOM_ID = 'main-stage';
let currentMcPin = (process.env.MC_PIN || '2511').trim();

function makeEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getMultiplierForQuestionIndex(questionOrder: number[], currentIdx: number): number {
  const qIndex = questionOrder[currentIdx] ?? 0;
  const q = INITIAL_QUESTIONS[qIndex] || INITIAL_QUESTIONS[0];
  if (!q) return 1;
  return q.round === 'BABAK_3' || Boolean(q.isJackpot) ? 2 : 1;
}

function createInitialGameState(): GameState {
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
    },
    lottery: {
      isOpen: false,
      isSpinning: false,
      winner: null,
    },
    lastEvent: null,
  };
}

const stageRoom: Room = {
  id: STAGE_ROOM_ID,
  state: createInitialGameState(),
  clients: new Set(),
  timerInterval: null,
  lotteryTimeout: null,
  createdAt: Date.now(),
};

function getPresence(room: Room) {
  let ifpCount = 0;
  let mcCount = 0;
  for (const client of room.clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (client.role === 'ifp') ifpCount++;
      if (client.role === 'mc') mcCount++;
    }
  }
  return { ifpCount, mcCount };
}

function broadcastRoom(room: Room) {
  const presence = getPresence(room);
  const payload = JSON.stringify({
    type: 'STATE_SYNC',
    roomId: room.id,
    state: room.state,
    presence,
  });

  for (const client of room.clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function broadcastPresence(room: Room) {
  const presence = getPresence(room);
  const payload = JSON.stringify({
    type: 'PRESENCE',
    roomId: room.id,
    presence,
  });

  for (const client of room.clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function stopRoomTimer(room: Room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  room.state.timer.isRunning = false;
}

function startRoomTimer(room: Room) {
  stopRoomTimer(room);
  if (room.state.timer.secondsLeft <= 0) {
    room.state.timer.secondsLeft = 10;
  }
  room.state.timer.isOpen = true;
  room.state.timer.isRunning = true;
  broadcastRoom(room);

  room.timerInterval = setInterval(() => {
    if (room.state.timer.secondsLeft <= 1) {
      stopRoomTimer(room);
      room.state.timer.secondsLeft = 0;
      room.state.lastEvent = {
        id: makeEventId(),
        type: 'TIMER_END',
        sound: 'timesUp',
      };
      broadcastRoom(room);
      return;
    }

    room.state.timer.secondsLeft -= 1;
    room.state.lastEvent = {
      id: makeEventId(),
      type: 'TIMER_TICK',
      sound: 'tick',
    };
    broadcastRoom(room);
  }, 1000);
}

function getCurrentQuestion(state: GameState) {
  const qIndex = state.questionOrder[state.currentQuestionIndex] ?? 0;
  return INITIAL_QUESTIONS[qIndex] || INITIAL_QUESTIONS[0];
}

function setEvent(state: GameState, event: Omit<GameEvent, 'id'>) {
  state.lastEvent = {
    id: makeEventId(),
    ...event,
  };
}

function handleRoomAction(room: Room, action: string, payload: Record<string, unknown> = {}) {
  const state = room.state;
  const currentQ = getCurrentQuestion(state);

  switch (action) {
    case 'START_GAME': {
      const nameA = typeof payload.teamAName === 'string' ? payload.teamAName.trim() : '';
      const nameB = typeof payload.teamBName === 'string' ? payload.teamBName.trim() : '';
      if (nameA) state.teams.teamA.name = nameA;
      if (nameB) state.teams.teamB.name = nameB;
      state.phase = 'PLAYING';
      setEvent(state, { type: 'GAME_STARTED', sound: 'correct' });
      broadcastRoom(room);
      break;
    }

    case 'SET_PHASE': {
      const phase = payload.phase === 'INTRO' ? 'INTRO' : 'PLAYING';
      state.phase = phase;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'REVEAL_ANSWER': {
      const answerId = Number(payload.answerId);
      const givePoints = Boolean(payload.givePoints);
      if (state.revealedAnswerIds.includes(answerId)) return;

      const answer = currentQ.answers.find((a) => a.id === answerId);
      if (!answer) return;

      state.revealedAnswerIds = [...state.revealedAnswerIds, answerId];
      const pts = answer.points * state.roundMultiplier;
      const activeTeamId = state.activeTeamId;

      if (givePoints) {
        state.teams[activeTeamId].score += pts;
        state.roundPots += pts;
      }

      const allOpened = state.revealedAnswerIds.length >= currentQ.answers.length;
      setEvent(state, {
        type: 'ANSWER_REVEALED',
        sound: allOpened ? 'fanfare' : givePoints ? 'points' : 'reveal',
        teamId: givePoints ? activeTeamId : undefined,
        amount: givePoints ? pts : undefined,
        confetti: allOpened,
      });
      broadcastRoom(room);
      break;
    }

    case 'ADD_STRIKE': {
      const team = state.teams[state.activeTeamId];
      const nextStrikes = Math.min(3, team.strikes + 1);
      team.strikes = nextStrikes;
      setEvent(state, {
        type: 'STRIKE_ADDED',
        sound: 'wrong',
        teamId: state.activeTeamId,
        teamName: team.name,
        strikeCount: nextStrikes,
      });
      broadcastRoom(room);
      break;
    }

    case 'RESET_STRIKES': {
      state.teams.teamA.strikes = 0;
      state.teams.teamB.strikes = 0;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'SWITCH_TEAM': {
      state.activeTeamId = state.activeTeamId === 'teamA' ? 'teamB' : 'teamA';
      setEvent(state, { type: 'SOUNDBOARD', sound: 'reveal' });
      broadcastRoom(room);
      break;
    }

    case 'SET_ACTIVE_TEAM': {
      const teamId = payload.teamId === 'teamB' ? 'teamB' : 'teamA';
      state.activeTeamId = teamId;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'UPDATE_TEAM_NAME': {
      const teamId = payload.teamId === 'teamB' ? 'teamB' : 'teamA';
      const name = typeof payload.name === 'string' ? payload.name.trim() : '';
      if (name) {
        state.teams[teamId].name = name;
        state.lastEvent = null;
        broadcastRoom(room);
      }
      break;
    }

    case 'ADJUST_SCORE': {
      const teamId = payload.teamId === 'teamB' ? 'teamB' : 'teamA';
      const delta = Number(payload.delta) || 0;
      state.teams[teamId].score = Math.max(0, state.teams[teamId].score + delta);
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'REVEAL_ALL': {
      state.revealedAnswerIds = currentQ.answers.map((a) => a.id);
      setEvent(state, { type: 'ALL_REVEALED', sound: 'reveal' });
      broadcastRoom(room);
      break;
    }

    case 'GO_TO_QUESTION': {
      const idx = Number(payload.index);
      if (Number.isNaN(idx) || idx < 0 || idx >= state.questionOrder.length) return;
      state.currentQuestionIndex = idx;
      state.revealedAnswerIds = [];
      state.roundPots = 0;
      state.showTrivia = false;
      state.teams.teamA.strikes = 0;
      state.teams.teamB.strikes = 0;
      state.roundMultiplier = getMultiplierForQuestionIndex(state.questionOrder, idx);
      setEvent(state, { type: 'QUESTION_CHANGED', sound: 'reveal' });
      broadcastRoom(room);
      break;
    }

    case 'GO_TO_QUESTION_BY_ID': {
      const qId = Number(payload.questionId);
      const origIdx = INITIAL_QUESTIONS.findIndex((q) => q.id === qId);
      if (origIdx === -1) return;
      let orderIdx = state.questionOrder.indexOf(origIdx);
      if (orderIdx === -1) {
        state.questionOrder.push(origIdx);
        orderIdx = state.questionOrder.length - 1;
      }
      state.currentQuestionIndex = orderIdx;
      state.revealedAnswerIds = [];
      state.roundPots = 0;
      state.showTrivia = false;
      state.teams.teamA.strikes = 0;
      state.teams.teamB.strikes = 0;
      state.roundMultiplier = getMultiplierForQuestionIndex(state.questionOrder, orderIdx);
      setEvent(state, { type: 'QUESTION_CHANGED', sound: 'reveal' });
      broadcastRoom(room);
      break;
    }

    case 'NEXT_QUESTION': {
      if (state.currentQuestionIndex < state.questionOrder.length - 1) {
        handleRoomAction(room, 'GO_TO_QUESTION', { index: state.currentQuestionIndex + 1 });
      }
      break;
    }

    case 'PREV_QUESTION': {
      if (state.currentQuestionIndex > 0) {
        handleRoomAction(room, 'GO_TO_QUESTION', { index: state.currentQuestionIndex - 1 });
      }
      break;
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
      setEvent(state, { type: 'QUESTION_CHANGED', sound: 'drumRoll' });
      broadcastRoom(room);
      break;
    }

    case 'TOGGLE_PAUSE': {
      state.isPaused = !state.isPaused;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'TOGGLE_JACKPOT': {
      state.roundMultiplier = state.roundMultiplier > 1 ? 1 : 2;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'TOGGLE_TRIVIA': {
      state.showTrivia = !state.showTrivia;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'TOGGLE_SOUND': {
      state.soundEnabled = !state.soundEnabled;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'SOUNDBOARD': {
      const sound = payload.sound as SoundEffectName;
      if (sound) {
        setEvent(state, { type: 'SOUNDBOARD', sound });
        broadcastRoom(room);
      }
      break;
    }

    case 'TIMER_OPEN': {
      stopRoomTimer(room);
      state.timer = { isOpen: true, secondsLeft: 10, isRunning: false };
      state.lastEvent = null;
      startRoomTimer(room);
      break;
    }

    case 'TIMER_CLOSE': {
      stopRoomTimer(room);
      state.timer.isOpen = false;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'TIMER_START': {
      startRoomTimer(room);
      break;
    }

    case 'TIMER_PAUSE': {
      stopRoomTimer(room);
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'TIMER_RESET': {
      stopRoomTimer(room);
      state.timer = { isOpen: true, secondsLeft: 10, isRunning: false };
      state.lastEvent = null;
      startRoomTimer(room);
      break;
    }

    case 'LOTTERY_OPEN': {
      state.lottery = { isOpen: true, isSpinning: false, winner: null };
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'LOTTERY_CLOSE': {
      if (room.lotteryTimeout) {
        clearTimeout(room.lotteryTimeout);
        room.lotteryTimeout = null;
      }
      state.lottery = { isOpen: false, isSpinning: false, winner: null };
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'LOTTERY_SPIN': {
      if (room.lotteryTimeout) {
        clearTimeout(room.lotteryTimeout);
        room.lotteryTimeout = null;
      }
      state.lottery = { isOpen: true, isSpinning: true, winner: null };
      setEvent(state, { type: 'SOUNDBOARD', sound: 'drumRoll' });
      broadcastRoom(room);

      room.lotteryTimeout = setTimeout(() => {
        const winner: 'teamA' | 'teamB' = Math.random() > 0.5 ? 'teamA' : 'teamB';
        state.lottery = { isOpen: true, isSpinning: false, winner };
        setEvent(state, {
          type: 'LOTTERY_WIN',
          sound: 'correct',
          teamId: winner,
          teamName: state.teams[winner].name,
        });
        broadcastRoom(room);
      }, 1700);
      break;
    }

    case 'LOTTERY_APPLY': {
      if (state.lottery.winner) {
        state.activeTeamId = state.lottery.winner;
      }
      state.lottery = { isOpen: false, isSpinning: false, winner: null };
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'WINNER_OPEN': {
      state.showWinnerModal = true;
      setEvent(state, { type: 'SOUNDBOARD', sound: 'fanfare', confetti: true });
      broadcastRoom(room);
      break;
    }

    case 'WINNER_CLOSE': {
      state.showWinnerModal = false;
      state.lastEvent = null;
      broadcastRoom(room);
      break;
    }

    case 'RESET_GAME': {
      stopRoomTimer(room);
      if (room.lotteryTimeout) {
        clearTimeout(room.lotteryTimeout);
        room.lotteryTimeout = null;
      }
      const keepNameA = state.teams.teamA.name;
      const keepNameB = state.teams.teamB.name;
      const fresh = createInitialGameState();
      fresh.teams.teamA.name = keepNameA;
      fresh.teams.teamB.name = keepNameB;
      fresh.phase = payload.toIntro ? 'INTRO' : 'PLAYING';
      setEvent(fresh, { type: 'GAME_RESET', sound: 'correct' });
      room.state = fresh;
      broadcastRoom(room);
      break;
    }

    default:
      break;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: IFP connects to the stage room (no PIN exposed to IFP)
  app.post('/api/stage/connect', (_req, res) => {
    res.json({
      roomId: stageRoom.id,
      state: stageRoom.state,
      presence: getPresence(stageRoom),
    });
  });

  // API: Verify secret MC PIN (known only by MC)
  app.post('/api/mc/verify', (req, res) => {
    const pin = String(req.body?.pin || '').trim();
    if (!pin || pin !== currentMcPin) {
      res.status(401).json({
        ok: false,
        message: 'PIN MC salah. Hanya MC yang mengetahui kode akses.',
      });
      return;
    }
    res.json({
      ok: true,
      roomId: stageRoom.id,
      state: stageRoom.state,
      presence: getPresence(stageRoom),
    });
  });

  // API: Change secret MC PIN from inside authenticated MC dashboard
  app.post('/api/mc/change-pin', (req, res) => {
    const oldPin = String(req.body?.currentPin || '').trim();
    const newPin = String(req.body?.newPin || '').trim();
    if (oldPin !== currentMcPin) {
      res.status(401).json({ ok: false, message: 'PIN lama tidak sesuai.' });
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      res.status(400).json({ ok: false, message: 'PIN baru harus 4 sampai 6 digit angka.' });
      return;
    }
    currentMcPin = newPin;
    res.json({ ok: true, message: 'PIN MC berhasil diperbarui.' });
  });

  // API: HTTP action fallback for IFP & authenticated MC
  app.post('/api/stage/action', (req, res) => {
    const role = req.body?.role === 'mc' ? 'mc' : 'ifp';
    if (role === 'mc') {
      const pin = String(req.body?.pin || '').trim();
      if (pin !== currentMcPin) {
        res.status(401).json({ error: 'PIN MC tidak valid.' });
        return;
      }
    }
    const action = String(req.body?.action || '');
    const payload = (req.body?.payload || {}) as Record<string, unknown>;
    handleRoomAction(stageRoom, action, payload);
    res.json({
      ok: true,
      roomId: stageRoom.id,
      state: stageRoom.state,
      presence: getPresence(stageRoom),
    });
  });

  const httpServer = createServer(app);

  // WebSocket server on dedicated /ws path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const roleParam = reqUrl.searchParams.get('role');
    const role: 'ifp' | 'mc' = roleParam === 'mc' ? 'mc' : 'ifp';
    const pin = (reqUrl.searchParams.get('pin') || '').trim();

    if (role === 'mc' && pin !== currentMcPin) {
      ws.send(
        JSON.stringify({
          type: 'ERROR',
          code: 'INVALID_PIN',
          message: 'PIN MC tidak valid atau sudah diubah.',
        })
      );
      ws.close(4001, 'Invalid MC PIN');
      return;
    }

    const clientMeta: ClientMeta = { ws, role };
    stageRoom.clients.add(clientMeta);

    ws.send(
      JSON.stringify({
        type: 'STATE_SYNC',
        roomId: stageRoom.id,
        state: stageRoom.state,
        presence: getPresence(stageRoom),
      })
    );

    broadcastPresence(stageRoom);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ACTION') {
          handleRoomAction(stageRoom, String(msg.action || ''), msg.payload || {});
        } else if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      stageRoom.clients.delete(clientMeta);
      broadcastPresence(stageRoom);
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProd || !fs.existsSync(distPath)) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Family 100 HGN Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
