import type { Server, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, WebSocket } from "ws";
import { ROLES, type Role } from "@shared/constants";
import { DEMO_ROLE_COOKIE, loadPersona } from "../middleware/persona";
import { purgeExpiredMessages } from "../services/chat-service";
import { logger } from "../lib/logger";

/**
 * Push channel for the help-desk chat. Clients receive frames when a message
 * is posted, deleted or the room is cleared; they never send chat content
 * here (posting goes through REST, which calls `broadcast`). The only
 * client→server frame is {type:'ping'}, answered with {type:'pong'}.
 */

export const WS_PATH = "/ws";
const HEARTBEAT_MS = 30_000;
const CLEANUP_MS = 6 * 60 * 60 * 1000;
/** Close code sent when the visitor has not chosen a role. */
const CLOSE_NO_PERSONA = 4401;

export type ServerFrame =
  | { type: "message"; message: unknown }
  | { type: "deleted"; id: number }
  | { type: "cleared" }
  | { type: "pong" };

const clients = new Set<WebSocket>();
const alive = new WeakMap<WebSocket, boolean>();

/** Send a JSON frame to every open socket. */
export function broadcast(frame: object): void {
  const data = JSON.stringify(frame);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (!name) continue;
    const raw = part.slice(idx + 1).trim();
    try {
      out[name] = decodeURIComponent(raw);
    } catch {
      out[name] = raw;
    }
  }
  return out;
}

function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

function pathnameOf(req: IncomingMessage): string {
  const url = req.url ?? "/";
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

export function attachChatServer(httpServer: Server): void {
  // `noServer` so that upgrades for other paths (Vite HMR in development)
  // are left untouched instead of being answered with a 400 by ws.
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    if (pathnameOf(req) !== WS_PATH) return;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const role = parseCookies(req.headers.cookie)[DEMO_ROLE_COOKIE];
    void (async () => {
      const persona = isRole(role) ? await loadPersona(role).catch(() => undefined) : undefined;
      if (!persona) {
        ws.close(CLOSE_NO_PERSONA, "Select a role to continue");
        return;
      }
      clients.add(ws);
      alive.set(ws, true);

      ws.on("pong", () => alive.set(ws, true));
      ws.on("message", (raw) => {
        try {
          const frame = JSON.parse(raw.toString()) as { type?: unknown };
          if (frame.type === "ping" && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "pong" } satisfies ServerFrame));
          }
        } catch {
          // Malformed frames are ignored; chat content is never accepted here.
        }
      });
      ws.on("close", () => clients.delete(ws));
      ws.on("error", (err) => {
        logger.warn({ err, userId: persona.id }, "chat socket error");
        clients.delete(ws);
      });
    })().catch((err) => {
      logger.error({ err }, "chat socket auth failed");
      ws.close(CLOSE_NO_PERSONA, "Select a role to continue");
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
