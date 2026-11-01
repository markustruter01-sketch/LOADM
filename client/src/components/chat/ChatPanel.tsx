import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, HelpCircle, Send, Trash2 } from "lucide-react";
import { ROLE_LABELS, THRESHOLDS, roleHas } from "@shared/constants";
import { EmptyState, QueryState, formatDate } from "@/components/common";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePersona } from "@/lib/persona";
import { del, post } from "@/lib/api";
import { keys } from "@/lib/keys";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { upsertMessage, useChatSocket, type ChatSocketStatus } from "./useChatSocket";
import type { ChatMessageWithUser } from "./types";

type MessageType = ChatMessageWithUser["messageType"];

function dayLabel(d: Date): string {
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(today) - start(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatDate(d, { weekday: "long", day: "numeric", month: "short" });
}

function groupByDay(messages: ChatMessageWithUser[]): Array<{ label: string; key: string; items: ChatMessageWithUser[] }> {
  const groups: Array<{ label: string; key: string; items: ChatMessageWithUser[] }> = [];
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key = d.toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(m);
    else groups.push({ key, label: dayLabel(d), items: [m] });
  }
  return groups;
}

function MessageBubble({ m, mine, canDelete, onDelete }: { m: ChatMessageWithUser; mine: boolean; canDelete: boolean; onDelete: () => void }) {
  const isAnswer = m.messageType === "answer";
  const staff = roleHas(m.user.role, "instruct");
  return (
    <li className={cn("group flex gap-3", mine && "flex-row-reverse")}>
      <UserAvatar className="h-8 w-8 shrink-0" />
      <div className={cn("min-w-0 max-w-[85%]", mine && "items-end text-right")}>
        <div className={cn("mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground", mine && "justify-end")}>
          <span className="font-medium text-foreground">
            {m.user.rank} {m.user.firstName} {m.user.lastName}
          </span>
          {staff && (
            <Badge variant="outline" className="h-4 border-primary/50 px-1.5 text-[10px] text-primary">
              {ROLE_LABELS[m.user.role]}
            </Badge>
          )}
          <span>{new Date(m.createdAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div
          className={cn(
            "relative inline-block rounded-lg border px-3 py-2 text-left text-sm",
            isAnswer ? "border-primary/40 bg-primary/10" : "border-border/60 bg-card/80",
          )}
        >
          <div className={cn("mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide", isAnswer ? "text-primary" : "text-muted-foreground")}>
            {isAnswer ? <CheckCircle2 className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
            {isAnswer ? "Answer" : "Question"}
          </div>
          <p className="whitespace-pre-wrap break-words">{m.content}</p>
        </div>
        {canDelete && (
          <div className={cn("mt-0.5", mine ? "text-right" : "text-left")}>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
              aria-label="Delete message"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function ChatMessageList({ messages }: { messages: ChatMessageWithUser[] }) {
  const { user, can } = usePersona();
  const qc = useQueryClient();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupByDay(messages), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const remove = useMutation({
    mutationFn: (id: number) => del<{ id: number }>(`/api/chat/messages/${id}`),
    onSuccess: (_r, id) => qc.setQueryData<ChatMessageWithUser[]>(keys.chat.all, (old) => (old ?? []).filter((m) => m.id !== id)),
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not delete message", description: e.message }),
  });

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <div className="sticky top-0 z-10 mb-3 flex justify-center">
            <span className="rounded-full border border-border/60 bg-background/90 px-3 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur">{g.label}</span>
          </div>
          <ul className="space-y-4">
            {g.items.map((m) => {
              const mine = m.userId === user?.id;
              return <MessageBubble key={m.id} m={m} mine={mine} canDelete={mine || can("instruct")} onDelete={() => remove.mutate(m.id)} />;
            })}
          </ul>
        </section>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export function ChatComposer({ compact = false }: { compact?: boolean }) {
  const { can } = usePersona();
  const qc = useQueryClient();
  const { toast } = useToast();
  const instruct = can("instruct");
  const [content, setContent] = useState("");
  const [type, setType] = useState<MessageType>("question");
  const effectiveType: MessageType = instruct ? type : "question";

  const send = useMutation({
    mutationFn: (body: { messageType: MessageType; content: string }) => post<ChatMessageWithUser>("/api/chat/messages", body),
    onSuccess: (msg) => {
      qc.setQueryData<ChatMessageWithUser[]>(keys.chat.all, (old) => upsertMessage(old, msg));
      setContent("");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Message not sent", description: e.message }),
  });

  const submit = () => {
    const text = content.trim();
    if (!text || send.isPending) return;
    send.mutate({ messageType: effectiveType, content: text });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      {instruct && (
        <div className="inline-flex rounded-md border border-border/60 bg-background/40 p-0.5" role="group" aria-label="Message type">
          {(["question", "answer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn("rounded px-3 py-1 text-xs font-medium capitalize transition-colors", type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Label htmlFor={compact ? "chat-input-dock" : "chat-input"} className="sr-only">
          Message
        </Label>
        <Textarea
          id={compact ? "chat-input-dock" : "chat-input"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={4000}
          rows={compact ? 2 : 3}
          placeholder={effectiveType === "answer" ? "Write an answer…" : "Ask the crew a question…"}
          className="min-h-0 resize-none"
        />
        <Button type="submit" size="icon" disabled={!content.trim() || send.isPending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line · messages are kept {THRESHOLDS.CHAT_RETENTION_DAYS} days</p>
    </form>
  );
}

function StatusDot({ status }: { status: ChatSocketStatus }) {
  const label = status === "open" ? "Live" : status === "connecting" ? "Connecting…" : "Reconnecting…";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
      <span className={cn("h-2 w-2 rounded-full", status === "open" ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
      {label}
    </span>
  );
}

/** Message list + composer with live updates. Used by the chat page and the dock. */
export function ChatPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  const status = useChatSocket(true);
  const q = useQuery<ChatMessageWithUser[]>({ queryKey: keys.chat.all });

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs text-muted-foreground">Questions and answers from the last {THRESHOLDS.CHAT_RETENTION_DAYS} days</span>
        <StatusDot status={status} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-3 sm:p-4">
        <QueryState
          query={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No messages yet" description="Ask the first question; instructors will answer here." />}
        >
          {(messages) => <ChatMessageList messages={messages} />}
        </QueryState>
      </div>
      <div className="pt-3">
        <ChatComposer compact={compact} />
      </div>
    </div>
  );
}
