import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eraser } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChatPanel } from "@/components/chat/ChatPanel";
import type { ChatMessageWithUser } from "@/components/chat/types";
import { usePersona } from "@/lib/persona";
import { del } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const { can } = usePersona();
  const qc = useQueryClient();
  const { toast } = useToast();

  const clear = useMutation({
    mutationFn: () => del<{ deleted: number }>("/api/chat/messages"),
    onSuccess: (r) => {
      qc.setQueryData<ChatMessageWithUser[]>(keys.chat.all, []);
      toast({ title: "Chat cleared", description: `${r.deleted} message${r.deleted === 1 ? "" : "s"} removed.` });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not clear chat", description: e.message }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Crew chat"
        description="Ask loadmaster questions and get answers from instructors. Answers are highlighted."
        actions={
          can("command") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eraser className="mr-2 h-4 w-4" /> Clear chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear every message?</AlertDialogTitle>
                  <AlertDialogDescription>This removes the whole conversation for everyone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => clear.mutate()}>
                    Clear chat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        }
      />
      <ChatPanel className="h-[calc(100dvh-15rem)] min-h-[420px]" />
    </>
  );
}
