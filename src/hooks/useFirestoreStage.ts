import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext.tsx';
import type { GameState, MatchRecord, StageDocument } from '../types/game.ts';
import { applyGameAction, createInitialStageDocument } from '../services/stageEngine.ts';

export type SyncStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface UseFirestoreStageOptions {
  requestedStageId?: string | null;
}

export function useFirestoreStage({ requestedStageId }: UseFirestoreStageOptions = {}) {
  const { user, isAuthReady } = useFirebaseAuth();
  const effectiveStageId = requestedStageId?.trim() || user?.uid || null;

  const [stageDoc, setStageDoc] = useState<StageDocument | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stageDocRef = useRef<StageDocument | null>(null);

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
            }
          } else {
            setStatus('error');
            setErrorMessage(
              'Stage tidak ditemukan atau akun Google Anda belum didaftarkan sebagai Co-Host oleh pemilik stage.'
            );
          }
          return;
        }

        const data = snapshot.data() as StageDocument;
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

      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(docRef);
          if (!snap.exists()) return;
          const current = snap.data() as StageDocument;
          const nextGameState = applyGameAction(current, action, payload);
          if (!nextGameState) return;

          tx.update(docRef, {
            phase: nextGameState.phase,
            currentQuestionIndex: nextGameState.currentQuestionIndex,
            revealedAnswerIds: nextGameState.revealedAnswerIds,
            activeTeamId: nextGameState.activeTeamId,
            roundMultiplier: nextGameState.roundMultiplier,
            teams: nextGameState.teams,
            isPaused: nextGameState.isPaused,
            soundEnabled: nextGameState.soundEnabled,
            questionOrder: nextGameState.questionOrder,
            completedQuestionIds: nextGameState.completedQuestionIds,
            roundPots: nextGameState.roundPots,
            showTrivia: nextGameState.showTrivia,
            showWinnerModal: nextGameState.showWinnerModal,
            timer: nextGameState.timer,
            lottery: nextGameState.lottery,
            lastEvent: nextGameState.lastEvent,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          });
        });
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
        totalQuestionsPlayed: Math.min(200, current.completedQuestionIds.length),
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
