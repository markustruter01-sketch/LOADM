import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatPanel } from "./ChatPanel";

/**
 * Floating crew-chat button (bottom-right) that opens the chat in a side sheet.
 * Hidden on /chat itself. The panel (and its WebSocket) only mounts while open.
 */
export function ChatDock() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  if (location === "/chat" || location.startsWith("/chat/")) return null;

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full shadow-lg shadow-primary/20"
        aria-label="Open crew chat"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-4 sm:max-w-md">
          <SheetHeader className="pb-2 text-left">
            <SheetTitle>Crew chat</SheetTitle>
            <SheetDescription>Questions for the crew; answers from instructors.</SheetDescription>
          </SheetHeader>
          {open && <ChatPanel compact className="min-h-0 flex-1" />}
        </SheetContent>
      </Sheet>
    </>
  );
}
