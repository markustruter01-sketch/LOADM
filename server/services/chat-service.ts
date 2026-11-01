import { asc, eq, gte, lt } from "drizzle-orm";
import { db } from "../db";
import { chatMessages, type ChatMessage, type User } from "@shared/schema";
import { THRESHOLDS } from "@shared/constants";
import { NotFound } from "../lib/errors";

const DAY_MS = 86_400_000;

/** The slice of a person attached to a chat message. */
export type ChatUser = Pick<User, "id" | "firstName" | "lastName" | "rank" | "role" | "squadron" | "profilePhotoUrl">;
export type ChatMessageWithUser = ChatMessage & { user: ChatUser };

export function toChatUser(u: User): ChatUser {
  const { id, firstName, lastName, rank, role, squadron, profilePhotoUrl } = u;
  return { id, firstName, lastName, rank, role, squadron, profilePhotoUrl };
}

export function retentionCutoff(now = Date.now()): Date {
  return new Date(now - THRESHOLDS.CHAT_RETENTION_DAYS * DAY_MS);
}

/** Messages inside the retention window, oldest first, with their author. */
export async function listRecentMessages(limit = 500): Promise<ChatMessageWithUser[]> {
  const rows = await db.query.chatMessages.findMany({
    where: gte(chatMessages.createdAt, retentionCutoff()),
    with: { user: true },
    orderBy: [asc(chatMessages.createdAt)],
    limit,
  });
  return rows.map((r) => ({ ...r, user: toChatUser(r.user) }));
}

export async function createMessage(
  author: User,
  input: { messageType: ChatMessage["messageType"]; content: string },
): Promise<ChatMessageWithUser> {
  const [row] = await db
    .insert(chatMessages)
    .values({ userId: author.id, messageType: input.messageType, content: input.content })
    .returning();
  return { ...row, user: toChatUser(author) };
}

export async function getMessage(id: number): Promise<ChatMessage> {
  const [row] = await db.select().from(chatMessages).where(eq(chatMessages.id, id)).limit(1);
  if (!row) throw new NotFound("Message");
  return row;
}

export async function deleteMessage(id: number): Promise<void> {
  const deleted = await db.delete(chatMessages).where(eq(chatMessages.id, id)).returning({ id: chatMessages.id });
  if (deleted.length === 0) throw new NotFound("Message");
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
