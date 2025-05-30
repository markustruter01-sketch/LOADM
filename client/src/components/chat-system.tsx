import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send } from "lucide-react";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import { formatDistanceToNow } from "date-fns";
import type { ChatMessage } from "../../../shared/schema";

export function ChatSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [messageType, setMessageType] = useState<"question" | "answer">("question");
  const [content, setContent] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useIsolatedAuth();

  // Fetch existing messages
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat-messages"],
    enabled: isOpen && !!user,
  });

  // WebSocket connection
  useEffect(() => {
    if (!isOpen || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      console.log("User object:", user);
      setIsConnected(true);
      
      // Authenticate with the server
      const authMessage = {
        type: "auth",
        userId: user.id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        userRole: user.role
      };
      console.log("Sending auth message:", authMessage);
      ws.send(JSON.stringify(authMessage));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);
      
      if (data.type === "new_message") {
        console.log("New message received:", data.message);
        // Update the messages cache
        queryClient.setQueryData(["/api/chat-messages"], (oldMessages: ChatMessage[] = []) => {
          return [...oldMessages, data.message];
        });
      }
      
      if (data.type === "error") {
        console.error("Chat error:", data.message);
      }
      
      if (data.type === "auth_success") {
        console.log("Authentication successful");
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [isOpen, user, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !content.trim() || !isConnected) {
      console.log("Cannot send message:", { socket: !!socket, content: content.trim(), isConnected });
      return;
    }

    // Validate permissions
    if (messageType === "answer" && user?.role !== "instructor" && user?.role !== "superadmin") {
      alert("Only instructors can post answers");
      return;
    }

    const messageData = {
      type: "chat_message",
      messageType,
      content: content.trim()
    };
    
    console.log("Sending message:", messageData);
    socket.send(JSON.stringify(messageData));

    setContent("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render if user is not authenticated
  if (!user) return null;

  return (
    <>
      {/* Chat bubble */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full p-0 shadow-lg hover:shadow-xl transition-shadow z-50"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat interface */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 w-96 h-[500px] shadow-xl border-2 flex flex-col z-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Support Chat</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 space-y-4">
            {/* Messages */}
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              {isLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex flex-col space-y-2">
                      {/* Message header */}
                      <div className="flex items-center gap-2">
                        <Badge variant={message.messageType === "question" ? "secondary" : "default"} className="text-xs">
                          {message.messageType === "question" ? "Q" : "A"}
                        </Badge>
                        <span className="text-sm font-semibold">{message.userName}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.userRole}
                        </Badge>
                      </div>
                      
                      {/* Chat bubble */}
                      <div className={`max-w-[280px] p-3 rounded-2xl ${
                        message.messageType === "question" 
                          ? "bg-gray-100 text-gray-800 rounded-tl-sm" 
                          : "bg-gray-200 text-gray-900 rounded-tl-sm"
                      }`}>
                        <div className="text-sm leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground ml-1">
                        {new Date(message.createdAt).toLocaleString('en-AU', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message input */}
            <div className="space-y-2">
              <Select value={messageType} onValueChange={(value: "question" | "answer") => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">Question</SelectItem>
                  {(user.role === "instructor" || user.role === "superadmin") && (
                    <SelectItem value="answer">Answer</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={messageType === "question" ? "Ask a question..." : "Provide an answer..."}
                  className="flex-1 min-h-[80px] resize-none"
                  disabled={!isConnected}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!content.trim() || !isConnected}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}