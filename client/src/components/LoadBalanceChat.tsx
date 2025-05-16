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

// Helper function to generate local cargo balance analysis without relying on the API
function generateLocalBalanceAnalysis(
  cargoData: any[], 
  balanceData: { balanceValue: number; balanceCG: number }, 
  aircraftType: string
): string {
  // If no cargo is loaded
  if (!cargoData || cargoData.length === 0) {
    return "I don't see any cargo loaded yet. Start by adding some pallets to the cargo area, and I can help analyze the balance.";
  }
  
  const { balanceValue, balanceCG } = balanceData;
  const totalWeight = cargoData.reduce((sum, pallet) => sum + (pallet.weight || 0), 0);
  const palletCount = cargoData.length;
  
  // Get proper aircraft name for display
  const aircraftName = 
    aircraftType === 'c17' ? 'C-17 Globemaster' : 
    aircraftType === 'c130' ? 'C-130 Hercules' : 
    aircraftType === 'kc30a' ? 'KC30-A Airbus' : 'C-27J Spartan';
  
  // Max capacities
  const maxCapacity = 
    aircraftType === 'c17' ? 77500 : 
    aircraftType === 'c130' ? 20000 : 
    aircraftType === 'kc30a' ? 45000 : 11300;
  
  // Count positions - simplify for each aircraft
  const maxPositions = 
    aircraftType === 'c17' ? 18 : 
    aircraftType === 'c130' ? 8 : 3;
  
  // Determine if balance needs improvement
  const isBalanced = Math.abs(balanceValue) < 20;
  const isAcceptableCG = balanceCG >= 18 && balanceCG <= 88;
  
  // Basic analysis of current state
  let analysis = `**Current Cargo Configuration Analysis**\n\nAircraft: ${aircraftName}\nTotal Weight: ${totalWeight} kg (${Math.round(totalWeight/maxCapacity*100)}% of maximum capacity)\nPallets Loaded: ${palletCount} of ${maxPositions}\nCenter of Gravity: ${balanceCG.toFixed(2)}° (${isAcceptableCG ? 'within acceptable range' : 'outside acceptable range of 18° to 88°'})\nBalance Value: ${balanceValue.toFixed(2)} (${isBalanced ? 'well balanced' : Math.abs(balanceValue) < 40 ? 'slightly unbalanced' : 'significantly unbalanced'})\n\n`;
  
  // Generate recommendations based on balance
  if (!isBalanced) {
    analysis += "**Balance Recommendations:**\n\n";
    
    // Identify which direction the balance is off
    const heavySide = balanceValue < 0 ? "forward" : "aft";
    const lightSide = balanceValue < 0 ? "aft" : "forward";
    
    // Get pallets on each side for potential shuffling
    const heavySidePallets = cargoData.filter(p => {
      const posNum = parseInt(p.positionLabel?.substring(1) || "0");
      return heavySide === "forward" ? posNum <= Math.ceil(maxPositions/2) : posNum > Math.ceil(maxPositions/2);
    });
    
    // Generate specific shuffling recommendations
    if (heavySidePallets.length > 0) {
      // Find the heaviest pallet on the heavy side
      const heaviestPallet = [...heavySidePallets].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
      
      // Find potential swap targets (lighter pallets or empty positions)
      const potentialMovePositions = [];
      for (let i = 1; i <= maxPositions; i++) {
        const posLabel = `P${i}`;
        const isOccupied = cargoData.some(p => p.positionLabel === posLabel);
        const isOnLightSide = 
          (lightSide === "forward" && i <= Math.ceil(maxPositions/2)) ||
          (lightSide === "aft" && i > Math.ceil(maxPositions/2));
          
        if (isOnLightSide && !isOccupied) {
          potentialMovePositions.push(posLabel);
        }
      }
      
      if (potentialMovePositions.length > 0) {
        const targetPosition = potentialMovePositions[0];
        analysis += `1. Move the ${heaviestPallet.weight} kg pallet from position ${heaviestPallet.positionLabel} to position ${targetPosition} to shift weight ${lightSide}.\n`;
      } else {
        // Look for a lighter pallet on the light side to swap with
        const lightSidePallets = cargoData.filter(p => {
          const posNum = parseInt(p.positionLabel?.substring(1) || "0");
          return lightSide === "forward" ? posNum <= Math.ceil(maxPositions/2) : posNum > Math.ceil(maxPositions/2);
        });
        
        if (lightSidePallets.length > 0) {
          const lightestPallet = [...lightSidePallets].sort((a, b) => (a.weight || 0) - (b.weight || 0))[0];
          
          analysis += `1. Swap the ${heaviestPallet.weight} kg pallet at position ${heaviestPallet.positionLabel} with the ${lightestPallet.weight} kg pallet at position ${lightestPallet.positionLabel} to improve balance.\n`;
        }
      }
      
      // Suggest redistributing weight or adding counterbalance
      if (palletCount < maxPositions) {
        analysis += `2. Consider adding more weight to the ${lightSide} section to counterbalance the heavy ${heavySide}.\n`;
      } else {
        analysis += `2. Try redistributing some weight from ${heavySide} pallets to ${lightSide} pallets for better balance.\n`;
      }
    }
  } else {
    analysis += "**Analysis:**\n\nYour cargo is well-balanced with the center of gravity at an optimal position. No adjustments needed at this time.\n";
  }
  
  // Additional safety notes
  if (!isAcceptableCG) {
    analysis += "\n**⚠️ SAFETY WARNING:**\n\nYour cargo's center of gravity is outside the acceptable range (18° to 88°). This presents a significant flight risk and must be adjusted before takeoff.\n";
  }
  
  // Tips for maintaining balance during flight
  analysis += "\n**General Tips:**\n\n";
  analysis += "- Keep heavier items near the center line when possible\n";
  analysis += "- Distribute weight evenly between left and right sides\n";
  analysis += "- Secure all cargo properly to prevent shifting during flight\n";
  analysis += `- Monitor total weight (current: ${Math.round(totalWeight/maxCapacity*100)}% of capacity)\n`;
  
  return analysis;
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
  
  // Only auto-scroll to new messages when they're added, not on initial load
  useEffect(() => {
    // Only scroll if there's more than the initial welcome message
    if (messagesEndRef.current && messages.length > 1) {
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
        content: data.analysis,
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Use local fallback analysis instead of relying on API
      const analysis = generateLocalBalanceAnalysis(cargoData, balanceData, aircraftType);
      
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: analysis,
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
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