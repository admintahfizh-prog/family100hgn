import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext.tsx';
import type { GameState, MatchRecord, StageDocument } from '../types/game.ts';
import {
  applyGameAction,
  createInitialStageDocument,
  isFirestoreTimestampLike,
  isStageMetadataComplete,
  normalizeGameState,
  STAGE_REQUIRED_KEYS,
} from '../services/stageEngine.ts';

export type SyncStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UseFirestoreStageOptions {
  requestedStageId?: string | null;
}

const GAMEPLAY_SYNC_KEYS: (keyof GameState)[] = [
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
];

export function useFirestoreStage({ requestedStageId }: UseFirestoreStageOptions = {}) {
  const { user, isAuthReady } = useFirebaseAuth();
  const effectiveStageId = requestedStageId?.trim() || user?.uid || null;

  const [stageDoc, setStageDoc] = useState<StageDocument | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stageDocRef = useRef<StageDocument | null>(null);
  const creatingStageRef = useRef<string | null>(null);

  useEffect(() => {
    stageDocRef.current = stageDoc;
  }, [stageDoc]);

  useEffect(() => {
    if (!isAuthReady || !user || !effectiveStageId) {
      setStatus('idle');
      setStageDoc(null);
      setMatches([]);
      return;
    }

    setStatus('connecting');
    setErrorMessage(null);

    const stagePath = `stages/${effectiveStageId}`;
    const docRef = doc(db, 'stages', effectiveStageId);

    const unsubscribeStage = onSnapshot(
      docRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          if (effectiveStageId === user.uid) {
            if (creatingStageRef.current === effectiveStageId) return;
            creatingStageRef.current = effectiveStageId;
            try {
              const initial = createInitialStageDocument(user.uid, '2511');
              await setDoc(docRef, {
                ...initial,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              setStatus('error');
              setErrorMessage('Gagal membuat panggung game di Firestore.');
              handleFirestoreError(err, OperationType.CREATE, stagePath);
            } finally {
              creatingStageRef.current = null;
            }
          } else {
            setStatus('error');
            setErrorMessage(
              'Stage tidak ditemukan atau akun Google Anda belum didaftarkan sebagai Co-Host oleh pemilik stage.'
            );
          }
          return;
        }

        const raw = snapshot.data() as Record<string, unknown>;
        const normalizedState = normalizeGameState(raw);
        const data: StageDocument = {
          ...normalizedState,
          ownerId: typeof raw.ownerId === 'string' ? raw.ownerId : effectiveStageId,
          mcPin: typeof raw.mcPin === 'string' && /^\d{4,6}$/.test(raw.mcPin) ? raw.mcPin : '2511',
          allowedEmails: Array.isArray(raw.allowedEmails)
            ? raw.allowedEmails.filter((e): e is string => typeof e === 'string').slice(0, 10)
            : [],
          updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : effectiveStageId,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        };
        setStageDoc(data);
        setStatus('connected');
        setErrorMessage(null);
      },
      (err) => {
        setStatus('error');
        setErrorMessage(
          'Akses ditolak atau koneksi Firestore terputus. Pastikan akun Google memiliki izin ke stage ini.'
        );
        handleFirestoreError(err, OperationType.GET, stagePath);
      }
    );

    const matchesPath = `stages/${effectiveStageId}/matches`;
    let unsubscribeMatches: (() => void) | null = null;

    if (effectiveStageId === user.uid) {
      const matchesQuery = query(
        collection(db, 'stages', effectiveStageId, 'matches'),
        where('ownerId', '==', user.uid),
        limit(50)
      );

      unsubscribeMatches = onSnapshot(
        matchesQuery,
        (snap) => {
          const list: MatchRecord[] = snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<MatchRecord, 'id'>),
            }))
            .sort((a, b) => {
              const aSec = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
              const bSec = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
              return bSec - aSec;
            });
          setMatches(list);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, matchesPath);
        }
      );
    }

    return () => {
      unsubscribeStage();
      if (unsubscribeMatches) unsubscribeMatches();
    };
  }, [isAuthReady, user, effectiveStageId]);

  const sendAction = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      if (!user || !effectiveStageId) return;
      const stagePath = `stages/${effectiveStageId}`;
      const docRef = doc(db, 'stages', effectiveStageId);

      let raw: Record<string, unknown> | null = null;
      try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;
        raw = snap.data() as Record<string, unknown>;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, stagePath);
      }

      if (!raw) return;

      const normalizedCurrent = normalizeGameState(raw);
      const nextGameState = applyGameAction(normalizedCurrent, action, payload);
      if (!nextGameState) return;

      try {
        if (!isStageMetadataComplete(raw) && raw.ownerId === user.uid) {
          const safePin =
            typeof raw.mcPin === 'string' && /^\d{4,6}$/.test(raw.mcPin) ? raw.mcPin : '2511';
          const safeEmails = Array.isArray(raw.allowedEmails)
            ? raw.allowedEmails
                .filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
                .map((e) => e.trim().toLowerCase().slice(0, 120))
                .slice(0, 10)
            : [];

          const repairPatch: Record<string, unknown> = {
            ...nextGameState,
            mcPin: safePin,
            allowedEmails: safeEmails,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          };

          if (!isFirestoreTimestampLike(raw.createdAt)) {
            repairPatch.createdAt = serverTimestamp();
          }

          for (const existingKey of Object.keys(raw)) {
            if (!(STAGE_REQUIRED_KEYS as readonly string[]).includes(existingKey)) {
              repairPatch[existingKey] = deleteField();
            }
          }

          await updateDoc(docRef, repairPatch);
          return;
        }

        const patch: Record<string, unknown> = {
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        };

        for (const key of GAMEPLAY_SYNC_KEYS) {
          const prevSerialized = JSON.stringify(raw[key] ?? null);
          const nextSerialized = JSON.stringify(nextGameState[key] ?? null);
          if (!(key in raw) || prevSerialized !== nextSerialized) {
            patch[key] = nextGameState[key];
          }
        }

        await updateDoc(docRef, patch);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, stagePath);
      }
    },
    [user, effectiveStageId]
  );

  const updateStageSettings = useCallback(
    async (updates: { mcPin?: string; allowedEmails?: string[] }) => {
      if (!user || !effectiveStageId) return;
      const current = stageDocRef.current;
      if (!current || current.ownerId !== user.uid) return;

      const stagePath = `stages/${effectiveStageId}`;
      const docRef = doc(db, 'stages', effectiveStageId);
      const nextPin = updates.mcPin !== undefined ? updates.mcPin.trim() : current.mcPin;
      const nextEmails =
        updates.allowedEmails !== undefined
          ? updates.allowedEmails
              .map((e) => e.trim().toLowerCase())
              .filter((e) => e.length > 0 && e.length <= 120)
              .slice(0, 10)
          : current.allowedEmails;

      if (!/^\d{4,6}$/.test(nextPin)) {
        throw new Error('PIN MC harus 4 sampai 6 digit angka.');
      }

      try {
        await updateDoc(docRef, {
          mcPin: nextPin,
          allowedEmails: nextEmails,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, stagePath);
      }
    },
    [user, effectiveStageId]
  );

  const saveMatchRecord = useCallback(async () => {
    const current = stageDocRef.current;
    if (!user || !effectiveStageId || !current) return null;

    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const matchPath = `stages/${effectiveStageId}/matches/${matchId}`;
    const teamA = current.teams.teamA;
    const teamB = current.teams.teamB;
    const winnerName =
      teamA.score === teamB.score
        ? 'Seri'
        : teamA.score > teamB.score
        ? teamA.name
        : teamB.name;

    try {
      await setDoc(doc(db, 'stages', effectiveStageId, 'matches', matchId), {
        ownerId: user.uid,
        stageId: effectiveStageId,
        teamAName: teamA.name.slice(0, 80),
        teamAScore: Math.max(0, Math.trunc(teamA.score)),
        teamBName: teamB.name.slice(0, 80),
        teamBScore: Math.max(0, Math.trunc(teamB.score)),
        winnerName: winnerName.slice(0, 80),
        totalQuestionsPlayed: Math.min(200, (current.completedQuestionIds ?? []).length),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return matchId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, matchPath);
    }
  }, [user, effectiveStageId]);

  const deleteMatchRecord = useCallback(
    async (matchId: string) => {
      if (!user || !effectiveStageId) return;
      const matchPath = `stages/${effectiveStageId}/matches/${matchId}`;
      try {
        await deleteDoc(doc(db, 'stages', effectiveStageId, 'matches', matchId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, matchPath);
      }
    },
    [user, effectiveStageId]
  );

  const gameState: GameState | null = stageDoc;

  return {
    stageId: effectiveStageId,
    stageDoc,
    gameState,
    matches,
    status,
    errorMessage,
    isOwner: Boolean(user && stageDoc && stageDoc.ownerId === user.uid),
    sendAction,
    updateStageSettings,
    saveMatchRecord,
    deleteMatchRecord,
  };
}
