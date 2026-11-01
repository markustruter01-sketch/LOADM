import { asc, gte, lt } from "drizzle-orm";
import { db } from "../db";
import { chatMessages, type ChatMessage, type User } from "@shared/schema";
import { THRESHOLDS } from "@shared/constants";
import { clientRole, personName } from "../lib/client-format";

const DAY_MS = 86_400_000;

function retentionCutoff(): Date {
  return new Date(Date.now() - THRESHOLDS.CHAT_RETENTION_DAYS * DAY_MS);
}

/** The flat message shape the chat panel reads (components/chat-system.tsx). */
function toClientMessage(row: ChatMessage, author: User) {
  return {
    ...row,
    userName: personName(author),
    userRole: clientRole(author.role),
    profilePhotoUrl: null,
  };
}

/** Messages inside the retention window, oldest first. */
export async function listRecentMessages() {
  const rows = await db.query.chatMessages.findMany({
    where: gte(chatMessages.createdAt, retentionCutoff()),
    with: { user: true },
    orderBy: [asc(chatMessages.createdAt)],
  });
  return rows.map(({ user, ...row }) => toClientMessage(row, user));
}

export async function createMessage(author: User, input: { messageType: ChatMessage["messageType"]; content: string }) {
  const [row] = await db
    .insert(chatMessages)
    .values({ userId: author.id, messageType: input.messageType, content: input.content })
    .returning();
  return toClientMessage(row, author);
}

export async function clearMessages(): Promise<number> {
  const deleted = await db.delete(chatMessages).returning({ id: chatMessages.id });
  return deleted.length;
}

/** Remove messages older than the retention window. Returns the number purged. */
export async function purgeExpiredMessages(): Promise<number> {
  const deleted = await db.delete(chatMessages).where(lt(chatMessages.createdAt, retentionCutoff())).returning({ id: chatMessages.id });
  return deleted.length;
}
