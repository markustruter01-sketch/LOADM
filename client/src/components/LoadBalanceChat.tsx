import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2, Send, MessagesSquare, Scale } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface LoadBalanceChatProps {
  cargoData: any;
  balanceData: {
    balanceValue: number;
    balanceCG: number;
  };
  aircraftType: string;
}

export default function LoadBalanceChat({ cargoData, balanceData, aircraftType }: LoadBalanceChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: `Hello! I'm your cargo balance assistant. I can help analyze your current load configuration and provide suggestions for optimizing balance. How can I help you today?`,
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Function to generate a balance analysis message
  const generateBalanceAnalysis = async () => {
    // Create a message that asks for balance analysis
    await sendMessage("Can you analyze my current cargo balance and provide suggestions?");
  };

  // Function to handle sending a message
  const sendMessage = async (content = inputValue) => {
    if (!content.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Prepare data for AI analysis
      const analysisData = {
        message: content,
        aircraftType,
        cargoData,
        balanceValue: balanceData.balanceValue,
        balanceCG: balanceData.balanceCG
      };
      
      // Make API request to our backend which will call OpenAI
      const response = await apiRequest("POST", "/api/load-planning/analysis", analysisData);
      
      if (!response.ok) {
        throw new Error("Failed to get balance analysis");
      }
      
      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.analysis || "I couldn't analyze your load balance at this time. Please try again later.",
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: "I'm having trouble analyzing your load balance right now. Please check your connection and try again.",
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle keyboard submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-card border-b border-border pb-3">
        <CardTitle className="text-md flex items-center">
          <MessagesSquare className="h-5 w-5 mr-2 text-primary" />
          Cargo Balance Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          <ScrollArea className="h-[300px] p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-card-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 p-4 border-t border-border">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={generateBalanceAnalysis}
          disabled={isLoading}
        >
          <Scale className="h-4 w-4 mr-2" />
          Analyze Cargo Balance
        </Button>
        <div className="flex items-stretch gap-2 w-full">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your cargo balance..."
            className="min-h-[40px] flex-1"
            disabled={isLoading}
          />
          <Button 
            size="icon"
            onClick={() => sendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}