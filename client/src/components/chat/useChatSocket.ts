import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/keys";
import type { ChatMessageWithUser, ChatServerFrame } from "./types";

const PING_MS = 25_000;
const BACKOFF_START_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

export type ChatSocketStatus = "connecting" | "open" | "closed";

/** Insert or replace a message in the cached list, keeping it ordered oldest first. */
export function upsertMessage(list: ChatMessageWithUser[] | undefined, msg: ChatMessageWithUser): ChatMessageWithUser[] {
  const rest = (list ?? []).filter((m) => m.id !== msg.id);
  return [...rest, msg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id - b.id);
}

function isFrame(v: unknown): v is ChatServerFrame {
  return typeof v === "object" && v !== null && typeof (v as { type?: unknown }).type === "string";
}

/**
 * Live chat updates over /ws. Frames patch the `keys.chat.all` cache directly.
 * Reconnects with exponential backoff and keeps the connection alive with a ping.
 */
export function useChatSocket(enabled = true): ChatSocketStatus {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ChatSocketStatus>("connecting");

  useEffect(() => {
    if (!enabled) return;
    let ws: WebSocket | null = null;
    let ping: ReturnType<typeof setInterval> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let backoff = BACKOFF_START_MS;
    let disposed = false;

    const handle = (frame: ChatServerFrame) => {
      if (frame.type === "message") {
        qc.setQueryData<ChatMessageWithUser[]>(keys.chat.all, (old) => upsertMessage(old, frame.message));
      } else if (frame.type === "deleted") {
        qc.setQueryData<ChatMessageWithUser[]>(keys.chat.all, (old) => (old ?? []).filter((m) => m.id !== frame.id));
      } else if (frame.type === "cleared") {
        qc.setQueryData<ChatMessageWithUser[]>(keys.chat.all, []);
      }
    };

    const connect = () => {
      if (disposed) return;
      setStatus("connecting");
      const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }
      ws.onopen = () => {
        backoff = BACKOFF_START_MS;
        setStatus("open");
        // Catch up on anything missed while disconnected.
        qc.invalidateQueries({ queryKey: keys.chat.all });
        ping = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, PING_MS);
      };
      ws.onmessage = (ev: MessageEvent) => {
        if (typeof ev.data !== "string") return;
        try {
          const parsed: unknown = JSON.parse(ev.data);
          if (isFrame(parsed)) handle(parsed);
        } catch {
          /* ignore malformed frame */
        }
      };
      ws.onclose = () => {
        if (ping) clearInterval(ping);
        ping = undefined;
        ws = null;
        if (!disposed) scheduleReconnect();
      };
      ws.onerror = () => ws?.close();
    };

    const scheduleReconnect = () => {
      setStatus("closed");
      retry = setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, BACKOFF_MAX_MS);
    };

    connect();
    return () => {
      disposed = true;
      if (ping) clearInterval(ping);
      if (retry) clearTimeout(retry);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [enabled, qc]);

  return status;
}
