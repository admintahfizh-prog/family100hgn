import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameState, RoomPresence } from '../types/game.ts';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseRoomSyncOptions {
  enabled: boolean;
  role: 'ifp' | 'mc';
  pin?: string | null;
  initialState?: GameState | null;
}

export function useRoomSync({
  enabled,
  role,
  pin = null,
  initialState = null,
}: UseRoomSyncOptions) {
  const [gameState, setGameState] = useState<GameState | null>(initialState);
  const [presence, setPresence] = useState<RoomPresence>({ ifpCount: 0, mcCount: 0 });
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    if (initialState && !gameState) {
      setGameState(initialState);
    }
  }, [initialState, gameState]);

  const cleanupTimers = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setGameState(null);
      return;
    }

    shouldReconnectRef.current = true;

    const connect = () => {
      cleanupTimers();
      setStatus('connecting');
      setErrorMessage(null);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const query = new URLSearchParams({ role });
      if (pin) {
        query.set('pin', pin);
      }
      const wsUrl = `${protocol}//${window.location.host}/ws?${query.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setErrorMessage(null);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'STATE_SYNC') {
            setGameState(msg.state);
            if (msg.presence) setPresence(msg.presence);
          } else if (msg.type === 'PRESENCE') {
            if (msg.presence) setPresence(msg.presence);
          } else if (msg.type === 'ERROR') {
            setStatus('error');
            setErrorMessage(msg.message || 'Terjadi kesalahan koneksi.');
            if (msg.code === 'INVALID_PIN') {
              shouldReconnectRef.current = false;
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = (ev) => {
        cleanupTimers();
        if (ev.code === 4001) {
          shouldReconnectRef.current = false;
          setStatus('error');
          return;
        }
        if (shouldReconnectRef.current) {
          setStatus('disconnected');
          reconnectTimerRef.current = setTimeout(connect, 1500);
        }
      };

      ws.onerror = () => {
        // onclose will handle reconnect
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      cleanupTimers();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, role, pin]);

  const sendAction = useCallback(
    (action: string, payload: Record<string, unknown> = {}) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ACTION', action, payload }));
        return;
      }

      if (enabled) {
        fetch('/api/stage/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            pin: pin || undefined,
            action,
            payload,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.state) {
              setGameState(data.state);
              if (data.presence) setPresence(data.presence);
            }
          })
          .catch(() => {});
      }
    },
    [enabled, role, pin]
  );

  return {
    gameState,
    presence,
    status,
    errorMessage,
    sendAction,
  };
}
