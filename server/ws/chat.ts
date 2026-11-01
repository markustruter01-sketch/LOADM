import type { Server, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, WebSocket } from "ws";
import { ROLES, roleHas, type Role } from "@shared/constants";
import { insertChatMessageSchema, type User } from "@shared/schema";
import { DEMO_ROLE_COOKIE, loadPersona } from "../middleware/persona";
import { createMessage, purgeExpiredMessages } from "../services/chat-service";
import { logger } from "../lib/logger";

/**
 * Help-desk chat socket, speaking the protocol of components/chat-system.tsx:
 *   client → {type:'auth', ...}                         server → {type:'auth_success'}
 *   client → {type:'chat_message', messageType, content} server → {type:'new_message', message} to everyone
 * Identity is the persona cookie read at upgrade; the client's auth frame is
 * acknowledged but never trusted.
 */

const WS_PATH = "/ws";
const HEARTBEAT_MS = 30_000;
const CLEANUP_MS = 6 * 60 * 60 * 1000;
/** Close code sent when the visitor has not chosen a role. */
const CLOSE_NO_PERSONA = 4401;

const clients = new Set<WebSocket>();
const alive = new WeakMap<WebSocket, boolean>();

function send(ws: WebSocket, frame: object): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(frame));
}

function broadcast(frame: object): void {
  for (const ws of clients) send(ws, frame);
}

function cookieValue(header: string | undefined, name: string): string | undefined {
  for (const part of (header ?? "").split(";")) {
    const idx = part.indexOf("=");
    if (idx !== -1 && part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

async function handleFrame(ws: WebSocket, persona: User, frame: { type?: unknown }): Promise<void> {
  if (frame.type === "auth") {
    send(ws, { type: "auth_success" });
    return;
  }
  if (frame.type !== "chat_message") return;
  const parsed = insertChatMessageSchema.safeParse(frame);
  if (!parsed.success) {
    send(ws, { type: "error", message: "Invalid message" });
    return;
  }
  if (parsed.data.messageType === "answer" && !roleHas(persona.role, "instruct")) {
    send(ws, { type: "error", message: "Only instructors can post answers" });
    return;
  }
  broadcast({ type: "new_message", message: await createMessage(persona, parsed.data) });
}

export function attachChatServer(httpServer: Server): void {
  // `noServer` so that upgrades for other paths (Vite HMR in development)
  // are left untouched instead of being answered with a 400 by ws.
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    if ((req.url ?? "/").split("?")[0] !== WS_PATH) return;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Listeners are attached at once so frames sent on open (the client's auth) are not lost.
    const personaReady = (async () => {
      const role = cookieValue(req.headers.cookie, DEMO_ROLE_COOKIE);
      return isRole(role) ? loadPersona(role) : undefined;
    })().catch((err) => {
      logger.error({ err }, "chat socket persona lookup failed");
      return undefined;
    });

    ws.on("message", (raw) => {
      void personaReady.then(async (persona) => {
        if (!persona) return;
        let frame: { type?: unknown };
        try {
          frame = JSON.parse(raw.toString()) as { type?: unknown };
        } catch {
          return;
        }
        await handleFrame(ws, persona, frame).catch((err) => {
          logger.error({ err, userId: persona.id }, "chat message failed");
          send(ws, { type: "error", message: "Failed to save message" });
        });
      });
    });
    ws.on("pong", () => alive.set(ws, true));
    ws.on("close", () => clients.delete(ws));
    ws.on("error", (err) => {
      logger.warn({ err }, "chat socket error");
      clients.delete(ws);
    });

    void personaReady.then((persona) => {
      if (!persona) {
        ws.close(CLOSE_NO_PERSONA, "Select a role to continue");
        return;
      }
      clients.add(ws);
      alive.set(ws, true);
    });
  });

  // Heartbeat: a socket that has not answered the previous ping is dead.
  const heartbeat = setInterval(() => {
    for (const ws of clients) {
      if (alive.get(ws) === false) {
        clients.delete(ws);
        ws.terminate();
        continue;
      }
      alive.set(ws, false);
      ws.ping();
    }
  }, HEARTBEAT_MS);

  // Retention: purge messages older than the retention window.
  const runCleanup = () =>
    purgeExpiredMessages()
      .then((n) => n && logger.info({ purged: n }, "chat retention cleanup"))
      .catch((err) => logger.error({ err }, "chat retention cleanup failed"));
  void runCleanup();
  const cleanup = setInterval(runCleanup, CLEANUP_MS);

  httpServer.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(cleanup);
    for (const ws of clients) ws.terminate();
    clients.clear();
    wss.close();
  });
}
