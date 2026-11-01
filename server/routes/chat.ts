import { Router } from "express";
import type { z } from "zod";
import { insertChatMessageSchema } from "@shared/schema";
import { roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt } from "../lib/ids";
import { Forbidden } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireCommand, currentUser, canActFor } from "../middleware/persona";
import { listRecentMessages, createMessage, getMessage, deleteMessage, clearMessages } from "../services/chat-service";
import { logActivity } from "../services/activity-service";
import { broadcast } from "../ws/chat";

export const chatRouter = Router();

// ---- Messages ------------------------------------------------------------

/** Messages inside the retention window (oldest first) with their author. */
chatRouter.get(
  "/messages",
  requirePersona,
  asyncHandler(async (req, res) => {
    res.json(await listRecentMessages(parseOptionalInt(req.query.limit, 500, { min: 1, max: 1000 })));
  }),
);

/** Post a message. Only instructors and command may post answers. */
chatRouter.post(
  "/messages",
  requirePersona,
  validate(insertChatMessageSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertChatMessageSchema>;
    if (b.messageType === "answer" && !roleHas(me.role, "instruct")) {
      throw new Forbidden("Only instructors can post answers");
    }
    const message = await createMessage(me, b);
    broadcast({ type: "message", message });
    res.status(201).json(message);
  }),
);

/** Delete one message: its author, or any instructor. */
chatRouter.delete(
  "/messages/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const existing = await getMessage(id);
    if (!canActFor(me, existing.userId)) throw new Forbidden();
    await deleteMessage(id);
    await logActivity({ actor: me, action: "DELETE", resourceType: "ChatMessage", resourceId: id, resourceName: existing.content.slice(0, 80) });
    broadcast({ type: "deleted", id });
    res.json({ id });
  }),
);

/** Clear the whole room. Command only. */
chatRouter.delete(
  "/messages",
  requireCommand,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const deleted = await clearMessages();
    await logActivity({ actor: me, action: "DELETE", resourceType: "ChatMessage", resourceName: "All messages", details: `${deleted} messages cleared` });
    broadcast({ type: "cleared" });
    res.json({ deleted });
  }),
);
