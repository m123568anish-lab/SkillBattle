"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export type BattleSocketEvent =
  | "player_joined"
  | "player_left"
  | "battle_started"
  | "battle_finished"
  | "submission"
  | "score_updated"
  | "timer_updated"
  | "state_sync"
  | "forfeit"
  | "chat"
  | "system"
  | string;

export interface BattleSocketMessage {
  event: BattleSocketEvent;
  data: Record<string, unknown>;
}

export interface UseBattleSocketOptions {
  battleId: string;
  onMessage?: (msg: BattleSocketMessage) => void;
  maxRetries?: number;
}

export interface UseBattleSocketReturn {
  connected: boolean;
  sendEvent: (event: string, data: Record<string, unknown>) => void;
  lastMessage: BattleSocketMessage | null;
}

function buildWsUrl(battleId: string, userId?: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const wsBase = base.replace(/^http/, "ws");
  const url = new URL(`${wsBase}/api/v1/battle/ws/${battleId}`);
  if (userId) url.searchParams.set("user_id", userId);
  return url.toString();
}

export function useBattleSocket({
  battleId,
  onMessage,
  maxRetries = 5,
}: UseBattleSocketOptions): UseBattleSocketReturn {
  const user = useAuthStore((s) => s.user);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<BattleSocketMessage | null>(null);

  // Stable callback ref
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    // Close existing socket if any
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const url = buildWsUrl(battleId, user?.id);
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
      setConnected(true);
    };

    ws.onmessage = (ev) => {
      try {
        const msg: BattleSocketMessage = JSON.parse(ev.data);
        setLastMessage(msg);
        onMessageRef.current?.(msg);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      if (retryCount.current < maxRetries) {
        const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
        retryCount.current += 1;
        retryTimer.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      // onerror is always followed by onclose, so reconnect is handled there
    };
  }, [battleId, user?.id, maxRetries]);

  useEffect(() => {
    connect();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendEvent = useCallback((event: string, data: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ event, data }));
  }, []);

  return { connected, sendEvent, lastMessage };
}
