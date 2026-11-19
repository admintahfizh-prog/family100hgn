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
  const [retryNonce, setRetryNonce] = useState(0);
  const stageDocRef = useRef<StageDocument | null>(null);
  const rawStageDocRef = useRef<Record<string, unknown> | null>(null);
  const creatingStageRef = useRef<string | null>(null);
  const creatingPromiseRef = useRef<Promise<void> | null>(null);
  const hasServerSnapshotRef = useRef<boolean>(false);
  const serverConfirmedCompleteRef = useRef<boolean>(false);
  const actionQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    stageDocRef.current = stageDoc;
  }, [stageDoc]);

  const retryConnection = useCallback(() => {
    setRetryNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user || !effectiveStageId) {
      setStatus('idle');
      setStageDoc(null);
      rawStageDocRef.current = null;
      creatingPromiseRef.current = null;
      hasServerSnapshotRef.current = false;
      serverConfirmedCompleteRef.current = false;
      setMatches([]);
      return;
    }

    setStatus('connecting');
    setErrorMessage(null);
    hasServerSnapshotRef.current = false;
    serverConfirmedCompleteRef.current = false;

    const stagePath = `stages/${effectiveStageId}`;
    const docRef = doc(db, 'stages', effectiveStageId);

    const unsubscribeStage = onSnapshot(
      docRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          if (snapshot.metadata.fromCache) {
            return;
          }
          if (effectiveStageId === user.uid) {
            if (creatingStageRef.current === effectiveStageId) return;
            creatingStageRef.current = effectiveStageId;
            const createTask = (async () => {
              try {
                const initial = createInitialStageDocument(user.uid, '2511');
                await setDoc(docRef, {
                  ...initial,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
                serverConfirmedCompleteRef.current = true;
              } catch (err) {
                setStatus('error');
                setErrorMessage('Gagal membuat panggung game di Firestore.');
                handleFirestoreError(err, OperationType.CREATE, stagePath);
              } finally {
                creatingStageRef.current = null;
                creatingPromiseRef.current = null;
              }
            })();
            creatingPromiseRef.current = createTask;
            await createTask;
          } else {
            setStatus('error');
            setErrorMessage(
              'Stage tidak ditemukan atau akun Google Anda belum didaftarkan sebagai Co-Host oleh pemilik stage.'
            );
          }
          return;
        }

        const raw = snapshot.data() as Record<string, unknown>;
        const isPendingLocal = snapshot.metadata.hasPendingWrites;
        if (!isPendingLocal) {
          hasServerSnapshotRef.current = true;
          serverConfirmedCompleteRef.current = isStageMetadataComplete(raw);
        }

        const prevRaw = rawStageDocRef.current;
        const mergedRaw: Record<string, unknown> = { ...raw };
        if (isPendingLocal && prevRaw) {
          if (!isFirestoreTimestampLike(mergedRaw.createdAt) && isFirestoreTimestampLike(prevRaw.createdAt)) {
            mergedRaw.createdAt = prevRaw.createdAt;
          }
          if (!isFirestoreTimestampLike(mergedRaw.updatedAt) && isFirestoreTimestampLike(prevRaw.updatedAt)) {
            mergedRaw.updatedAt = prevRaw.updatedAt;
          }
        }
        rawStageDocRef.current = mergedRaw;

        const normalizedState = normalizeGameState(raw);
        const data: StageDocument = {
          ...normalizedState,
          ownerId: typeof raw.ownerId === 'string' ? raw.ownerId : effectiveStageId,
          mcPin: typeof raw.mcPin === 'string' && /^\d{4,6}$/.test(raw.mcPin) ? raw.mcPin : '2511',
          allowedEmails: Array.isArray(raw.allowedEmails)
            ? raw.allowedEmails.filter((e): e is string => typeof e === 'string').slice(0, 10)
            : [],
          updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : effectiveStageId,
          createdAt: mergedRaw.createdAt,
          updatedAt: mergedRaw.updatedAt,
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
  }, [isAuthReady, user, effectiveStageId, retryNonce]);

  const sendAction = useCallback(
    (action: string, payload: Record<string, unknown> = {}) => {
      const run = async () => {
        if (!user || !effectiveStageId) return;
        if (creatingPromiseRef.current) {
          await creatingPromiseRef.current.catch(() => {});
        }

        const stagePath = `stages/${effectiveStageId}`;
        const docRef = doc(db, 'stages', effectiveStageId);

        let raw: Record<string, unknown> | null = rawStageDocRef.current
          ? { ...rawStageDocRef.current }
          : null;

        if (!raw) {
          try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;
            raw = snap.data() as Record<string, unknown>;
            if (!snap.metadata.hasPendingWrites) {
              hasServerSnapshotRef.current = true;
              serverConfirmedCompleteRef.current = isStageMetadataComplete(raw);
            }
            rawStageDocRef.current = { ...raw };
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, stagePath);
          }
        }

        if (!raw) return;

        const prevRawSnapshot = { ...raw };
        const normalizedCurrent = normalizeGameState(raw);
        const nextGameState = applyGameAction(normalizedCurrent, action, payload);
        if (!nextGameState) return;

        const needsLegacyRepair =
          hasServerSnapshotRef.current &&
          !serverConfirmedCompleteRef.current &&
          !isStageMetadataComplete(raw) &&
          raw.ownerId === user.uid;

        try {
          if (needsLegacyRepair) {
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

            const cleanedRaw: Record<string, unknown> = {
              ...raw,
              ...nextGameState,
              mcPin: safePin,
              allowedEmails: safeEmails,
              updatedBy: user.uid,
            };

            for (const existingKey of Object.keys(raw)) {
              if (!(STAGE_REQUIRED_KEYS as readonly string[]).includes(existingKey)) {
                repairPatch[existingKey] = deleteField();
                delete cleanedRaw[existingKey];
              }
            }

            rawStageDocRef.current = cleanedRaw;
            await updateDoc(docRef, repairPatch);
            serverConfirmedCompleteRef.current = true;
            return;
          }

          const patch: Record<string, unknown> = {
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          };
          const optimisticRaw: Record<string, unknown> = {
            ...raw,
            updatedBy: user.uid,
          };

          for (const key of GAMEPLAY_SYNC_KEYS) {
            const prevSerialized = JSON.stringify(raw[key] ?? null);
            const nextSerialized = JSON.stringify(nextGameState[key] ?? null);
            if (!(key in raw) || prevSerialized !== nextSerialized) {
              patch[key] = nextGameState[key];
              optimisticRaw[key] = nextGameState[key];
            }
          }

          rawStageDocRef.current = optimisticRaw;
          await updateDoc(docRef, patch);
        } catch (err) {
          rawStageDocRef.current = prevRawSnapshot;
          handleFirestoreError(err, OperationType.UPDATE, stagePath);
        }
      };

      const nextTask = actionQueueRef.current.then(run, run);
      actionQueueRef.current = nextTask.catch(() => {});
      return nextTask;
    },
    [user, effectiveStageId]
  );

  const updateStageSettings = useCallback(
    async (updates: { mcPin?: string; allowedEmails?: string[] }) => {
      if (!user || !effectiveStageId) return;
      if (creatingPromiseRef.current) {
        await creatingPromiseRef.current.catch(() => {});
      }
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
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;
        const raw = snap.data() as Record<string, unknown>;
        const shouldRepair =
          !snap.metadata.hasPendingWrites &&
          !serverConfirmedCompleteRef.current &&
          !isStageMetadataComplete(raw) &&
          raw.ownerId === user.uid;

        if (shouldRepair) {
          const normalized = normalizeGameState(raw);
          const repairPatch: Record<string, unknown> = {
            ...normalized,
            mcPin: nextPin,
            allowedEmails: nextEmails,
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
          serverConfirmedCompleteRef.current = true;
          return;
        }

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
    retryConnection,
  };
}
