import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Scale, Package, AlertTriangle, MessageCircle, Bot, Send } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  calculateBalance, 
  AIRCRAFT_CONFIGS, 
  type CargoPosition, 
  type BalanceResult,
  type AircraftConfig
} from "@/utils/simple-balance";

export default function LoadPlanningPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/load-planning/:aircraftId");
  
  const aircraftId = params?.aircraftId || 'c130';
  const config = AIRCRAFT_CONFIGS[aircraftId];
  
  if (!config) {
    navigate("/load-planning");
    return null;
  }

  // Initialize cargo positions for the aircraft
  const [cargoPositions, setCargoPositions] = useState<CargoPosition[]>(() => 
    Array.from({ length: config.positions }, (_, i) => ({
      id: `P${i + 1}`,
      label: `P${i + 1}`,
      weight: 0,
      position: i,
      cargoType: 'General',
      dgClass: '',
      description: ''
    }))
  );

  const [balanceResult, setBalanceResult] = useState<BalanceResult>({
    balance: 0,
    centerOfGravity: (config.forwardLimit + config.aftLimit) / 2,
    status: 'safe',
    totalWeight: 0
  });

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    type: 'user' | 'bot';
    message: string;
    timestamp: Date;
  }>>([
    {
      type: 'bot',
      message: `Welcome to your ${config.name} Load Planning Assistant! I can help you optimize cargo placement and provide safety recommendations for dangerous goods positioning.`,
      timestamp: new Date()
    }
  ]);

  // Cargo edit dialog state
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState(0);
  const [editCargoType, setEditCargoType] = useState('General');
  const [editDgClass, setEditDgClass] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Recalculate balance whenever cargo changes
  useEffect(() => {
    const result = calculateBalance(cargoPositions, aircraftId);
    setBalanceResult(result);
  }, [cargoPositions, aircraftId]);

  // AI Chatbot functions
  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const totalWeight = balanceResult.totalWeight;
    const balance = balanceResult.balance;
    const status = balanceResult.status;
    
    // Analyze current load state
    const loadedPositions = cargoPositions.filter(pos => pos.weight > 0);
    const hasHeavyItems = loadedPositions.some(pos => pos.weight > 10000);
    const hasDangerousGoods = message.includes('dg') || message.includes('dangerous') || message.includes('hazmat');
    
    // Safety and balance recommendations
    if (message.includes('balance') || message.includes('weight') || message.includes('optimize')) {
      const centerPositions = config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      
      if (status === 'critical') {
        return `⚠️ CRITICAL BALANCE ISSUE: Your current load is ${balance > 0 ? 'too aft' : 'too forward'}. IMMEDIATE ACTION: Move heavy items to center positions (${centerPositions}) to achieve optimal center of gravity at ${optimalCG.toFixed(1)}%. This will provide maximum stability and performance.`;
      } else if (status === 'warning') {
        return `⚡ Balance is approaching limits. Current CG: ${balanceResult.centerOfGravity.toFixed(1)}%. OPTIMIZATION: Move cargo closer to center positions (${centerPositions}) for optimal CG at ${optimalCG.toFixed(1)}%. Even within limits, center loading provides better aircraft handling.`;
      } else {
        return `✅ Balance is within limits (CG: ${balanceResult.centerOfGravity.toFixed(1)}%). OPTIMIZATION OPPORTUNITY: For maximum efficiency and handling, redistribute cargo to center positions (${centerPositions}). Target optimal CG: ${optimalCG.toFixed(1)}%. Center loading reduces structural stress and improves fuel efficiency.`;
      }
    }
    
    if (hasDangerousGoods || message.includes('rear') || message.includes('emergency')) {
      return `🔥 DANGEROUS GOODS SAFETY: Always place dangerous goods (DG) toward the rear of the aircraft. This allows for emergency jettison if needed. Rear positions like ${config.name === 'C-17' ? 'P15-P18' : 'P7-P8'} are ideal for DG cargo. Never place DG near crew areas or fuel systems.`;
    }
    
    if (message.includes('heavy') || message.includes('distribution')) {
      const centerPositions = config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      return `📦 HEAVY CARGO OPTIMIZATION: Always prioritize center positions (${centerPositions}) for heavy items. This achieves optimal CG at ${optimalCG.toFixed(1)}% and minimizes structural stress. Distribute evenly across center positions rather than concentrating weight. Avoid forward/aft positions unless necessary for balance correction.`;
    }
    
    if (message.includes('center') || message.includes('cg')) {
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      const centerPositions = config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      return `⚖️ CENTER OF GRAVITY OPTIMIZATION: Current CG: ${balanceResult.centerOfGravity.toFixed(1)}%. Target optimal CG: ${optimalCG.toFixed(1)}%. Legal range: ${config.forwardLimit}%-${config.aftLimit}%. For best performance, place all cargo in center positions (${centerPositions}) to achieve optimal CG and minimize fuel consumption.`;
    }
    
    if (message.includes('positions') || message.includes('where')) {
      const centerPositions = config.name === 'C-17' ? 'P4-P6 and P13-P15' : 'P3-P4 and P7-P8';
      const optimalCG = (config.forwardLimit + config.aftLimit) / 2;
      return `📍 OPTIMAL POSITION STRATEGY: ${config.name} has ${config.positions} positions. PRIORITY ORDER: 1) Center positions (${centerPositions}) for optimal CG at ${optimalCG.toFixed(1)}%. 2) Use forward/aft positions only for fine balance adjustment. Always start with center loading for maximum efficiency.`;
    }
    
    // Default helpful response
    return `🚁 LOADMASTER ASSISTANT: I can help with cargo balance, dangerous goods placement, weight distribution, and safety recommendations. Try asking about "balance optimization", "dangerous goods safety", or "heavy cargo distribution". What specific guidance do you need?`;
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    
    // Add user message
    const userMessage = {
      type: 'user' as const,
      message: chatInput,
      timestamp: new Date()
    };
    
    // Generate AI response
    const aiResponse = {
      type: 'bot' as const,
      message: generateAIResponse(chatInput),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage, aiResponse]);
    setChatInput("");
  };

  const handleAnalyzeBalance = () => {
    const analysisMessage = {
      type: 'user' as const,
      message: "Analyze my current load balance",
      timestamp: new Date()
    };
    
    const aiResponse = {
      type: 'bot' as const,
      message: generateAIResponse("analyze balance weight optimize"),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, analysisMessage, aiResponse]);
  };

  const updateCargoWeight = (positionId: string, weight: number) => {
    setCargoPositions(prev => 
      prev.map(pos => 
        pos.id === positionId 
          ? { ...pos, weight: Math.max(0, weight) }
          : pos
      )
    );
  };

  const openCargoEdit = (position: CargoPosition) => {
    setEditingPosition(position.id);
    setEditWeight(position.weight);
    setEditCargoType(position.cargoType);
    setEditDgClass(position.dgClass);
    setEditDescription(position.description);
  };

  const saveCargoEdit = () => {
    if (!editingPosition) return;
    
    setCargoPositions(prev => 
      prev.map(pos => 
        pos.id === editingPosition 
          ? { ...pos, weight: editWeight, cargoType: editCargoType, dgClass: editDgClass, description: editDescription }
          : pos
      )
    );
    
    setEditingPosition(null);
    setEditWeight(0);
    setEditCargoType('General');
    setEditDgClass('');
    setEditDescription('');
  };

  const resetAllCargo = () => {
    setCargoPositions(prev => 
      prev.map(pos => ({ ...pos, weight: 0 }))
    );
  };

  // Reusable cargo position component
  const renderCargoPosition = (position: CargoPosition, maxWeight = 15000) => (
    <div key={position.id} className="space-y-2">
      <div 
        className={`relative border-2 rounded-lg p-3 transition-all duration-300 cursor-pointer hover:border-primary ${
          position.weight > 0 
            ? 'border-orange-500 bg-orange-500/20' 
            : 'border-gray-600 bg-gray-700/30'
        }`}
        onClick={() => openCargoEdit(position)}
      >
        <Label className="text-muted-foreground300 font-bold text-center block mb-2 text-sm">
          {position.label}
        </Label>
        
        {/* Weight display */}
        <div className="text-center text-lg font-semibold text-card-foreground mb-1">
          {position.weight > 0 ? position.weight.toLocaleString() : '0'}
        </div>
        <div className="text-xs text-muted-foreground400 text-center">lbs</div>
        
        {/* Cargo type display */}
        {position.cargoType !== 'General' && (
          <div className="text-xs text-center mt-2">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {position.cargoType === 'DG' ? 'DG' : position.cargoType}
            </Badge>
          </div>
        )}
        
        {position.dgClass && (
          <div className="text-xs text-center mt-1">
            <Badge variant="destructive" className="text-xs px-1 py-0">
              Class {position.dgClass}
            </Badge>
          </div>
        )}
        
        {position.description && (
          <div className="text-xs text-center mt-1 text-muted-foreground truncate" title={position.description}>
            {position.description}
          </div>
        )}
        
        {/* Weight visualization */}
        {position.weight > 0 && (
          <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
        )}
        
        {/* Click indicator */}
        <div className="absolute top-1 right-1 text-xs text-muted-foreground opacity-50">
          ✏️
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: BalanceResult['status']) => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'caution': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBalanceBarPosition = () => {
    // Convert balance (-100 to +100) to percentage (0 to 100)
    return ((balanceResult.balance + 100) / 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{config.name} Load Planning | LOADMworkflow</title>
        <meta name="description" content={`Load planning for ${config.name}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/load-planning")}
            className="border-gray-600 text-muted-foreground300 hover:bg-gray-700 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">{config.name} Load Planning</h1>
            <p className="text-muted-foreground300">Max Payload: {config.maxWeight.toLocaleString()} lbs | Max Positions: {config.positions}</p>
          </div>
        </div>

        {/* Load Summary */}
        <Card className="bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Load Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground400">Current Load</Label>
                <p className="text-2xl font-bold text-card-foreground">{balanceResult.totalWeight.toLocaleString()} lbs</p>
              </div>
              <div>
                <Label className="text-muted-foreground400">Maximum Payload</Label>
                <p className="text-2xl font-bold text-muted-foreground300">{config.maxWeight.toLocaleString()} lbs</p>
              </div>
              <div>
                <Label className="text-muted-foreground400">Positions Filled</Label>
                <p className="text-2xl font-bold text-blue-400">
                  {cargoPositions.filter(p => p.weight > 0).length} of {config.positions}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground400">Center of Gravity</Label>
                <p className="text-2xl font-bold text-green-400">{balanceResult.centerOfGravity.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Display */}
        <Card className="bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Balance Scale
              <Badge className={getStatusColor(balanceResult.status)}>
                {balanceResult.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Balance Status Alert */}
              {balanceResult.status !== 'safe' && (
                <Alert className="border-orange-500 bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-orange-200">
                    Aircraft balance is {balanceResult.status}. 
                    {balanceResult.status === 'critical' && ' Immediate attention required!'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Balance Bar */}
              <div className="relative">
                <div className="flex justify-between text-sm text-muted-foreground400 mb-2">
                  <span>Heavy Forward</span>
                  <span>Center</span>
                  <span>Heavy Aft</span>
                </div>
                <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-green-500 to-red-500 opacity-30"></div>
                  
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 transform -trangray-x-0.5"></div>
                  
                  {/* Balance indicator */}
                  <div 
                    className="absolute top-1 bottom-1 w-2 bg-white rounded-sm transition-all duration-300"
                    style={{ left: `calc(${getBalanceBarPosition()}% - 4px)` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground500 mt-1">
                  <span>-100</span>
                  <span>0</span>
                  <span>+100</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-bold text-card-foreground">
                    Balance: {balanceResult.balance.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cargo Positions */}
        <Card className="bg-card mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">Cargo Bay Layout</CardTitle>
            <Button 
              variant="outline" 
              onClick={resetAllCargo}
              className="border-gray-600 text-muted-foreground300 hover:bg-gray-700"
            >
              Reset All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Aircraft Direction Indicator */}
              <div className="flex items-center justify-center gap-4 text-muted-foreground400 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-400"></div>
                  <span>NOSE (Forward)</span>
                </div>
                <div className="flex-1 border-t border-dashed border-gray-600"></div>
                <span>TAIL (Aft)</span>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
              </div>

              {/* C-130 Cargo Bay Layout (2 rows x 4 columns) */}
              {aircraftId === 'c130' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className="space-y-3">
                    {/* Upper Row (P1-P4) */}
                    <div className="grid grid-cols-4 gap-3">
                      {cargoPositions.slice(0, 4).map((position) => renderCargoPosition(position, 10000))}
                    </div>
                    
                    {/* Lower Row (P5-P8) */}
                    <div className="grid grid-cols-4 gap-3">
                      {cargoPositions.slice(4, 8).map((position) => renderCargoPosition(position, 10000))}
                    </div>
                  </div>
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-between text-xs text-muted-foreground500 mt-4">
                    <span>Forward Cargo Bay</span>
                    <span>Aft Cargo Bay</span>
                  </div>
                </div>
              )}

              {/* C-17 Cargo Bay Layout (2 rows x 9 columns) */}
              {aircraftId === 'c17' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className="space-y-3">
                    {/* Upper Row (P1-P9) */}
                    <div className="grid grid-cols-9 gap-2">
                      {cargoPositions.slice(0, 9).map((position) => (
                        <div key={position.id} className="space-y-2">
                          <div className={`relative border-2 rounded-lg p-2 transition-all duration-300 ${
                            position.weight > 0 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-gray-600 bg-gray-700/30'
                          }`}>
                            <Label className="text-muted-foreground300 font-bold text-center block mb-1 text-xs">
                              {position.label}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={15000}
                              value={position.weight || ''}
                              onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-600 text-card-foreground text-center text-xs h-8"
                              placeholder="0"
                            />
                            <div className="text-xs text-muted-foreground400 text-center">lbs</div>
                            {position.weight > 0 && (
                              <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Lower Row (P10-P18) */}
                    <div className="grid grid-cols-9 gap-2">
                      {cargoPositions.slice(9, 18).map((position) => (
                        <div key={position.id} className="space-y-2">
                          <div className={`relative border-2 rounded-lg p-2 transition-all duration-300 ${
                            position.weight > 0 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-gray-600 bg-gray-700/30'
                          }`}>
                            <Label className="text-muted-foreground300 font-bold text-center block mb-1 text-xs">
                              {position.label}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={15000}
                              value={position.weight || ''}
                              onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-600 text-card-foreground text-center text-xs h-8"
                              placeholder="0"
                            />
                            <div className="text-xs text-muted-foreground400 text-center">lbs</div>
                            {position.weight > 0 && (
                              <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-between text-xs text-muted-foreground500 mt-4">
                    <span>Forward Cargo Bay</span>
                    <span>Aft Cargo Bay</span>
                  </div>
                </div>
              )}

              {/* Other Aircraft Layouts (C-27J, KC-30A) */}
              {aircraftId !== 'c130' && aircraftId !== 'c17' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className={`grid gap-3 ${
                    aircraftId === 'c27j' ? 'grid-cols-3' : 'grid-cols-6'
                  }`}>
                    {cargoPositions.map((position) => (
                      <div key={position.id} className="space-y-2">
                        <div className={`relative border-2 rounded-lg p-3 transition-all duration-300 ${
                          position.weight > 0 
                            ? 'border-orange-500 bg-orange-500/20' 
                            : 'border-gray-600 bg-gray-700/30'
                        }`}>
                          <Label className="text-muted-foreground300 font-bold text-center block mb-2 text-sm">
                            {position.label}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={15000}
                            value={position.weight || ''}
                            onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                            className="bg-gray-800 border-gray-600 text-card-foreground text-center text-xs"
                            placeholder="0"
                          />
                          <div className="text-xs text-muted-foreground400 text-center mt-1">lbs</div>
                          {position.weight > 0 && (
                            <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/home")}
            className="border-gray-600 text-muted-foreground300 hover:bg-gray-700"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* AI Load Planning Assistant Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Load Planning Assistant</CardTitle>
              </div>
              <Button 
                onClick={handleAnalyzeBalance}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <Scale className="h-4 w-4 mr-2" />
                Analyse Balance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto space-y-3 mb-4 p-3 bg-muted/30 rounded-lg">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    msg.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card text-card-foreground border border-border'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about balance, dangerous goods, or cargo placement..."
                className="flex-1 min-h-0 h-10 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit();
                  }
                }}
              />
              <Button 
                onClick={handleChatSubmit}
                size="sm"
                className="h-10 w-10 p-0 bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="border-gray-600 text-muted-foreground300 hover:bg-gray-700"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Cargo Edit Dialog */}
      <Dialog open={editingPosition !== null} onOpenChange={(open) => !open && setEditingPosition(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Cargo Details - {editingPosition}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                type="number"
                min="0"
                max="15000"
                value={editWeight}
                onChange={(e) => setEditWeight(parseInt(e.target.value) || 0)}
                placeholder="Enter weight in pounds..."
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargoType">Cargo Type</Label>
              <Select value={editCargoType} onValueChange={setEditCargoType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General Cargo</SelectItem>
                  <SelectItem value="Mechanical">Mechanical Parts</SelectItem>
                  <SelectItem value="Perishable">Perishable Goods</SelectItem>
                  <SelectItem value="Passenger Bags">Passenger Bags</SelectItem>
                  <SelectItem value="Military Equipment">Military Equipment</SelectItem>
                  <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Ammunition">Ammunition</SelectItem>
                  <SelectItem value="Fuel/Oil">Fuel/Oil</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="DG">Dangerous Goods</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editCargoType === 'DG' && (
              <div className="space-y-2">
                <Label htmlFor="dgClass">Dangerous Goods Class</Label>
                <Select value={editDgClass} onValueChange={setEditDgClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select DG class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Class 1 - Explosives</SelectItem>
                    <SelectItem value="2">Class 2 - Gases</SelectItem>
                    <SelectItem value="3">Class 3 - Flammable Liquids</SelectItem>
                    <SelectItem value="4">Class 4 - Flammable Solids</SelectItem>
                    <SelectItem value="5">Class 5 - Oxidizers</SelectItem>
                    <SelectItem value="6">Class 6 - Toxic Substances</SelectItem>
                    <SelectItem value="7">Class 7 - Radioactive</SelectItem>
                    <SelectItem value="8">Class 8 - Corrosives</SelectItem>
                    <SelectItem value="9">Class 9 - Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter cargo description..."
                className="bg-muted"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingPosition(null)}>
                Cancel
              </Button>
              <Button onClick={saveCargoEdit} className="bg-primary hover:bg-primary/90">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}