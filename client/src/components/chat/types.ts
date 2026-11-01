import type { ChatMessage, User } from "@shared/schema";

/** The slice of a person the server attaches to each chat message. */
export type ChatUser = Pick<User, "id" | "firstName" | "lastName" | "rank" | "role" | "squadron">;

/** GET /api/chat/messages row, POST response and WS `message` payload. */
export type ChatMessageWithUser = ChatMessage & { user: ChatUser };

/** Server → client WebSocket frames on /ws. */
export type ChatServerFrame =
  | { type: "message"; message: ChatMessageWithUser }
  | { type: "deleted"; id: number }
  | { type: "cleared" }
  | { type: "pong" };
