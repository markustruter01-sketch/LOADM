import { Router } from "express";
import { asyncHandler } from "../lib/async";
import { requirePersona, requireCommand, currentUser } from "../middleware/persona";
import { listRecentMessages, clearMessages } from "../services/chat-service";
import { logActivity } from "../services/activity-service";

/** Mounted at /api/chat-messages. Posting happens over the WebSocket (server/ws/chat.ts). */
export const chatRouter = Router();

/** Messages from the last 7 days, oldest first. */
chatRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (_req, res) => {
    res.json(await listRecentMessages());
  }),
);

/** Clear the whole room. Command only. */
chatRouter.delete(
  "/reset",
  requireCommand,
  asyncHandler(async (req, res) => {
    const deleted = await clearMessages();
    await logActivity({ actor: currentUser(req), action: "DELETE", resourceType: "ChatMessage", resourceName: "All chat messages", details: `${deleted} messages cleared` });
    res.json({ message: "All chat messages have been permanently deleted", success: true });
  }),
);
