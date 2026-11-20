import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const DEFAULT_STAGE_ID = 'main-stage';
const CLIENT_ID_STORAGE_KEY = 'hgn_family100_client_id';
const VALID_STAGE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

function resolveStageId(requested?: string | null): string {
  const trimmed = requested?.trim() || '';
  if (trimmed && VALID_STAGE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }
  return DEFAULT_STAGE_ID;
}

function getClientActorId(): string {
  if (typeof window === 'undefined') return 'stage-host';
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing && VALID_STAGE_ID_REGEX.test(existing)) {
      return existing;
    }
    const generated = `host-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'stage-host';
  }
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
  const effectiveStageId = resolveStageId(requestedStageId);
  const actorId = useMemo(() => getClientActorId(), []);

  const [stageDoc, setStageDoc] = useState<StageDocument | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [status, setStatus] = useState<SyncStatus>('connecting');
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
    setStatus('connecting');
    setErrorMessage(null);
    rawStageDocRef.current = null;
    creatingPromiseRef.current = null;
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
          if (creatingStageRef.current === effectiveStageId) return;
          creatingStageRef.current = effectiveStageId;
          const createTask = (async () => {
            try {
              const initial = createInitialStageDocument('public-stage', '2511');
              await setDoc(docRef, {
                ...initial,
                updatedBy: actorId,
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
          ownerId: typeof raw.ownerId === 'string' && raw.ownerId.trim() ? raw.ownerId : 'public-stage',
          mcPin: typeof raw.mcPin === 'string' && /^\d{4,6}$/.test(raw.mcPin) ? raw.mcPin : '2511',
          allowedEmails: Array.isArray(raw.allowedEmails)
            ? raw.allowedEmails.filter((e): e is string => typeof e === 'string').slice(0, 10)
            : [],
          updatedBy: typeof raw.updatedBy === 'string' && raw.updatedBy.trim() ? raw.updatedBy : actorId,
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
          'Gagal terhubung ke Firebase Firestore. Pastikan koneksi internet aktif dan aturan database sudah benar.'
        );
        handleFirestoreError(err, OperationType.GET, stagePath);
      }
    );

    const matchesPath = `stages/${effectiveStageId}/matches`;
    const matchesQuery = query(
      collection(db, 'stages', effectiveStageId, 'matches'),
      where('stageId', '==', effectiveStageId),
      limit(50)
    );

    const unsubscribeMatches = onSnapshot(
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

    return () => {
      unsubscribeStage();
      unsubscribeMatches();
    };
  }, [effectiveStageId, actorId, retryNonce]);

  const sendAction = useCallback(
    (action: string, payload: Record<string, unknown> = {}) => {
      const run = async () => {
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
          !isStageMetadataComplete(raw);

        try {
          if (needsLegacyRepair) {
            const safeOwnerId =
              typeof raw.ownerId === 'string' && raw.ownerId.trim()
                ? raw.ownerId.trim().slice(0, 128)
                : 'public-stage';
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
              updatedBy: actorId,
              updatedAt: serverTimestamp(),
            };

            if (typeof raw.ownerId !== 'string' || !raw.ownerId.trim()) {
              repairPatch.ownerId = safeOwnerId;
            }

            if (!isFirestoreTimestampLike(raw.createdAt)) {
              repairPatch.createdAt = serverTimestamp();
            }

            const cleanedRaw: Record<string, unknown> = {
              ...raw,
              ...nextGameState,
              ownerId: safeOwnerId,
              mcPin: safePin,
              allowedEmails: safeEmails,
              updatedBy: actorId,
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
            updatedBy: actorId,
            updatedAt: serverTimestamp(),
          };
          const optimisticRaw: Record<string, unknown> = {
            ...raw,
            updatedBy: actorId,
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
    [effectiveStageId, actorId]
  );

  const updateStageSettings = useCallback(
    async (updates: { mcPin?: string; allowedEmails?: string[] }) => {
      if (creatingPromiseRef.current) {
        await creatingPromiseRef.current.catch(() => {});
      }
      const current = stageDocRef.current;
      if (!current) return;

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
          !isStageMetadataComplete(raw);

        if (shouldRepair) {
          const normalized = normalizeGameState(raw);
          const safeOwnerId =
            typeof raw.ownerId === 'string' && raw.ownerId.trim()
              ? raw.ownerId.trim().slice(0, 128)
              : 'public-stage';
          const repairPatch: Record<string, unknown> = {
            ...normalized,
            mcPin: nextPin,
            allowedEmails: nextEmails,
            updatedBy: actorId,
            updatedAt: serverTimestamp(),
          };
          if (typeof raw.ownerId !== 'string' || !raw.ownerId.trim()) {
            repairPatch.ownerId = safeOwnerId;
          }
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
          updatedBy: actorId,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, stagePath);
      }
    },
    [effectiveStageId, actorId]
  );

  const saveMatchRecord = useCallback(async () => {
    const current = stageDocRef.current;
    if (!current) return null;

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
        ownerId: actorId,
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
  }, [effectiveStageId, actorId]);

  const deleteMatchRecord = useCallback(
    async (matchId: string) => {
      const matchPath = `stages/${effectiveStageId}/matches/${matchId}`;
      try {
        await deleteDoc(doc(db, 'stages', effectiveStageId, 'matches', matchId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, matchPath);
      }
    },
    [effectiveStageId]
  );

  const gameState: GameState | null = stageDoc;

  return {
    stageId: effectiveStageId,
    stageDoc,
    gameState,
    matches,
    status,
    errorMessage,
    isOwner: Boolean(stageDoc),
    sendAction,
    updateStageSettings,
    saveMatchRecord,
    deleteMatchRecord,
    retryConnection,
  };
}
